import { Response } from "express";
import { ApiResponse } from "../types";
export declare const sendResponse: <T>(res: Response, statusCode: number, message: string, data?: T, meta?: ApiResponse<T>["meta"]) => Response<any, Record<string, any>>;
export declare const sendError: (res: Response, statusCode: number, message: string, error?: string) => Response<any, Record<string, any>>;
//# sourceMappingURL=response.d.ts.map