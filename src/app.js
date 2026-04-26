'use strict';

const express       = require('express');
const compression   = require('compression');
const routes        = require('./routes/index');
const requestLogger = require('./middleware/requestLogger');

// kept separate from index.js so tests can import app without starting a server
const app = express();

// gzip compresses responses and saves bandwidth on large fetch results
app.use(compression());

app.use(requestLogger);

// without this req.body is undefined on every POST request
app.use(express.json());

app.use('/', routes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error:   `Route ${req.method} ${req.path} not found`,
  });
});

// 4 params tells express this is an error handler and it catches malformed JSON bodies
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      error:   'Malformed JSON in request body',
    });
  }
  next(err);
});

module.exports = app;