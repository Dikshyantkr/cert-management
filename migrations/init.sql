-- run with: psql $DATABASE_URL -f migrations/init.sql
-- safe to run more than once — IF NOT EXISTS means it won't break anything

-- one table for all document types
-- the 'data' column stores the type-specific fields as JSON
-- this means adding a new document type needs zero schema changes
CREATE TABLE IF NOT EXISTS documents (
  id            SERIAL       PRIMARY KEY,   -- auto-incrementing id, unique across all doc types
  document_type VARCHAR(100) NOT NULL,       -- e.g. 'aadhar_card', 'degree_certificate'
  data          JSONB        NOT NULL,       -- all the type-specific fields go here
  created_at    TIMESTAMPTZ  DEFAULT NOW()   -- stored in UTC
);

-- speeds up queries that filter by document_type (the GET /fetch?type= endpoint uses this)
-- without it, postgres would scan the whole table every time
CREATE INDEX IF NOT EXISTS idx_documents_document_type
  ON documents(document_type);
