import { Express, Request } from 'express';
interface ExtendedRequest extends Request {
    requestId: string;
}
declare function applyMiddleware(app: Express): void;
export { applyMiddleware };
export type { ExtendedRequest };
//# sourceMappingURL=middleware.d.ts.map