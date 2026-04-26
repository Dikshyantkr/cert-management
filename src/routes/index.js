'use strict';

const express                           = require('express');
const { storeDocument, fetchDocuments } = require('../handlers/documentHandler');

// using a Router so app.js can mount it at any path prefix without touching this file
const router = express.Router();

// POST because we're creating a new resource and sending it twice creates two rows,which is fine
router.post('/store', storeDocument);

// GET because we're just reading 
router.get('/fetch', fetchDocuments);

module.exports = router;
