import { Request, Response, NextFunction } from 'express';
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
declare const USERS: User[];
declare function generateToken(user: User): string;
declare function verifyToken(token: string): TokenPayload | null;
declare function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void;
declare function findUserByUsername(username: string): User | undefined;
export { authMiddleware, generateToken, verifyToken, findUserByUsername, USERS };
export type { User, TokenPayload, AuthenticatedRequest };
//# sourceMappingURL=auth.d.ts.map