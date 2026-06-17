import { Request, Response, NextFunction } from 'express';
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
export declare function cognitoAuthMiddleware(req: Request, res: Response, next: NextFunction): void;
export {};
//# sourceMappingURL=cognito-auth.d.ts.map