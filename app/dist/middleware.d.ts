import { Express } from 'express';
declare global {
    namespace Express {
        interface Request {
            requestId: string;
        }
    }
}
declare function applyMiddleware(app: Express): void;
export { applyMiddleware };
//# sourceMappingURL=middleware.d.ts.map