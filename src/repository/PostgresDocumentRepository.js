'use strict';

const IDocumentRepository = require('./IDocumentRepository');
const { PREPARED_QUERIES, pool } = require('../db/connection');

// all sql in the project lives here, nowhere else
// using named prepared queries so pg reuses the query plan instead of reparsing every time
class PostgresDocumentRepository extends IDocumentRepository {

  async save(documentType, data) {
    const result = await pool.query({
      ...PREPARED_QUERIES.insert,
      values: [documentType, JSON.stringify(data)], // stringify converts object to json for the db
    });
    return result.rows[0]; // returning gives us id and created_at without a second query
  }

  async findAll() {
    const result = await pool.query(PREPARED_QUERIES.findAll);
    return result.rows; // empty array if no documents exist
  }

  async findByType(documentType) {
    const result = await pool.query({
      ...PREPARED_QUERIES.findByType,
      values: [documentType],
    });
    return result.rows; // empty array if nothing matches
  }

  async findById(id) {
    const result = await pool.query({
      ...PREPARED_QUERIES.findById,
      values: [id],
    });
    if (result.rows.length === 0) {
      return null; // return null so the handler can send a 404
    }
    return result.rows[0];
  }
}

module.exports = PostgresDocumentRepository;