"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = notFoundHandler;
exports.globalErrorHandler = globalErrorHandler;
const logger_1 = __importDefault(require("./logger"));
function notFoundHandler(_req, res) {
    res.status(404).json({ error: 'Endpoint not found' });
}
function globalErrorHandler(err, req, res, _next) {
    logger_1.default.error('Unhandled error', {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        requestId: req.requestId
    });
    res.status(500).json({ error: 'Internal server error', requestId: req.requestId });
}
//# sourceMappingURL=errors.js.map