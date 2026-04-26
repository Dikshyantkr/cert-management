'use strict';

// logs method, path, status and how long each request took
// listens to finish event because status code isnt known until response is sent
const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const ms = Date.now() - start;
    console.log(`[Request] ${req.method} ${req.path} → ${res.statusCode} in ${ms}ms`);
  });

  next();
};

module.exports = requestLogger;