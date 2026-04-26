'use strict';

const ProcessorFactory           = require('../factory/ProcessorFactory');
const PostgresDocumentRepository = require('../repository/PostgresDocumentRepository');
const DocumentCache              = require('../cache/DocumentCache');

// one shared instance is fine — the repository has no state of its own
const repository = new PostgresDocumentRepository();

// POST /store handler
// this function has no idea what document types exist,so it just asks the factory
// and lets the processor handle all the type specific stuff
// so adding a new document type never requires touching this file
const storeDocument = async (req, res) => {
  try {
    const body = req.body;

    // if the Content Type wasn't application/json, express.json() leaves body as undefined
    if (!body || body.document_type === undefined || body.document_type === null) {
      return res.status(400).json({
        success: false,
        error:   'document_type field is required',
      });
    }

    if (typeof body.document_type !== 'string' || body.document_type.trim() === '') {
      return res.status(400).json({
        success: false,
        error:   'document_type must be a non-empty string',
      });
    }

    const documentType = body.document_type.trim();

    // look up the right processor — returns null if the type isn't registered
    const ProcessorClass = ProcessorFactory.resolve(documentType);
    if (ProcessorClass === null) {
      return res.status(400).json({
        success: false,
        // include valid types in the error so the client knows what to use
        error: `Unknown document_type: "${documentType}". Valid types are: ${ProcessorFactory.listTypes().join(', ')}`,
      });
    }

    const processor = new ProcessorClass();

    // strip document_type out before passing to the processor as it doesn't need it
    const { document_type, ...payload } = body;

    const { valid, errors } = processor.validate(payload);

    if (!valid) {
      return res.status(422).json({ // 422 means the JSON was fine but the data didnt pass validation
        success: false,
        errors,
      });
    }

    const processedData = processor.process(payload); // trims strings, drops undefined optionals, etc.

    const record = await repository.save(documentType, processedData);

    // a new document was stored so any cached fetch results are now staleclear them all
    // better to re query once than to ever return outdated data
    DocumentCache.clear();

    return res.status(201).json({
      success:       true,
      id:            record.id,
      document_type: record.document_type,
      created_at:    record.created_at,
    });

  } catch (err) {
    // something unexpected happened, log it server-side but don't send details to the client
    console.error('[storeDocument] Unexpected error:', err.message);
    return res.status(500).json({
      success: false,
      error:   'Internal server error',
    });
  }
};

// GET /fetch handler
// three modes: ?id=N fetches one doc, ?type=X filters by type, no params returns all
const fetchDocuments = async (req, res) => {
  try {
    const { id, type } = req.query;

    // build a cache key that uniquely identifies this combination of query params
    const cacheKey = id !== undefined ? `id:${id}` : type !== undefined ? `type:${type}` : 'all';

    // check cache before hitting the database;  if it's there, return immediately
    const cached = DocumentCache.get(cacheKey);
    if (cached !== null) {
      return res.status(200).json(cached); // serve from memory, DB not touched
    }

    // ── fetch by id ────────────────────────────────────────────────────────
    if (id !== undefined) {
      const numericId = parseInt(id, 10); // query params are always strings, need to convert
      if (isNaN(numericId) || numericId < 1) {
        return res.status(400).json({
          success: false,
          error:   'id must be a positive integer',
        });
      }

      const document = await repository.findById(numericId);
      if (document === null) { // null means it wasn't found
        return res.status(404).json({
          success: false,
          error:   `Document with id ${numericId} not found`,
        });
      }

      const responseBody = {
        success:   true,
        count:     1,
        documents: [document], // wrapped in array so the response shape is always consistent
      };
      DocumentCache.set(cacheKey, responseBody); // cache for next time
      return res.status(200).json(responseBody);
    }

    // ── filter by type ─────────────────────────────────────────────────────
    if (type !== undefined) {
      // unknown types just return an empty array and not an error per the spec
      const documents = await repository.findByType(type);
      const responseBody = {
        success:   true,
        count:     documents.length,
        documents,
      };
      DocumentCache.set(cacheKey, responseBody);
      return res.status(200).json(responseBody);
    }

    // ── no filters — return everything ─────────────────────────────────────
    const documents = await repository.findAll();
    const responseBody = {
      success:   true,
      count:     documents.length,
      documents,
    };
    DocumentCache.set(cacheKey, responseBody);
    return res.status(200).json(responseBody);

  } catch (err) {
    console.error('[fetchDocuments] Unexpected error:', err.message);
    return res.status(500).json({
      success: false,
      error:   'Internal server error',
    });
  }
};

module.exports = { storeDocument, fetchDocuments };
