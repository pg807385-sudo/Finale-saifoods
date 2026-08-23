import { prisma } from "../config/db";
import { logger } from "../utils/logger";

export class AuditLogService {
  static async log({
    userId,
    adminUserId,
    action,
    resource,
    resourceId,
    oldValue,
    newValue,
    ipAddress,
    userAgent,
    metadata,
  }: {
    userId?: string;
    adminUserId?: string;
    action: string;
    resource: string;
    resourceId?: string;
    oldValue?: any;
    newValue?: any;
    ipAddress?: string;
    userAgent?: string;
    metadata?: any;
  }) {
    try {
      return await prisma.auditLog.create({
        data: {
          userId,
          adminUserId,
          action,
          resource,
          resourceId,
          oldValue: oldValue || null,
          newValue: newValue || null,
          ipAddress,
          userAgent,
          metadata: metadata || null,
        },
      });
    } catch (error) {
      logger.error("Failed to create audit log:", error);
    }
  }
}
