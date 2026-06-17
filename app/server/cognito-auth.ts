import { Request, Response, NextFunction } from 'express';
import jwksClient from 'jwks-rsa';
import jwt from 'jsonwebtoken';
import logger from './logger';

interface CognitoUser {
  sub: string;
  email?: string;
  'cognito:username'?: string;
  'cognito:groups'?: string[];
}

declare module 'express' {
  interface Request {
    cognitoUser?: CognitoUser;
  }
}

const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID!;
const CLIENT_ID   = process.env.COGNITO_CLIENT_ID!;
const REGION      = process.env.AWS_REGION || 'us-east-1';

const JWKS_URI = `https://cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}/.well-known/jwks.json`;

const client = jwksClient({
  jwksUri: JWKS_URI,
  cache: true,
  rateLimit: true,
  cacheMaxEntries: 5,
  cacheMaxAge: 600_000, // 10 minutes
});

function getKey(header: jwt.JwtHeader, callback: jwt.SigningKeyCallback): void {
  client.getSigningKey(header.kid!, (err, key) => {
    if (err) return callback(err);
    callback(null, key!.getPublicKey());
  });
}

export function cognitoAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const token = authHeader.slice(7);

  jwt.verify(
    token,
    getKey,
    {
      issuer: `https://cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}`,
      audience: CLIENT_ID,
      algorithms: ['RS256'],
    },
    (err, decoded) => {
      if (err) {
        logger.warn('Cognito token verification failed', { error: err.message });
        res.status(401).json({ error: 'Invalid or expired token' });
        return;
      }
      req.cognitoUser = decoded as CognitoUser;
      next();
    },
  );
}
