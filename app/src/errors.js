const logger = require('./logger');

function notFoundHandler(req, res) {
  res.status(404).json({ error: 'Endpoint not found' });
}

function globalErrorHandler(err, req, res, _next) {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    requestId: req.requestId
  });
  res.status(500).json({ error: 'Internal server error', requestId: req.requestId });
}

module.exports = { notFoundHandler, globalErrorHandler };
