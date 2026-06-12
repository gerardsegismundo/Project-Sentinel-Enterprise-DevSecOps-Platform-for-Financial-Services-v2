const logger = require('./logger');

function notFoundHandler(req, res) {
  res.status(404).json({ error: 'Endpoint not found' });
}

function globalErrorHandler(err, req, res, _next) {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
}

module.exports = { notFoundHandler, globalErrorHandler };
