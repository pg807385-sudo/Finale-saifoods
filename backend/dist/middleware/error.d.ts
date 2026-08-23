import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/error";
export declare const errorHandler: (err: Error | AppError, req: Request, res: Response, _next: NextFunction) => void;
export declare const notFoundHandler: (req: Request, res: Response) => void;
//# sourceMappingURL=error.d.ts.map