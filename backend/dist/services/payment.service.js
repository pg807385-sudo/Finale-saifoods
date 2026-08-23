"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentService = void 0;
const razorpay_1 = __importDefault(require("razorpay"));
const crypto_1 = __importDefault(require("crypto"));
const config_1 = require("../config");
const error_1 = require("../utils/error");
const logger_1 = require("../utils/logger");
const razorpay = new razorpay_1.default({
    key_id: config_1.config.razorpay.keyId,
    key_secret: config_1.config.razorpay.keySecret,
});
class PaymentService {
    static async createOrder(amount, receipt, notes) {
        try {
            const order = await razorpay.orders.create({
                amount: Math.round(amount * 100), // Convert to paise
                currency: "INR",
                receipt,
                notes,
            });
            return order;
        }
        catch (error) {
            logger_1.logger.error("Razorpay order creation failed:", error);
            throw new error_1.AppError("Payment initialization failed", 500);
        }
    }
    static async verifyPayment(razorpayOrderId, razorpayPaymentId, razorpaySignature) {
        const body = razorpayOrderId + "|" + razorpayPaymentId;
        const expectedSignature = crypto_1.default
            .createHmac("sha256", config_1.config.razorpay.keySecret)
            .update(body)
            .digest("hex");
        return expectedSignature === razorpaySignature;
    }
    static async verifyWebhookSignature(body, signature) {
        const expectedSignature = crypto_1.default
            .createHmac("sha256", config_1.config.razorpay.webhookSecret)
            .update(body)
            .digest("hex");
        return expectedSignature === signature;
    }
    static async fetchPayment(paymentId) {
        try {
            return await razorpay.payments.fetch(paymentId);
        }
        catch (error) {
            logger_1.logger.error("Razorpay fetch payment failed:", error);
            throw new error_1.AppError("Failed to fetch payment details", 500);
        }
    }
    static async processRefund(paymentId, amount, notes) {
        try {
            const refund = await razorpay.payments.refund(paymentId, {
                amount: Math.round(amount * 100),
                notes,
            });
            return refund;
        }
        catch (error) {
            logger_1.logger.error("Razorpay refund failed:", error);
            throw new error_1.AppError("Refund processing failed", 500);
        }
    }
}
exports.PaymentService = PaymentService;
//# sourceMappingURL=payment.service.js.map