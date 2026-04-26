# cert-management

A production-ready backend service for managing multiple certificate and document types through a unified REST API. Built with Node.js, Express, and PostgreSQL.

Engineered so that **adding a new document type requires zero changes to any existing file** — only a single new processor file and one `require()` line in `index.js`.

---

## Prerequisites

| Requirement | Version |
|-------------|---------|
| Node.js     | ≥ 16.0.0 |
| npm         | ≥ 7.0.0  |
| PostgreSQL  | ≥ 13.0   |

---

## Setup

### 1. Clone and install dependencies

```bash
git clone <your-repo-url>
cd cert-management
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` with your PostgreSQL credentials:

```env
DATABASE_URL=postgres://postgres:yourpassword@localhost:5432/cert_management
PORT=3000
NODE_ENV=development
```

### 3. Create the database

```bash
createdb cert_management
# or using psql:
psql -U postgres -c "CREATE DATABASE cert_management;"
```

### 4. Run the database migration

```bash
psql $DATABASE_URL -f migrations/init.sql
```

This creates the `documents` table and its index. The script is **idempotent** — safe to run multiple times.

### 5. Start the server

```bash
# Production
npm start

# Development (auto-restart on file changes, requires nodemon)
npm run dev
```

You should see:

```
[Factory] Registered processor for document_type: "degree_certificate"
[Factory] Registered processor for document_type: "aadhar_card"
[Factory] Registered processor for document_type: "college_id"
[DB] Connection verified successfully
[Server] cert-management is running
[Server] Listening on port 3000
[Server] POST http://localhost:3000/store  → store a document
[Server] GET  http://localhost:3000/fetch  → fetch documents
```

---

## API Reference

### POST /store

Store a new document. The `document_type` field determines which validation rules apply.

**Request headers:**
```
Content-Type: application/json
```

**Success response** `201 Created`:
```json
{
  "success": true,
  "id": 1,
  "document_type": "aadhar_card",
  "created_at": "2024-01-15T10:30:00.000Z"
}
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| `400`  | Missing or empty `document_type` field |
| `400`  | Unknown `document_type` (not registered) |
| `400`  | Malformed JSON body |
| `422`  | Validation failed — response includes `errors` array |
| `500`  | Database error |

---

### GET /fetch

Retrieve stored documents with optional filters.

| Query Param | Description |
|-------------|-------------|
| *(none)*    | Returns all documents |
| `?type=X`   | Filter by document type |
| `?id=N`     | Fetch single document by id |

**Success response** `200 OK`:
```json
{
  "success": true,
  "count": 2,
  "documents": [ ... ]
}
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| `404`  | `?id=N` specified but document not found |
| `400`  | `?id` is not a positive integer |
| `500`  | Database error |

> **Note:** `?type=unknown_type` returns `200` with an empty array — not a `400` or `404`.

---

## curl Examples

### Aadhar Card

**Store:**
```bash
curl -X POST http://localhost:3000/store \
  -H "Content-Type: application/json" \
  -d '{
    "document_type": "aadhar_card",
    "full_name": "Ravi Kumar",
    "aadhar_number": "123456789012",
    "date_of_birth": "1995-06-15",
    "address": "123 MG Road, Bengaluru",
    "gender": "Male",
    "mobile_number": "9876543210"
  }'
```

**Expected response (201):**
```json
{ "success": true, "id": 1, "document_type": "aadhar_card", "created_at": "..." }
```

---

### Degree Certificate

**Store:**
```bash
curl -X POST http://localhost:3000/store \
  -H "Content-Type: application/json" \
  -d '{
    "document_type": "degree_certificate",
    "student_name": "Priya Sharma",
    "degree": "B.Tech",
    "university": "IIT Delhi",
    "year_of_passing": 2023,
    "grade": "A",
    "roll_number": "2019CS001",
    "specialisation": "Computer Science"
  }'
```

**Expected response (201):**
```json
{ "success": true, "id": 2, "document_type": "degree_certificate", "created_at": "..." }
```

---

### College ID

**Store:**
```bash
curl -X POST http://localhost:3000/store \
  -H "Content-Type: application/json" \
  -d '{
    "document_type": "college_id",
    "student_name": "Arjun Mehta",
    "student_id": "CS2021001",
    "college_name": "National Institute of Technology",
    "department": "Computer Science",
    "valid_until": "2025-05-31",
    "course": "B.Tech",
    "year_of_study": 3
  }'
```

**Expected response (201):**
```json
{ "success": true, "id": 3, "document_type": "college_id", "created_at": "..." }
```

---

### Fetch Examples

```bash
# Fetch all documents
curl http://localhost:3000/fetch

# Fetch all aadhar cards
curl "http://localhost:3000/fetch?type=aadhar_card"

# Fetch a specific document by id
curl "http://localhost:3000/fetch?id=1"

# Fetch all degree certificates
curl "http://localhost:3000/fetch?type=degree_certificate"
```

---

### Validation Error Examples

**Missing required field (422):**
```bash
curl -X POST http://localhost:3000/store \
  -H "Content-Type: application/json" \
  -d '{"document_type":"degree_certificate","student_name":"Priya"}'
```
```json
{
  "success": false,
  "errors": [
    "degree is required",
    "university is required",
    "year_of_passing is required",
    "grade is required"
  ]
}
```

**Invalid aadhar number (422):**
```bash
curl -X POST http://localhost:3000/store \
  -H "Content-Type: application/json" \
  -d '{"document_type":"aadhar_card","full_name":"Ravi","aadhar_number":"123","date_of_birth":"1995-06-15","address":"Bengaluru"}'
```
```json
{
  "success": false,
  "errors": ["aadhar_number must be exactly 12 digits"]
}
```

**Unknown document type (400):**
```bash
curl -X POST http://localhost:3000/store \
  -H "Content-Type: application/json" \
  -d '{"document_type":"passport"}'
```
```json
{
  "success": false,
  "error": "Unknown document_type: \"passport\". Valid types are: degree_certificate, aadhar_card, college_id"
}
```

---

## How to Add a New Document Type

**Three steps. Zero changes to existing files.**

### Step 1 — Create the processor file

```
src/processors/PassportProcessor.js
```

```js
'use strict';

const BaseProcessor = require('./BaseProcessor');
const { register }  = require('../factory/ProcessorFactory');

class PassportProcessor extends BaseProcessor {
  validate(payload) {
    const errors = [];

    if (!payload.full_name || typeof payload.full_name !== 'string' || payload.full_name.trim().length === 0) {
      errors.push('full_name is required');
    }
    if (!payload.passport_number || typeof payload.passport_number !== 'string') {
      errors.push('passport_number is required');
    }
    // ... add all your validation rules

    return { valid: errors.length === 0, errors };
  }

  process(payload) {
    return {
      full_name:       payload.full_name.trim(),
      passport_number: payload.passport_number.trim(),
      // ... include all fields
    };
  }
}

// Self-register — this is the magic line
register('passport', PassportProcessor);

module.exports = PassportProcessor;
```

### Step 2 — Add one require() line in `src/index.js`

```js
require('./processors/PassportProcessor'); // Add this line
```

### Step 3 — Done

- No changes to `documentHandler.js`
- No changes to `ProcessorFactory.js`
- No changes to `PostgresDocumentRepository.js`
- No changes to `routes/index.js`
- No changes to `migrations/init.sql`

The new type is immediately available via `POST /store` and `GET /fetch?type=passport`.

---

## Architecture

### Factory Pattern + Self-Registration

`ProcessorFactory` holds a `Map<string, ProcessorClass>`. Each processor file calls `register()` at module load time — the act of `require()`-ing the file is sufficient to register the type. `index.js` require-s all processor files at startup; the handler resolves processors by type string through `ProcessorFactory.resolve()` and never imports concrete classes directly.

**Why:** Decouples the handler from specific document types entirely. The handler works identically for all present and future types.

### Strategy Pattern

`BaseProcessor` defines the two-method contract: `validate(payload)` and `process(payload)`. Each concrete processor implements these methods. The handler calls them through the base interface — it doesn't know which concrete class it received. This is identical to how a sorting algorithm (Strategy) is swapped independently of the code that calls it.

**Why:** Each document type has completely different validation rules. Strategy isolates those differences into separate, independently testable classes rather than a growing if/switch in the handler.

### Repository Pattern

`IDocumentRepository` is an abstract class whose methods throw "not implemented". `PostgresDocumentRepository` extends it and is the **only place in the entire codebase where SQL exists**. The handler receives a repository instance and calls `save()`, `findAll()`, `findByType()`, `findById()` — no SQL, no `pg` awareness.

**Why:** Isolates persistence details. Swapping PostgreSQL for another database means writing one new class, not hunting SQL across the codebase. Also makes the handler unit-testable with a fake in-memory repository.

### Single Table Design

All document types share one `documents` table with a `JSONB data` column. No schema migration is needed when a new type is added — the type-specific fields live entirely in the JSON payload.

**Why:** Eliminates the operational cost of schema changes for every new document type and keeps queries simple.

---

## Document Schemas

### degree_certificate

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `student_name` | string | ✓ | non-empty |
| `degree` | string | ✓ | non-empty |
| `university` | string | ✓ | non-empty |
| `year_of_passing` | integer | ✓ | 1900–2100 |
| `grade` | string | ✓ | non-empty |
| `roll_number` | string | — | non-empty if provided |
| `specialisation` | string | — | non-empty if provided |

### aadhar_card

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `full_name` | string | ✓ | non-empty |
| `aadhar_number` | string | ✓ | exactly 12 digits |
| `date_of_birth` | string | ✓ | YYYY-MM-DD format |
| `address` | string | ✓ | non-empty |
| `gender` | string | — | non-empty if provided |
| `mobile_number` | string | — | exactly 10 digits if provided |

### college_id

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `student_name` | string | ✓ | non-empty |
| `student_id` | string | ✓ | non-empty |
| `college_name` | string | ✓ | non-empty |
| `department` | string | ✓ | non-empty |
| `valid_until` | string | ✓ | YYYY-MM-DD format |
| `course` | string | — | non-empty if provided |
| `year_of_study` | integer | — | positive integer if provided |

---

## Project Structure

```
cert-management/
├── src/
│   ├── index.js                          # Bootstrap: load env → register processors → verify DB → start server
│   ├── app.js                            # Express config: middleware, routes, error handlers
│   ├── db/
│   │   └── connection.js                 # pg Pool singleton + query helper + testConnection()
│   ├── repository/
│   │   ├── IDocumentRepository.js        # Abstract interface (throws on unimplemented methods)
│   │   └── PostgresDocumentRepository.js # All SQL lives here — implements all 4 interface methods
│   ├── processors/
│   │   ├── BaseProcessor.js              # Abstract Strategy base class: validate() + process()
│   │   ├── DegreeCertificateProcessor.js # Self-registers 'degree_certificate' at load time
│   │   ├── AadharCardProcessor.js        # Self-registers 'aadhar_card' at load time
│   │   └── CollegeIdProcessor.js         # Self-registers 'college_id' at load time
│   ├── factory/
│   │   └── ProcessorFactory.js           # Map registry: register(), resolve(), listTypes()
│   ├── handlers/
│   │   └── documentHandler.js            # Generic handler — zero doc-type-specific logic
│   └── routes/
│       └── index.js                      # Router: POST /store, GET /fetch
├── migrations/
│   └── init.sql                          # Idempotent schema: documents table + index
├── .env.example                          # Environment variable template
├── package.json
└── README.md
```
