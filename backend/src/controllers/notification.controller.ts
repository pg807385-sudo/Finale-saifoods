import { Request, Response } from "express";
import { prisma } from "../config/db";
import { asyncHandler } from "../utils/asyncHandler";
import { sendResponse } from "../utils/response";
import { NotificationService } from "../services/notification.service";

export const NotificationController = {
  getNotifications: asyncHandler(async (req: Request, res: Response) => {
    const { page = "1", limit = "20", unreadOnly } = req.query;
    const userId = req.user!.userId;

    const where: any = { userId };
    if (unreadOnly === "true") {
      where.isRead = false;
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.notification.count({ where: { userId } }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    sendResponse(res, 200, "Notifications retrieved", { notifications, unreadCount }, {
      page: parseInt(page as string),
      limit: take,
      total,
      totalPages: Math.ceil(total / take),
    });
  }),

  markAsRead: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await NotificationService.markAsRead(id, req.user!.userId);
    sendResponse(res, 200, "Notification marked as read");
  }),

  markAllAsRead: asyncHandler(async (req: Request, res: Response) => {
    await NotificationService.markAllAsRead(req.user!.userId);
    sendResponse(res, 200, "All notifications marked as read");
  }),
};
