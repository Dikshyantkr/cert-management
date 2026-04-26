'use strict';

const { Pool } = require('pg');
require('dotenv').config();

// pool handles multiple connections at once, single client can only do one query at a time
// same pool is shared across every file that imports this module
const pool = new Pool({
  connectionString:        process.env.DATABASE_URL,
  max:                     20,    // max connections open at once
  idleTimeoutMillis:       10000, // close idle connections after 10s
  connectionTimeoutMillis: 3000,  // give up waiting for a connection after 3s
});

// prevents crash if a connection breaks while sitting idle
pool.on('error', (err) => {
  console.error('[DB Pool] Unexpected error on idle client:', err.message);
  process.exit(1);
});

// wrapper so no other file touches the pool directly
const query = (text, params) => pool.query(text, params);

// predefined sql queries with names, pg reuses the query plan on each connection
// saves reparsing the same sql on every request
const PREPARED_QUERIES = {
  insert: {
    name: 'cert_insert_document',
    text: `INSERT INTO documents (document_type, data)
           VALUES ($1, $2)
           RETURNING id, document_type, created_at`,
  },
  findAll: {
    name: 'cert_find_all_documents',
    text: `SELECT id, document_type, data, created_at
           FROM documents
           ORDER BY created_at DESC`,
  },
  findByType: {
    name: 'cert_find_documents_by_type',
    text: `SELECT id, document_type, data, created_at
           FROM documents
           WHERE document_type = $1
           ORDER BY created_at DESC`,
  },
  findById: {
    name: 'cert_find_document_by_id',
    text: `SELECT id, document_type, data, created_at
           FROM documents
           WHERE id = $1`,
  },
};

// logs the prepared statement names at startup
const prepareStatements = async () => {
  const names = Object.values(PREPARED_QUERIES).map((q) => q.name);
  console.log('[DB] Prepared statements registered:', names.join(', '));
};

// checks db is reachable before server starts
const testConnection = async () => {
  const client = await pool.connect();
  client.release(); // only needed the check, return connection immediately
  console.log('[DB] Connection verified successfully');
};

module.exports = { pool, query, PREPARED_QUERIES, prepareStatements, testConnection };