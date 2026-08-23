"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const db_1 = require("../config/db");
const client_1 = require("@prisma/client");
class NotificationService {
    static async createNotification({ userId, type, title, message, data, channel = client_1.NotificationChannel.IN_APP, }) {
        return db_1.prisma.notification.create({
            data: {
                userId,
                type,
                title,
                message,
                data: data || {},
                channel,
            },
        });
    }
    static async createBulkNotifications({ userIds, type, title, message, data, channel = client_1.NotificationChannel.IN_APP, }) {
        return db_1.prisma.notification.createMany({
            data: userIds.map((userId) => ({
                userId,
                type,
                title,
                message,
                data: data || {},
                channel,
            })),
        });
    }
    static async getUnreadCount(userId) {
        return db_1.prisma.notification.count({
            where: { userId, isRead: false },
        });
    }
    static async markAsRead(notificationId, userId) {
        return db_1.prisma.notification.updateMany({
            where: { id: notificationId, userId },
            data: { isRead: true, readAt: new Date() },
        });
    }
    static async markAllAsRead(userId) {
        return db_1.prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true, readAt: new Date() },
        });
    }
}
exports.NotificationService = NotificationService;
//# sourceMappingURL=notification.service.js.map