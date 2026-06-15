"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyMiddleware = applyMiddleware;
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const crypto_1 = __importDefault(require("crypto"));
const express_1 = __importDefault(require("express"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const logger_1 = __importDefault(require("./logger"));
function applyMiddleware(app) {
    app.use((0, helmet_1.default)());
    const allowedOrigins = process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(',')
        : process.env.NODE_ENV !== 'production'
            ? true
            : false;
    app.use((0, cors_1.default)({ origin: allowedOrigins }));
    app.use(express_1.default.json({ limit: '100kb' }));
    app.use((err, _req, res, next) => {
        if (err.type === 'entity.parse.failed') {
            logger_1.default.warn('Malformed JSON in request body', { ip: 'unknown' });
            return res.status(400).json({ error: 'Malformed JSON in request body' });
        }
        next(err);
    });
    app.use((req, _res, next) => {
        req.requestId = crypto_1.default.randomUUID();
        next();
    });
    const limiter = (0, express_rate_limit_1.default)({
        windowMs: 15 * 60 * 1000,
        max: 100,
        message: { error: 'Too many requests', retryAfter: '15 minutes' },
        standardHeaders: true,
        legacyHeaders: false
    });
    app.use('/api/', limiter);
}
//# sourceMappingURL=middleware.js.map