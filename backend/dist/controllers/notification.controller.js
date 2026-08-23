"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationController = void 0;
const db_1 = require("../config/db");
const asyncHandler_1 = require("../utils/asyncHandler");
const response_1 = require("../utils/response");
const notification_service_1 = require("../services/notification.service");
exports.NotificationController = {
    getNotifications: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { page = "1", limit = "20", unreadOnly } = req.query;
        const userId = req.user.userId;
        const where = { userId };
        if (unreadOnly === "true") {
            where.isRead = false;
        }
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);
        const [notifications, total, unreadCount] = await Promise.all([
            db_1.prisma.notification.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip,
                take,
            }),
            db_1.prisma.notification.count({ where: { userId } }),
            db_1.prisma.notification.count({ where: { userId, isRead: false } }),
        ]);
        (0, response_1.sendResponse)(res, 200, "Notifications retrieved", { notifications, unreadCount }, {
            page: parseInt(page),
            limit: take,
            total,
            totalPages: Math.ceil(total / take),
        });
    }),
    markAsRead: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { id } = req.params;
        await notification_service_1.NotificationService.markAsRead(id, req.user.userId);
        (0, response_1.sendResponse)(res, 200, "Notification marked as read");
    }),
    markAllAsRead: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        await notification_service_1.NotificationService.markAllAsRead(req.user.userId);
        (0, response_1.sendResponse)(res, 200, "All notifications marked as read");
    }),
};
//# sourceMappingURL=notification.controller.js.map