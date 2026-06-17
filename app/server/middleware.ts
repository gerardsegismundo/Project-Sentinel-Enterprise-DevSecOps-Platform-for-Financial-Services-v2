import helmet from 'helmet';
import cors from 'cors';
import crypto from 'crypto';
import express, { Express, Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import logger from './logger';

declare global {
  namespace Express {
    interface Request {
      requestId: string;
    }
  }
}

function applyMiddleware(app: Express): void {
  app.use(helmet());
  const allowedOrigins: string[] | boolean = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : process.env.NODE_ENV !== 'production'
      ? true
      : false;
  app.use(cors({ origin: allowedOrigins as string | boolean }));
  app.use(express.json({ limit: '100kb' }));

  app.use(((err: { type?: string }, _req: Request, res: Response, next: NextFunction) => {
    if (err.type === 'entity.parse.failed') {
      logger.warn('Malformed JSON in request body', { ip: 'unknown' });
      return res.status(400).json({ error: 'Malformed JSON in request body' });
    }
    next(err);
  }) as unknown as express.ErrorRequestHandler);

  app.use((req: Request, res: Response, next: NextFunction) => {
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

export { applyMiddleware };