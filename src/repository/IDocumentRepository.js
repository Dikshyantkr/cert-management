'use strict';

// js has no interface keyword so we fake it with a class that throws if methods arent overridden
// handler talks to this, not postgres directly, so swapping the db only needs a new subclass
class IDocumentRepository {

  // saves a new document, returns id, document_type and created_at
  async save(documentType, data) {
    throw new Error('IDocumentRepository.save() is not implemented');
  }

  // returns all documents newest first, empty array if none exist
  async findAll() {
    throw new Error('IDocumentRepository.findAll() is not implemented');
  }

  // returns documents matching a type, empty array if none match
  async findByType(documentType) {
    throw new Error('IDocumentRepository.findByType() is not implemented');
  }

  // returns one document by id, null if it doesnt exist
  async findById(id) {
    throw new Error('IDocumentRepository.findById() is not implemented');
  }
}

module.exports = IDocumentRepository;