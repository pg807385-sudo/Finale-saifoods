"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardController = void 0;
const db_1 = require("../config/db");
const asyncHandler_1 = require("../utils/asyncHandler");
const response_1 = require("../utils/response");
const client_1 = require("@prisma/client");
exports.DashboardController = {
    getStats: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const [totalOrders, todayOrders, pendingOrders, preparingOrders, completedOrders, cancelledOrders, totalRevenue, todayRevenue, totalCustomers, totalFoodItems, totalCategories, activeCoupons,] = await Promise.all([
            db_1.prisma.order.count(),
            db_1.prisma.order.count({ where: { createdAt: { gte: today } } }),
            db_1.prisma.order.count({
                where: {
                    status: { in: [client_1.OrderStatus.PLACED, client_1.OrderStatus.PAYMENT_CONFIRMED, client_1.OrderStatus.ACCEPTED] },
                    isCancelled: false,
                },
            }),
            db_1.prisma.order.count({
                where: { status: client_1.OrderStatus.PREPARING, isCancelled: false },
            }),
            db_1.prisma.order.count({
                where: { status: client_1.OrderStatus.DELIVERED },
            }),
            db_1.prisma.order.count({
                where: { isCancelled: true },
            }),
            db_1.prisma.order.aggregate({
                where: { payment: { status: client_1.PaymentStatus.SUCCESS } },
                _sum: { finalTotal: true },
            }),
            db_1.prisma.order.aggregate({
                where: {
                    createdAt: { gte: today },
                    payment: { status: client_1.PaymentStatus.SUCCESS },
                },
                _sum: { finalTotal: true },
            }),
            db_1.prisma.user.count(),
            db_1.prisma.foodItem.count({ where: { isDeleted: false } }),
            db_1.prisma.category.count({ where: { isDeleted: false } }),
            db_1.prisma.coupon.count({ where: { isActive: true } }),
        ]);
        // Get recent orders
        const recentOrders = await db_1.prisma.order.findMany({
            take: 10,
            orderBy: { createdAt: "desc" },
            include: {
                user: { select: { name: true, phone: true } },
                items: { take: 2, select: { name: true, quantity: true } },
                payment: { select: { status: true } },
            },
        });
        // Get popular items
        const popularItems = await db_1.prisma.foodItem.findMany({
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
        const dailyRevenue = await db_1.prisma.$queryRaw `
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
        (0, response_1.sendResponse)(res, 200, "Dashboard stats retrieved", {
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
    getSalesReport: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { from, to } = req.query;
        const startDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const endDate = to ? new Date(to) : new Date();
        const orders = await db_1.prisma.order.findMany({
            where: {
                createdAt: { gte: startDate, lte: endDate },
                payment: { status: client_1.PaymentStatus.SUCCESS },
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
        (0, response_1.sendResponse)(res, 200, "Sales report retrieved", { summary, orders });
    }),
};
//# sourceMappingURL=dashboard.controller.js.map