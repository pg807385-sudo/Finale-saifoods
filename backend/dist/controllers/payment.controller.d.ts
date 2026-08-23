import { Request, Response } from "express";
export declare const PaymentController: {
    createPaymentOrder: (req: Request, res: Response, next: import("express").NextFunction) => void;
    verifyPayment: (req: Request, res: Response, next: import("express").NextFunction) => void;
    handleWebhook: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getPaymentStatus: (req: Request, res: Response, next: import("express").NextFunction) => void;
    processRefund: (req: Request, res: Response, next: import("express").NextFunction) => void;
};
//# sourceMappingURL=payment.controller.d.ts.map