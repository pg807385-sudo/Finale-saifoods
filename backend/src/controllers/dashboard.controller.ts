import { Request, Response } from "express";
import { prisma } from "../config/db";
import { asyncHandler } from "../utils/asyncHandler";
import { sendResponse } from "../utils/response";
import { OrderStatus, PaymentStatus } from "@prisma/client";

export const DashboardController = {
  getStats: asyncHandler(async (req: Request, res: Response) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalOrders,
      todayOrders,
      pendingOrders,
      preparingOrders,
      completedOrders,
      cancelledOrders,
      totalRevenue,
      todayRevenue,
      totalCustomers,
      totalFoodItems,
      totalCategories,
      activeCoupons,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { createdAt: { gte: today } } }),
      prisma.order.count({
        where: {
          status: { in: [OrderStatus.PLACED, OrderStatus.PAYMENT_CONFIRMED, OrderStatus.ACCEPTED] },
          isCancelled: false,
        },
      }),
      prisma.order.count({
        where: { status: OrderStatus.PREPARING, isCancelled: false },
      }),
      prisma.order.count({
        where: { status: OrderStatus.DELIVERED },
      }),
      prisma.order.count({
        where: { isCancelled: true },
      }),
      prisma.order.aggregate({
        where: { payment: { status: PaymentStatus.SUCCESS } },
        _sum: { finalTotal: true },
      }),
      prisma.order.aggregate({
        where: {
          createdAt: { gte: today },
          payment: { status: PaymentStatus.SUCCESS },
        },
        _sum: { finalTotal: true },
      }),
      prisma.user.count(),
      prisma.foodItem.count({ where: { isDeleted: false } }),
      prisma.category.count({ where: { isDeleted: false } }),
      prisma.coupon.count({ where: { isActive: true } }),
    ]);

    // Get recent orders
    const recentOrders = await prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, phone: true } },
        items: { take: 2, select: { name: true, quantity: true } },
        payment: { select: { status: true } },
      },
    });

    // Get popular items
    const popularItems = await prisma.foodItem.findMany({
      where: { isPopular: true, isAvailable: true, isDeleted: false },
      take: 5,
      include: {
        category: { select: { name: true } },
        _count: { select: { orderItems: true } },
      },
    });

    // Get daily revenue for last 7 days
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const dailyRevenue = await prisma.$queryRaw`
      SELECT 
        DATE(o."createdAt") as date,
        COUNT(*) as orders,
        SUM(o."finalTotal") as revenue
      FROM "orders" o
      INNER JOIN "payments" p ON p."orderId" = o.id
      WHERE o."createdAt" >= ${sevenDaysAgo}
        AND p."status" = 'SUCCESS'
      GROUP BY DATE(o."createdAt")
      ORDER BY date ASC
    `;

    sendResponse(res, 200, "Dashboard stats retrieved", {
      stats: {
        totalOrders,
        todayOrders,
        pendingOrders,
        preparingOrders,
        completedOrders,
        cancelledOrders,
        totalRevenue: Number(totalRevenue._sum.finalTotal || 0),
        todayRevenue: Number(todayRevenue._sum.finalTotal || 0),
        totalCustomers,
        totalFoodItems,
        totalCategories,
        activeCoupons,
      },
      recentOrders,
      popularItems,
      dailyRevenue,
    });
  }),

  getSalesReport: asyncHandler(async (req: Request, res: Response) => {
    const { from, to } = req.query;
    const startDate = from ? new Date(from as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = to ? new Date(to as string) : new Date();

    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        payment: { status: PaymentStatus.SUCCESS },
      },
      include: {
        items: true,
        payment: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const summary = {
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum, o) => sum + Number(o.finalTotal), 0),
      totalItems: orders.reduce((sum, o) => sum + o.items.reduce((is, i) => is + i.quantity, 0), 0),
      averageOrderValue: orders.length > 0 
        ? orders.reduce((sum, o) => sum + Number(o.finalTotal), 0) / orders.length 
        : 0,
    };

    sendResponse(res, 200, "Sales report retrieved", { summary, orders });
  }),
};
