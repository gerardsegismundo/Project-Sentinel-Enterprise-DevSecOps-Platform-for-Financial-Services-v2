const helmet = require('helmet');
const cors = require('cors');
const express = require('express');
const rateLimit = require('express-rate-limit');

function applyMiddleware(app) {
  app.use(helmet());
  app.use(cors({
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : false
  }));
  app.use(express.json({ limit: '100kb' }));

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
