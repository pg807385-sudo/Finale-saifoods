import { Request, Response } from "express";
import { prisma } from "../config/db";
import { asyncHandler } from "../utils/asyncHandler";
import { sendResponse } from "../utils/response";
import { NotFoundError, BadRequestError, ForbiddenError } from "../utils/error";
import { PaymentService } from "../services/payment.service";
import { NotificationService } from "../services/notification.service";
import { AuditLogService } from "../services/audit.service";
import { NotificationType, PaymentStatus, OrderStatus } from "@prisma/client";
import { logger } from "../utils/logger";

export const PaymentController = {
  createPaymentOrder: asyncHandler(async (req: Request, res: Response) => {
    const { orderId } = req.body;
    const userId = req.user!.userId;

    const order = await prisma.order.findFirst({
      where: { id: orderId, userId },
    });

    if (!order) {
      throw new NotFoundError("Order not found");
    }

    if (order.status !== OrderStatus.PLACED) {
      throw new BadRequestError("Payment already processed or order cancelled");
    }

    // Check for existing payment
    const existingPayment = await prisma.payment.findUnique({
      where: { orderId },
    });

    if (existingPayment && existingPayment.status === PaymentStatus.SUCCESS) {
      throw new BadRequestError("Payment already completed");
    }

    // Create Razorpay order
    const razorpayOrder = await PaymentService.createOrder(
      Number(order.finalTotal),
      order.orderNumber,
      { orderId: order.id, userId }
    );

    // Save payment record
    const payment = await prisma.payment.upsert({
      where: { orderId },
      update: {
        providerOrderId: razorpayOrder.id,
        amount: order.finalTotal,
        status: PaymentStatus.PENDING,
      },
      create: {
        orderId,
        amount: order.finalTotal,
        providerOrderId: razorpayOrder.id,
        provider: "razorpay",
        status: PaymentStatus.PENDING,
      },
    });

    sendResponse(res, 200, "Payment order created", {
      payment,
      razorpayOrder: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
      },
    });
  }),

  verifyPayment: asyncHandler(async (req: Request, res: Response) => {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,
    } = req.body;

    const userId = req.user!.userId;

    // Verify signature
    const isValid = await PaymentService.verifyPayment(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValid) {
      throw new BadRequestError("Invalid payment signature");
    }

    // Update payment and order
    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.update({
        where: { orderId },
        data: {
          status: PaymentStatus.SUCCESS,
          providerPaymentId: razorpay_payment_id,
          providerSignature: razorpay_signature,
          method: "UPI",
          paidAt: new Date(),
        },
      });

      const order = await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.PAYMENT_CONFIRMED },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status: OrderStatus.PAYMENT_CONFIRMED,
          note: "Payment verified successfully",
        },
      });

      return { payment, order };
    });

    await NotificationService.createNotification({
      userId,
      type: NotificationType.PAYMENT_SUCCESS,
      title: "Payment Successful",
      message: `Payment of ₹${result.payment.amount} for order #${result.order.orderNumber} was successful`,
      data: {
        orderId: result.order.id,
        orderNumber: result.order.orderNumber,
        paymentId: result.payment.id,
      },
    });

    await AuditLogService.log({
      userId,
      action: "PAYMENT_SUCCESS",
      resource: "payment",
      resourceId: result.payment.id,
      newValue: { paymentId: razorpay_payment_id, amount: result.payment.amount },
      ipAddress: req.ip,
    });

    sendResponse(res, 200, "Payment verified successfully", result);
  }),

  handleWebhook: asyncHandler(async (req: Request, res: Response) => {
    const signature = req.headers["x-razorpay-signature"] as string;
    const body = JSON.stringify(req.body);

    const isValid = await PaymentService.verifyWebhookSignature(body, signature);
    if (!isValid) {
      logger.warn("Invalid webhook signature received");
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }

    const event = req.body;
    logger.info(`Webhook received: ${event.event}`);

    if (event.event === "payment.captured") {
      const paymentEntity = event.payload.payment.entity;
      const orderId = paymentEntity.notes?.orderId;

      if (orderId) {
        await prisma.$transaction(async (tx) => {
          await tx.payment.updateMany({
            where: { orderId },
            data: {
              status: PaymentStatus.SUCCESS,
              providerPaymentId: paymentEntity.id,
              method: paymentEntity.method?.toUpperCase(),
              paidAt: new Date(),
            },
          });

          await tx.order.update({
            where: { id: orderId },
            data: { status: OrderStatus.PAYMENT_CONFIRMED },
          });
        });
      }
    }

    if (event.event === "payment.failed") {
      const paymentEntity = event.payload.payment.entity;
      const orderId = paymentEntity.notes?.orderId;

      if (orderId) {
        await prisma.payment.updateMany({
          where: { orderId },
          data: {
            status: PaymentStatus.FAILED,
            failedAt: new Date(),
            failureReason: paymentEntity.error_description,
          },
        });
      }
    }

    res.status(200).json({ success: true });
  }),

  getPaymentStatus: asyncHandler(async (req: Request, res: Response) => {
    const { orderId } = req.params;
    const userId = req.user!.userId;

    const payment = await prisma.payment.findFirst({
      where: { orderId, order: { userId } },
    });

    if (!payment) {
      throw new NotFoundError("Payment not found");
    }

    sendResponse(res, 200, "Payment status retrieved", payment);
  }),

  // Admin: Process refund
  processRefund: asyncHandler(async (req: Request, res: Response) => {
    const { orderId } = req.params;
    const { amount, reason } = req.body;
    const adminUserId = req.user!.adminUserId;

    if (!adminUserId) {
      throw new ForbiddenError("Admin access required");
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    });

    if (!order || !order.payment) {
      throw new NotFoundError("Order or payment not found");
    }

    if (order.payment.status !== PaymentStatus.SUCCESS) {
      throw new BadRequestError("Cannot refund an unsuccessful payment");
    }

    const refundAmount = amount || Number(order.payment.amount);

    const razorpayRefund = await PaymentService.processRefund(
      order.payment.providerPaymentId!,
      refundAmount,
      { reason, orderId }
    );

    const refund = await prisma.refund.create({
      data: {
        paymentId: order.payment.id,
        orderId,
        amount: refundAmount,
        providerRefundId: razorpayRefund.id,
        reason,
        status: "PROCESSED",
        processedAt: new Date(),
      },
    });

    await prisma.payment.update({
      where: { id: order.payment.id },
      data: { status: PaymentStatus.REFUNDED },
    });

    await NotificationService.createNotification({
      userId: order.userId,
      type: NotificationType.REFUND_PROCESSED,
      title: "Refund Processed",
      message: `A refund of ₹${refundAmount} has been processed for order #${order.orderNumber}`,
      data: { orderId, refundId: refund.id },
    });

    await AuditLogService.log({
      adminUserId,
      action: "REFUND_PROCESSED",
      resource: "refund",
      resourceId: refund.id,
      newValue: { amount: refundAmount, reason },
      ipAddress: req.ip,
    });

    sendResponse(res, 200, "Refund processed successfully", refund);
  }),
};
