import { Request, Response, NextFunction } from "express";
import { JwtPayload } from "../types";
declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload & {
                adminUserId?: string;
                role?: string;
            };
        }
    }
}
export declare const authenticate: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const authorize: (...roles: string[]) => (req: Request, res: Response, next: NextFunction) => void;
export declare const optionalAuth: (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=auth.d.ts.map