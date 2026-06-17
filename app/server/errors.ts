import { Request, Response } from 'express';
import logger from './logger';

function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ error: 'Endpoint not found' });
}

interface ErrorRequest extends Request {
  requestId: string;
}

function globalErrorHandler(err: Error, req: ErrorRequest, res: Response, _next: () => void): void {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    requestId: req.requestId
  });
  res.status(500).json({ error: 'Internal server error', requestId: req.requestId });
}

export { notFoundHandler, globalErrorHandler };