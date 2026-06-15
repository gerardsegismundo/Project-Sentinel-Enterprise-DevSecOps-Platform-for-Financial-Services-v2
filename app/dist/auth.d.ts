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
interface AuthenticatedRequest {
    path: string;
    method: string;
    headers: Record<string, string | undefined>;
    user?: TokenPayload;
}
declare const USERS: User[];
declare function generateToken(user: User): string;
declare function verifyToken(token: string): TokenPayload | null;
interface AuthMiddlewareRes {
    status: (code: number) => {
        json: (obj: object) => void;
    };
}
declare function authMiddleware(req: AuthenticatedRequest, res: AuthMiddlewareRes, next: () => void): void;
declare function findUserByUsername(username: string): User | undefined;
export { authMiddleware, generateToken, verifyToken, findUserByUsername, USERS };
export type { User, TokenPayload, AuthenticatedRequest };
//# sourceMappingURL=auth.d.ts.map