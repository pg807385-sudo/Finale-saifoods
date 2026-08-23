"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderController = void 0;
const db_1 = require("../config/db");
const asyncHandler_1 = require("../utils/asyncHandler");
const response_1 = require("../utils/response");
const error_1 = require("../utils/error");
const notification_service_1 = require("../services/notification.service");
const audit_service_1 = require("../services/audit.service");
const coupon_service_1 = require("../services/coupon.service");
const client_1 = require("@prisma/client");
const socket_1 = require("../config/socket");
const generateOrderNumber = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `SF${timestamp}${random}`;
};
exports.OrderController = {
    createOrder: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { addressId, specialInstructions, couponCode } = req.body;
        const userId = req.user.userId;
        // Get cart items
        const cartItems = await db_1.prisma.cartItem.findMany({
            where: { userId },
            include: { foodItem: true },
        });
        if (cartItems.length === 0) {
            throw new error_1.BadRequestError("Cart is empty");
        }
        // Validate address
        const address = await db_1.prisma.address.findFirst({
            where: { id: addressId, userId, isActive: true },
        });
        if (!address) {
            throw new error_1.NotFoundError("Delivery address not found");
        }
        // Calculate pricing
        let subtotal = 0;
        const orderItemsData = cartItems.map((item) => {
            const price = Number(item.foodItem.discountedPrice || item.foodItem.price);
            const customizationPrice = 0;
            const itemTotal = (price + customizationPrice) * item.quantity;
            subtotal += itemTotal;
            return {
                foodItemId: item.foodItemId,
                name: item.foodItem.name,
                description: item.foodItem.description,
                image: item.foodItem.images[0] || null,
                price,
                quantity: item.quantity,
                customizations: item.selectedCustomizations,
                customizationPrice,
                specialInstructions: item.specialInstructions,
                totalPrice: itemTotal,
            };
        });
        const deliveryFee = subtotal > 500 ? 0 : 40;
        const tax = subtotal * 0.05;
        let discount = 0;
        let appliedCouponCode = null;
        let couponDiscount = 0;
        // Validate coupon
        if (couponCode) {
            const couponValidation = await coupon_service_1.CouponService.validateCoupon(couponCode, userId, subtotal);
            couponDiscount = couponValidation.discount;
            discount = couponDiscount;
            appliedCouponCode = couponValidation.code;
        }
        const finalTotal = subtotal + deliveryFee + tax - discount;
        // Create order
        const order = await db_1.prisma.$transaction(async (tx) => {
            const newOrder = await tx.order.create({
                data: {
                    orderNumber: generateOrderNumber(),
                    userId,
                    addressId,
                    addressSnapshot: address,
                    contactName: address.fullName,
                    contactPhone: address.phone,
                    specialInstructions,
                    subtotal,
                    deliveryFee,
                    tax,
                    discount,
                    couponCode: appliedCouponCode,
                    couponDiscount,
                    finalTotal,
                    status: client_1.OrderStatus.PLACED,
                    estimatedDeliveryAt: new Date(Date.now() + 45 * 60 * 1000),
                },
            });
            await tx.orderItem.createMany({
                data: orderItemsData.map((item) => ({
                    ...item,
                    orderId: newOrder.id,
                })),
            });
            await tx.orderStatusHistory.create({
                data: {
                    orderId: newOrder.id,
                    status: client_1.OrderStatus.PLACED,
                    note: "Order placed successfully",
                },
            });
            // Apply coupon usage if applicable
            if (couponCode && appliedCouponCode) {
                await coupon_service_1.CouponService.applyCoupon(couponCode, userId, newOrder.id, subtotal);
            }
            // Clear cart
            await tx.cartItem.deleteMany({ where: { userId } });
            return newOrder;
        });
        const fullOrder = await db_1.prisma.order.findUnique({
            where: { id: order.id },
            include: {
                items: true,
                address: true,
            },
        });
        // Send notification
        await notification_service_1.NotificationService.createNotification({
            userId,
            type: client_1.NotificationType.ORDER_PLACED,
            title: "Order Placed",
            message: `Your order #${order.orderNumber} has been placed successfully`,
            data: { orderId: order.id, orderNumber: order.orderNumber },
        });
        await audit_service_1.AuditLogService.log({
            userId,
            action: "ORDER_CREATED",
            resource: "order",
            resourceId: order.id,
            newValue: fullOrder,
            ipAddress: req.ip,
        });
        (0, response_1.sendResponse)(res, 201, "Order placed successfully", fullOrder);
    }),
    getOrders: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { status, page = "1", limit = "10" } = req.query;
        const userId = req.user.userId;
        const where = { userId };
        if (status) {
            where.status = status;
        }
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);
        const [orders, total] = await Promise.all([
            db_1.prisma.order.findMany({
                where,
                include: {
                    items: {
                        include: {
                            foodItem: { select: { id: true, name: true, images: true } },
                        },
                    },
                    payment: { select: { status: true, method: true } },
                },
                orderBy: { createdAt: "desc" },
                skip,
                take,
            }),
            db_1.prisma.order.count({ where }),
        ]);
        (0, response_1.sendResponse)(res, 200, "Orders retrieved", orders, {
            page: parseInt(page),
            limit: take,
            total,
            totalPages: Math.ceil(total / take),
        });
    }),
    getOrderById: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { id } = req.params;
        const userId = req.user.userId;
        const order = await db_1.prisma.order.findFirst({
            where: { id, userId },
            include: {
                items: {
                    include: {
                        foodItem: { select: { id: true, name: true, images: true } },
                    },
                },
                payment: true,
                refund: true,
                statusHistory: { orderBy: { createdAt: "asc" } },
                address: true,
            },
        });
        if (!order) {
            throw new error_1.NotFoundError("Order not found");
        }
        (0, response_1.sendResponse)(res, 200, "Order retrieved", order);
    }),
    cancelOrder: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { id } = req.params;
        const { reason, note } = req.body;
        const userId = req.user.userId;
        const order = await db_1.prisma.order.findFirst({
            where: { id, userId },
            include: { payment: true },
        });
        if (!order) {
            throw new error_1.NotFoundError("Order not found");
        }
        // Business rules: Cannot cancel if already out for delivery or delivered
        const nonCancellableStatuses = [
            client_1.OrderStatus.OUT_FOR_DELIVERY,
            client_1.OrderStatus.DELIVERED,
            client_1.OrderStatus.CANCELLED,
        ];
        if (nonCancellableStatuses.includes(order.status)) {
            throw new error_1.BadRequestError(`Cannot cancel order that is already ${order.status.toLowerCase().replace("_", " ")}`);
        }
        const updatedOrder = await db_1.prisma.$transaction(async (tx) => {
            const updated = await tx.order.update({
                where: { id },
                data: {
                    status: client_1.OrderStatus.CANCELLED,
                    isCancelled: true,
                    cancelledAt: new Date(),
                    cancelledBy: userId,
                    cancellationReason: reason || client_1.CancellationReason.CUSTOMER_REQUEST,
                    cancellationNote: note,
                },
            });
            await tx.orderStatusHistory.create({
                data: {
                    orderId: id,
                    status: client_1.OrderStatus.CANCELLED,
                    note: note || "Cancelled by customer",
                    changedBy: userId,
                },
            });
            return updated;
        });
        await notification_service_1.NotificationService.createNotification({
            userId,
            type: client_1.NotificationType.ORDER_CANCELLED,
            title: "Order Cancelled",
            message: `Your order #${order.orderNumber} has been cancelled`,
            data: { orderId: order.id, orderNumber: order.orderNumber },
        });
        await audit_service_1.AuditLogService.log({
            userId,
            action: "ORDER_CANCELLED",
            resource: "order",
            resourceId: order.id,
            oldValue: { status: order.status },
            newValue: { status: client_1.OrderStatus.CANCELLED },
            ipAddress: req.ip,
        });
        (0, response_1.sendResponse)(res, 200, "Order cancelled successfully", updatedOrder);
    }),
    // Admin: Update order status
    updateOrderStatus: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { id } = req.params;
        const { status, note } = req.body;
        const adminUserId = req.user.adminUserId;
        if (!adminUserId) {
            throw new error_1.ForbiddenError("Admin access required");
        }
        const order = await db_1.prisma.order.findUnique({
            where: { id },
            include: { payment: true },
        });
        if (!order) {
            throw new error_1.NotFoundError("Order not found");
        }
        if (order.status === client_1.OrderStatus.CANCELLED || order.status === client_1.OrderStatus.DELIVERED) {
            throw new error_1.BadRequestError("Cannot change status of a cancelled or delivered order");
        }
        const updatedOrder = await db_1.prisma.$transaction(async (tx) => {
            const updated = await tx.order.update({
                where: { id },
                data: {
                    status: status,
                    deliveredAt: status === client_1.OrderStatus.DELIVERED ? new Date() : undefined,
                },
            });
            await tx.orderStatusHistory.create({
                data: {
                    orderId: id,
                    status: status,
                    note: note || `Status updated to ${status}`,
                    changedBy: adminUserId,
                },
            });
            return updated;
        });
        // Map status to notification type
        const statusNotificationMap = {
            PAYMENT_CONFIRMED: client_1.NotificationType.PAYMENT_SUCCESS,
            ACCEPTED: client_1.NotificationType.ORDER_ACCEPTED,
            PREPARING: client_1.NotificationType.ORDER_PREPARING,
            READY: client_1.NotificationType.ORDER_READY,
            OUT_FOR_DELIVERY: client_1.NotificationType.ORDER_OUT_FOR_DELIVERY,
            DELIVERED: client_1.NotificationType.ORDER_DELIVERED,
        };
        (0, socket_1.getIo)()?.to(id).emit("order_status_update", { orderId: id, status });
        const notificationType = statusNotificationMap[status];
        if (notificationType) {
            await notification_service_1.NotificationService.createNotification({
                userId: order.userId,
                type: notificationType,
                title: status.replace(/_/g, " "),
                message: `Your order #${order.orderNumber} is now ${status.toLowerCase().replace(/_/g, " ")}`,
                data: { orderId: order.id, orderNumber: order.orderNumber, status },
            });
        }
        await audit_service_1.AuditLogService.log({
            adminUserId,
            action: "ORDER_STATUS_CHANGED",
            resource: "order",
            resourceId: order.id,
            oldValue: { status: order.status },
            newValue: { status },
            ipAddress: req.ip,
        });
        (0, response_1.sendResponse)(res, 200, "Order status updated", updatedOrder);
    }),
    // Admin: Get all orders
    getAllOrders: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { status, search, dateFrom, dateTo, page = "1", limit = "20", sortBy = "createdAt", sortOrder = "desc", } = req.query;
        const where = {};
        if (status) {
            where.status = status;
        }
        if (search) {
            where.OR = [
                { orderNumber: { contains: search, mode: "insensitive" } },
                { contactName: { contains: search, mode: "insensitive" } },
                { contactPhone: { contains: search, mode: "insensitive" } },
            ];
        }
        if (dateFrom || dateTo) {
            where.createdAt = {};
            if (dateFrom)
                where.createdAt.gte = new Date(dateFrom);
            if (dateTo)
                where.createdAt.lte = new Date(dateTo);
        }
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);
        const [orders, total] = await Promise.all([
            db_1.prisma.order.findMany({
                where,
                include: {
                    user: { select: { id: true, name: true, email: true, phone: true } },
                    items: {
                        include: {
                            foodItem: { select: { id: true, name: true } },
                        },
                    },
                    payment: true,
                    refund: true,
                    statusHistory: { orderBy: { createdAt: "asc" } },
                },
                orderBy: { [sortBy]: sortOrder },
                skip,
                take,
            }),
            db_1.prisma.order.count({ where }),
        ]);
        (0, response_1.sendResponse)(res, 200, "Orders retrieved", orders, {
            page: parseInt(page),
            limit: take,
            total,
            totalPages: Math.ceil(total / take),
        });
    }),
};
//# sourceMappingURL=order.controller.js.map