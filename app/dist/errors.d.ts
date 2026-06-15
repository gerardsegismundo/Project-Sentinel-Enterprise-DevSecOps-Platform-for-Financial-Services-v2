import { Request, Response } from 'express';
declare function notFoundHandler(_req: Request, res: Response): void;
interface ErrorRequest extends Request {
    requestId: string;
}
declare function globalErrorHandler(err: Error, req: ErrorRequest, res: Response, _next: () => void): void;
export { notFoundHandler, globalErrorHandler };
//# sourceMappingURL=errors.d.ts.map