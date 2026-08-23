"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentController = void 0;
const db_1 = require("../config/db");
const asyncHandler_1 = require("../utils/asyncHandler");
const response_1 = require("../utils/response");
const error_1 = require("../utils/error");
const payment_service_1 = require("../services/payment.service");
const notification_service_1 = require("../services/notification.service");
const audit_service_1 = require("../services/audit.service");
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
exports.PaymentController = {
    createPaymentOrder: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { orderId } = req.body;
        const userId = req.user.userId;
        const order = await db_1.prisma.order.findFirst({
            where: { id: orderId, userId },
        });
        if (!order) {
            throw new error_1.NotFoundError("Order not found");
        }
        if (order.status !== client_1.OrderStatus.PLACED) {
            throw new error_1.BadRequestError("Payment already processed or order cancelled");
        }
        // Check for existing payment
        const existingPayment = await db_1.prisma.payment.findUnique({
            where: { orderId },
        });
        if (existingPayment && existingPayment.status === client_1.PaymentStatus.SUCCESS) {
            throw new error_1.BadRequestError("Payment already completed");
        }
        // Create Razorpay order
        const razorpayOrder = await payment_service_1.PaymentService.createOrder(Number(order.finalTotal), order.orderNumber, { orderId: order.id, userId });
        // Save payment record
        const payment = await db_1.prisma.payment.upsert({
            where: { orderId },
            update: {
                providerOrderId: razorpayOrder.id,
                amount: order.finalTotal,
                status: client_1.PaymentStatus.PENDING,
            },
            create: {
                orderId,
                amount: order.finalTotal,
                providerOrderId: razorpayOrder.id,
                provider: "razorpay",
                status: client_1.PaymentStatus.PENDING,
            },
        });
        (0, response_1.sendResponse)(res, 200, "Payment order created", {
            payment,
            razorpayOrder: {
                id: razorpayOrder.id,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
            },
        });
    }),
    verifyPayment: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId, } = req.body;
        const userId = req.user.userId;
        // Verify signature
        const isValid = await payment_service_1.PaymentService.verifyPayment(razorpay_order_id, razorpay_payment_id, razorpay_signature);
        if (!isValid) {
            throw new error_1.BadRequestError("Invalid payment signature");
        }
        // Update payment and order
        const result = await db_1.prisma.$transaction(async (tx) => {
            const payment = await tx.payment.update({
                where: { orderId },
                data: {
                    status: client_1.PaymentStatus.SUCCESS,
                    providerPaymentId: razorpay_payment_id,
                    providerSignature: razorpay_signature,
                    method: "UPI",
                    paidAt: new Date(),
                },
            });
            const order = await tx.order.update({
                where: { id: orderId },
                data: { status: client_1.OrderStatus.PAYMENT_CONFIRMED },
            });
            await tx.orderStatusHistory.create({
                data: {
                    orderId,
                    status: client_1.OrderStatus.PAYMENT_CONFIRMED,
                    note: "Payment verified successfully",
                },
            });
            return { payment, order };
        });
        await notification_service_1.NotificationService.createNotification({
            userId,
            type: client_1.NotificationType.PAYMENT_SUCCESS,
            title: "Payment Successful",
            message: `Payment of ₹${result.payment.amount} for order #${result.order.orderNumber} was successful`,
            data: {
                orderId: result.order.id,
                orderNumber: result.order.orderNumber,
                paymentId: result.payment.id,
            },
        });
        await audit_service_1.AuditLogService.log({
            userId,
            action: "PAYMENT_SUCCESS",
            resource: "payment",
            resourceId: result.payment.id,
            newValue: { paymentId: razorpay_payment_id, amount: result.payment.amount },
            ipAddress: req.ip,
        });
        (0, response_1.sendResponse)(res, 200, "Payment verified successfully", result);
    }),
    handleWebhook: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const signature = req.headers["x-razorpay-signature"];
        const body = JSON.stringify(req.body);
        const isValid = await payment_service_1.PaymentService.verifyWebhookSignature(body, signature);
        if (!isValid) {
            logger_1.logger.warn("Invalid webhook signature received");
            return res.status(400).json({ success: false, message: "Invalid signature" });
        }
        const event = req.body;
        logger_1.logger.info(`Webhook received: ${event.event}`);
        if (event.event === "payment.captured") {
            const paymentEntity = event.payload.payment.entity;
            const orderId = paymentEntity.notes?.orderId;
            if (orderId) {
                await db_1.prisma.$transaction(async (tx) => {
                    await tx.payment.updateMany({
                        where: { orderId },
                        data: {
                            status: client_1.PaymentStatus.SUCCESS,
                            providerPaymentId: paymentEntity.id,
                            method: paymentEntity.method?.toUpperCase(),
                            paidAt: new Date(),
                        },
                    });
                    await tx.order.update({
                        where: { id: orderId },
                        data: { status: client_1.OrderStatus.PAYMENT_CONFIRMED },
                    });
                });
            }
        }
        if (event.event === "payment.failed") {
            const paymentEntity = event.payload.payment.entity;
            const orderId = paymentEntity.notes?.orderId;
            if (orderId) {
                await db_1.prisma.payment.updateMany({
                    where: { orderId },
                    data: {
                        status: client_1.PaymentStatus.FAILED,
                        failedAt: new Date(),
                        failureReason: paymentEntity.error_description,
                    },
                });
            }
        }
        res.status(200).json({ success: true });
    }),
    getPaymentStatus: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { orderId } = req.params;
        const userId = req.user.userId;
        const payment = await db_1.prisma.payment.findFirst({
            where: { orderId, order: { userId } },
        });
        if (!payment) {
            throw new error_1.NotFoundError("Payment not found");
        }
        (0, response_1.sendResponse)(res, 200, "Payment status retrieved", payment);
    }),
    // Admin: Process refund
    processRefund: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { orderId } = req.params;
        const { amount, reason } = req.body;
        const adminUserId = req.user.adminUserId;
        if (!adminUserId) {
            throw new error_1.ForbiddenError("Admin access required");
        }
        const order = await db_1.prisma.order.findUnique({
            where: { id: orderId },
            include: { payment: true },
        });
        if (!order || !order.payment) {
            throw new error_1.NotFoundError("Order or payment not found");
        }
        if (order.payment.status !== client_1.PaymentStatus.SUCCESS) {
            throw new error_1.BadRequestError("Cannot refund an unsuccessful payment");
        }
        const refundAmount = amount || Number(order.payment.amount);
        const razorpayRefund = await payment_service_1.PaymentService.processRefund(order.payment.providerPaymentId, refundAmount, { reason, orderId });
        const refund = await db_1.prisma.refund.create({
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
        await db_1.prisma.payment.update({
            where: { id: order.payment.id },
            data: { status: client_1.PaymentStatus.REFUNDED },
        });
        await notification_service_1.NotificationService.createNotification({
            userId: order.userId,
            type: client_1.NotificationType.REFUND_PROCESSED,
            title: "Refund Processed",
            message: `A refund of ₹${refundAmount} has been processed for order #${order.orderNumber}`,
            data: { orderId, refundId: refund.id },
        });
        await audit_service_1.AuditLogService.log({
            adminUserId,
            action: "REFUND_PROCESSED",
            resource: "refund",
            resourceId: refund.id,
            newValue: { amount: refundAmount, reason },
            ipAddress: req.ip,
        });
        (0, response_1.sendResponse)(res, 200, "Refund processed successfully", refund);
    }),
};
//# sourceMappingURL=payment.controller.js.map