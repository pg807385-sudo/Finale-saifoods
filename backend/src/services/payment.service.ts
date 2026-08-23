import Razorpay from "razorpay";
import crypto from "crypto";
import { config } from "../config";
import { AppError } from "../utils/error";
import { logger } from "../utils/logger";

const razorpay = new Razorpay({
  key_id: config.razorpay.keyId,
  key_secret: config.razorpay.keySecret,
});

export class PaymentService {
  static async createOrder(amount: number, receipt: string, notes?: Record<string, string>) {
    try {
      const order = await razorpay.orders.create({
        amount: Math.round(amount * 100), // Convert to paise
        currency: "INR",
        receipt,
        notes,
      });
      return order;
    } catch (error: any) {
      logger.error("Razorpay order creation failed:", error);
      throw new AppError("Payment initialization failed", 500);
    }
  }

  static async verifyPayment(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
  ) {
    const body = razorpayOrderId + "|" + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac("sha256", config.razorpay.keySecret)
      .update(body)
      .digest("hex");

    return expectedSignature === razorpaySignature;
  }

  static async verifyWebhookSignature(body: string, signature: string) {
    const expectedSignature = crypto
      .createHmac("sha256", config.razorpay.webhookSecret)
      .update(body)
      .digest("hex");

    return expectedSignature === signature;
  }

  static async fetchPayment(paymentId: string) {
    try {
      return await razorpay.payments.fetch(paymentId);
    } catch (error: any) {
      logger.error("Razorpay fetch payment failed:", error);
      throw new AppError("Failed to fetch payment details", 500);
    }
  }

  static async processRefund(paymentId: string, amount: number, notes?: Record<string, string>) {
    try {
      const refund = await razorpay.payments.refund(paymentId, {
        amount: Math.round(amount * 100),
        notes,
      });
      return refund;
    } catch (error: any) {
      logger.error("Razorpay refund failed:", error);
      throw new AppError("Refund processing failed", 500);
    }
  }
}
