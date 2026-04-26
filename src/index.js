'use strict';

// loading .env first as DATABASE_URL and PORT will be available before anything else runs
require('dotenv').config();

require('./processors/DegreeCertificateProcessor'); // registers 'degree_certificate'
require('./processors/AadharCardProcessor');         // registers 'aadhar_card'
require('./processors/CollegeIdProcessor');          // registers 'college_id'

const app                                   = require('./app');
const { testConnection, prepareStatements } = require('./db/connection');

// default to 3000 if PORT isn't in .env
const PORT = parseInt(process.env.PORT, 10) || 3000;

// async IIFE as we cantt use toplevel await in CommonJS
(async () => {
  try {
    await testConnection();    // stop if DB is unreachable
    await prepareStatements(); // logs plus register the prepared statements before traffic starts
  } catch (err) {
    console.error('[Startup] FATAL: Database connection failed.');
    console.error('[Startup] Error detail:', err.message);
    console.error('[Startup] Check that DATABASE_URL is set in your .env');
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`[Server] cert-management is running`);
    console.log(`[Server] Listening on port ${PORT}`);
    console.log(`[Server] POST http://localhost:${PORT}/store  → store a document`);
    console.log(`[Server] GET  http://localhost:${PORT}/fetch  → fetch documents`);
  });
})();
