import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import logger from './logger';

interface User {
  id: number;
  username: string;
  role: string;
}

interface TokenPayload {
  id: number;
  username: string;
  role: string;
  iat: number;
}

interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

const PUBLIC_PATHS = ['/health', '/api/auth/login'];

const USERS: User[] = [
  { id: 1, username: 'admin', role: 'admin' },
  { id: 2, username: 'teller', role: 'teller' },
  { id: 3, username: 'viewer', role: 'viewer' }
];

function generateToken(user: User): string {
  const payload = JSON.stringify({ id: user.id, username: user.username, role: user.role, iat: Date.now() });
  const hmac = crypto.createHmac('sha256', getTokenSecret());
  hmac.update(payload);
  const signature = hmac.digest('hex');
  return Buffer.from(payload).toString('base64') + '.' + signature;
}

function verifyToken(token: string): TokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const [payloadB64, signature] = parts;
    const payload = Buffer.from(payloadB64, 'base64').toString();

    const hmac = crypto.createHmac('sha256', getTokenSecret());
    hmac.update(payload);
    const expectedSig = hmac.digest('hex');

    const sigBuf = Buffer.from(signature, 'hex');
    const expectedBuf = Buffer.from(expectedSig, 'hex');
    if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
      return null;
    }

    const data = JSON.parse(payload) as TokenPayload;
    const maxAge = 24 * 60 * 60 * 1000;
    if (Date.now() - data.iat > maxAge) return null;

    return data;
  } catch {
    return null;
  }
}

function getTokenSecret(): string {
  return process.env.TOKEN_SECRET || 'project-sentinel-dev-secret';
}

function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authEnabled = process.env.AUTH_ENABLED !== 'false';
  const apiKey = process.env.API_KEY;

  if (!authEnabled) return next();
  if (PUBLIC_PATHS.includes(req.path)) return next();
  if (req.method === 'GET' && req.path === '/') return next();

  // Static file requests bypass auth
  if (!req.path.startsWith('/api/')) return next();

  const authHeader = req.headers.authorization;
  const reqApiKey = req.headers['x-api-key'];

  if (reqApiKey && apiKey && reqApiKey === apiKey) {
    req.user = { id: 0, username: 'api-client', role: 'admin', iat: Date.now() };
    return next();
  }

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const user = verifyToken(token);
    if (user) {
      req.user = user;
      return next();
    }
    logger.warn('Invalid or expired token', { ip: req.headers['x-forwarded-for'] || 'unknown' });
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  if (!apiKey && !process.env.TOKEN_SECRET) {
    return next();
  }

  logger.warn('Missing authentication', { path: req.path, ip: req.headers['x-forwarded-for'] || 'unknown' });
  res.status(401).json({ error: 'Authentication required' });
  return;
}

function findUserByUsername(username: string): User | undefined {
  return USERS.find(u => u.username === username);
}

export { authMiddleware, generateToken, verifyToken, findUserByUsername, USERS };
export type { User, TokenPayload, AuthenticatedRequest };