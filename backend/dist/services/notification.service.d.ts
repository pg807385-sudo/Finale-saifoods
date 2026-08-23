import { NotificationType, NotificationChannel } from "@prisma/client";
export declare class NotificationService {
    static createNotification({ userId, type, title, message, data, channel, }: {
        userId: string;
        type: NotificationType;
        title: string;
        message: string;
        data?: Record<string, any>;
        channel?: NotificationChannel;
    }): Promise<{
        message: string;
        userId: string;
        data: import("@prisma/client/runtime/library").JsonValue | null;
        id: string;
        createdAt: Date;
        type: import(".prisma/client").$Enums.NotificationType;
        title: string;
        channel: import(".prisma/client").$Enums.NotificationChannel;
        isRead: boolean;
        sentAt: Date;
        readAt: Date | null;
    }>;
    static createBulkNotifications({ userIds, type, title, message, data, channel, }: {
        userIds: string[];
        type: NotificationType;
        title: string;
        message: string;
        data?: Record<string, any>;
        channel?: NotificationChannel;
    }): Promise<import(".prisma/client").Prisma.BatchPayload>;
    static getUnreadCount(userId: string): Promise<number>;
    static markAsRead(notificationId: string, userId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
    static markAllAsRead(userId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
}
//# sourceMappingURL=notification.service.d.ts.map