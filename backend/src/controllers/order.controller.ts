import { Request, Response } from "express";
import { prisma } from "../config/db";
import { asyncHandler } from "../utils/asyncHandler";
import { sendResponse } from "../utils/response";
import { NotFoundError, BadRequestError, ForbiddenError } from "../utils/error";
import { NotificationService } from "../services/notification.service";
import { AuditLogService } from "../services/audit.service";
import { CouponService } from "../services/coupon.service";
import { NotificationType, OrderStatus, CancellationReason } from "@prisma/client";
import { getIo } from "../config/socket";

const generateOrderNumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `SF${timestamp}${random}`;
};

export const OrderController = {
  createOrder: asyncHandler(async (req: Request, res: Response) => {
    const { addressId, specialInstructions, couponCode } = req.body;
    const userId = req.user!.userId;

    // Get cart items
    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: { foodItem: true },
    });

    if (cartItems.length === 0) {
      throw new BadRequestError("Cart is empty");
    }

    // Validate address
    const address = await prisma.address.findFirst({
      where: { id: addressId, userId, isActive: true },
    });

    if (!address) {
      throw new NotFoundError("Delivery address not found");
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
      const couponValidation = await CouponService.validateCoupon(
        couponCode,
        userId,
        subtotal
      );
      couponDiscount = couponValidation.discount;
      discount = couponDiscount;
      appliedCouponCode = couponValidation.code;
    }

    const finalTotal = subtotal + deliveryFee + tax - discount;

    // Create order
    const order = await prisma.$transaction(async (tx) => {
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
          status: OrderStatus.PLACED,
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
          status: OrderStatus.PLACED,
          note: "Order placed successfully",
        },
      });

      // Apply coupon usage if applicable
      if (couponCode && appliedCouponCode) {
        await CouponService.applyCoupon(couponCode, userId, newOrder.id, subtotal);
      }

      // Clear cart
      await tx.cartItem.deleteMany({ where: { userId } });

      return newOrder;
    });

    const fullOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        items: true,
        address: true,
      },
    });

    // Send notification
    await NotificationService.createNotification({
      userId,
      type: NotificationType.ORDER_PLACED,
      title: "Order Placed",
      message: `Your order #${order.orderNumber} has been placed successfully`,
      data: { orderId: order.id, orderNumber: order.orderNumber },
    });

    await AuditLogService.log({
      userId,
      action: "ORDER_CREATED",
      resource: "order",
      resourceId: order.id,
      newValue: fullOrder,
      ipAddress: req.ip,
    });

    sendResponse(res, 201, "Order placed successfully", fullOrder);
  }),

  getOrders: asyncHandler(async (req: Request, res: Response) => {
    const { status, page = "1", limit = "10" } = req.query;
    const userId = req.user!.userId;

    const where: any = { userId };
    if (status) {
      where.status = status as OrderStatus;
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
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
      prisma.order.count({ where }),
    ]);

    sendResponse(res, 200, "Orders retrieved", orders, {
      page: parseInt(page as string),
      limit: take,
      total,
      totalPages: Math.ceil(total / take),
    });
  }),

  getOrderById: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.userId;

    const order = await prisma.order.findFirst({
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
      throw new NotFoundError("Order not found");
    }

    sendResponse(res, 200, "Order retrieved", order);
  }),

  cancelOrder: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { reason, note } = req.body;
    const userId = req.user!.userId;

    const order = await prisma.order.findFirst({
      where: { id, userId },
      include: { payment: true },
    });

    if (!order) {
      throw new NotFoundError("Order not found");
    }

    // Business rules: Cannot cancel if already out for delivery or delivered
    const nonCancellableStatuses = [
      OrderStatus.OUT_FOR_DELIVERY,
      OrderStatus.DELIVERED,
      OrderStatus.CANCELLED,
    ];

    if (nonCancellableStatuses.includes(order.status)) {
      throw new BadRequestError(
        `Cannot cancel order that is already ${order.status.toLowerCase().replace("_", " ")}`
      );
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id },
        data: {
          status: OrderStatus.CANCELLED,
          isCancelled: true,
          cancelledAt: new Date(),
          cancelledBy: userId,
          cancellationReason: reason || CancellationReason.CUSTOMER_REQUEST,
          cancellationNote: note,
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: id,
          status: OrderStatus.CANCELLED,
          note: note || "Cancelled by customer",
          changedBy: userId,
        },
      });

      return updated;
    });

    await NotificationService.createNotification({
      userId,
      type: NotificationType.ORDER_CANCELLED,
      title: "Order Cancelled",
      message: `Your order #${order.orderNumber} has been cancelled`,
      data: { orderId: order.id, orderNumber: order.orderNumber },
    });

    await AuditLogService.log({
      userId,
      action: "ORDER_CANCELLED",
      resource: "order",
      resourceId: order.id,
      oldValue: { status: order.status },
      newValue: { status: OrderStatus.CANCELLED },
      ipAddress: req.ip,
    });

    sendResponse(res, 200, "Order cancelled successfully", updatedOrder);
  }),

  // Admin: Update order status
  updateOrderStatus: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, note } = req.body;
    const adminUserId = req.user!.adminUserId;

    if (!adminUserId) {
      throw new ForbiddenError("Admin access required");
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: { payment: true },
    });

    if (!order) {
      throw new NotFoundError("Order not found");
    }

    if (order.status === OrderStatus.CANCELLED || order.status === OrderStatus.DELIVERED) {
      throw new BadRequestError("Cannot change status of a cancelled or delivered order");
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id },
        data: {
          status: status as OrderStatus,
          deliveredAt: status === OrderStatus.DELIVERED ? new Date() : undefined,
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: id,
          status: status as OrderStatus,
          note: note || `Status updated to ${status}`,
          changedBy: adminUserId,
        },
      });

      return updated;
    });

    // Map status to notification type
    const statusNotificationMap: Record<string, NotificationType> = {
      PAYMENT_CONFIRMED: NotificationType.PAYMENT_SUCCESS,
      ACCEPTED: NotificationType.ORDER_ACCEPTED,
      PREPARING: NotificationType.ORDER_PREPARING,
      READY: NotificationType.ORDER_READY,
      OUT_FOR_DELIVERY: NotificationType.ORDER_OUT_FOR_DELIVERY,
      DELIVERED: NotificationType.ORDER_DELIVERED,
    };

    getIo()?.to(id).emit("order_status_update", { orderId: id, status });

    const notificationType = statusNotificationMap[status];
    if (notificationType) {
      await NotificationService.createNotification({
        userId: order.userId,
        type: notificationType,
        title: status.replace(/_/g, " "),
        message: `Your order #${order.orderNumber} is now ${status.toLowerCase().replace(/_/g, " ")}`,
        data: { orderId: order.id, orderNumber: order.orderNumber, status },
      });
    }

    await AuditLogService.log({
      adminUserId,
      action: "ORDER_STATUS_CHANGED",
      resource: "order",
      resourceId: order.id,
      oldValue: { status: order.status },
      newValue: { status },
      ipAddress: req.ip,
    });

    sendResponse(res, 200, "Order status updated", updatedOrder);
  }),

  // Admin: Get all orders
  getAllOrders: asyncHandler(async (req: Request, res: Response) => {
    const {
      status,
      search,
      dateFrom,
      dateTo,
      page = "1",
      limit = "20",
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const where: any = {};

    if (status) {
      where.status = status as OrderStatus;
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search as string, mode: "insensitive" } },
        { contactName: { contains: search as string, mode: "insensitive" } },
        { contactPhone: { contains: search as string, mode: "insensitive" } },
      ];
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom as string);
      if (dateTo) where.createdAt.lte = new Date(dateTo as string);
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
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
        orderBy: { [sortBy as string]: sortOrder },
        skip,
        take,
      }),
      prisma.order.count({ where }),
    ]);

    sendResponse(res, 200, "Orders retrieved", orders, {
      page: parseInt(page as string),
      limit: take,
      total,
      totalPages: Math.ceil(total / take),
    });
  }),
};
