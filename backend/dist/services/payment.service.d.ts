export declare class PaymentService {
    static createOrder(amount: number, receipt: string, notes?: Record<string, string>): Promise<import("razorpay/dist/types/orders").Orders.RazorpayOrder>;
    static verifyPayment(razorpayOrderId: string, razorpayPaymentId: string, razorpaySignature: string): Promise<boolean>;
    static verifyWebhookSignature(body: string, signature: string): Promise<boolean>;
    static fetchPayment(paymentId: string): Promise<import("razorpay/dist/types/payments").Payments.RazorpayPayment>;
    static processRefund(paymentId: string, amount: number, notes?: Record<string, string>): Promise<import("razorpay/dist/types/refunds").Refunds.RazorpayRefund>;
}
//# sourceMappingURL=payment.service.d.ts.map