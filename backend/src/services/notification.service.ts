import { prisma } from "../config/db";
import { NotificationType, NotificationChannel } from "@prisma/client";

export class NotificationService {
  static async createNotification({
    userId,
    type,
    title,
    message,
    data,
    channel = NotificationChannel.IN_APP,
  }: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    data?: Record<string, any>;
    channel?: NotificationChannel;
  }) {
    return prisma.notification.create({
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

  static async createBulkNotifications({
    userIds,
    type,
    title,
    message,
    data,
    channel = NotificationChannel.IN_APP,
  }: {
    userIds: string[];
    type: NotificationType;
    title: string;
    message: string;
    data?: Record<string, any>;
    channel?: NotificationChannel;
  }) {
    return prisma.notification.createMany({
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

  static async getUnreadCount(userId: string) {
    return prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  static async markAsRead(notificationId: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true, readAt: new Date() },
    });
  }

  static async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }
}
