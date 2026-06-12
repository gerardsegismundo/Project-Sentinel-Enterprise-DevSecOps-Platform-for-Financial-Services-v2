const helmet = require('helmet');
const cors = require('cors');
const crypto = require('crypto');
const express = require('express');
const rateLimit = require('express-rate-limit');
const logger = require('./logger');

function applyMiddleware(app) {
  app.use(helmet());
  app.use(cors({
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : false
  }));
  app.use(express.json({ limit: '100kb' }));

  app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
      logger.warn('Malformed JSON in request body', { ip: req.ip, path: req.path });
      return res.status(400).json({ error: 'Malformed JSON in request body' });
    }
    next(err);
  });

  app.use((req, res, next) => {
    req.requestId = crypto.randomUUID();
    res.setHeader('X-Request-Id', req.requestId);
    next();
  });

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'Too many requests', retryAfter: '15 minutes' },
    standardHeaders: true,
    legacyHeaders: false
  });
  app.use('/api/', limiter);
}

module.exports = { applyMiddleware };
