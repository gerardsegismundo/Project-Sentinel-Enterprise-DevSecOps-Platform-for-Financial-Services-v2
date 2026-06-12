const crypto = require('crypto');
const logger = require('./logger');

const PUBLIC_PATHS = ['/health', '/api/auth/login'];

const USERS = [
  { id: 1, username: 'admin', role: 'admin' },
  { id: 2, username: 'teller', role: 'teller' },
  { id: 3, username: 'viewer', role: 'viewer' }
];

function generateToken(user) {
  const payload = JSON.stringify({ id: user.id, username: user.username, role: user.role, iat: Date.now() });
  const hmac = crypto.createHmac('sha256', getTokenSecret());
  hmac.update(payload);
  const signature = hmac.digest('hex');
  return Buffer.from(payload).toString('base64') + '.' + signature;
}

function verifyToken(token) {
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

    const data = JSON.parse(payload);
    const maxAge = 24 * 60 * 60 * 1000;
    if (Date.now() - data.iat > maxAge) return null;

    return data;
  } catch {
    return null;
  }
}

function getTokenSecret() {
  return process.env.TOKEN_SECRET || 'project-sentinel-dev-secret';
}

function authMiddleware(req, res, next) {
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
    req.user = { username: 'api-client', role: 'admin' };
    return next();
  }

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const user = verifyToken(token);
    if (user) {
      req.user = user;
      return next();
    }
    logger.warn('Invalid or expired token', { ip: req.ip, requestId: req.requestId });
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  if (!apiKey && !process.env.TOKEN_SECRET) {
    return next();
  }

  logger.warn('Missing authentication', { path: req.path, ip: req.ip, requestId: req.requestId });
  return res.status(401).json({ error: 'Authentication required' });
}

function findUserByUsername(username) {
  return USERS.find(u => u.username === username);
}

module.exports = { authMiddleware, generateToken, verifyToken, findUserByUsername, USERS };
