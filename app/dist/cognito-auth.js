"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cognitoAuthMiddleware = cognitoAuthMiddleware;
const jwks_rsa_1 = __importDefault(require("jwks-rsa"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const logger_1 = __importDefault(require("./logger"));
const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;
const CLIENT_ID = process.env.COGNITO_CLIENT_ID;
const REGION = process.env.AWS_REGION || 'us-east-1';
const JWKS_URI = `https://cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}/.well-known/jwks.json`;
const client = (0, jwks_rsa_1.default)({
    jwksUri: JWKS_URI,
    cache: true,
    rateLimit: true,
    cacheMaxEntries: 5,
    cacheMaxAge: 600000, // 10 minutes
});
function getKey(header, callback) {
    client.getSigningKey(header.kid, (err, key) => {
        if (err)
            return callback(err);
        callback(null, key.getPublicKey());
    });
}
function cognitoAuthMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Authentication required' });
        return;
    }
    const token = authHeader.slice(7);
    jsonwebtoken_1.default.verify(token, getKey, {
        issuer: `https://cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}`,
        audience: CLIENT_ID,
        algorithms: ['RS256'],
    }, (err, decoded) => {
        if (err) {
            logger_1.default.warn('Cognito token verification failed', { error: err.message });
            res.status(401).json({ error: 'Invalid or expired token' });
            return;
        }
        req.cognitoUser = decoded;
        next();
    });
}
//# sourceMappingURL=cognito-auth.js.map