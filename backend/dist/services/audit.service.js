"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLogService = void 0;
const db_1 = require("../config/db");
const logger_1 = require("../utils/logger");
class AuditLogService {
    static async log({ userId, adminUserId, action, resource, resourceId, oldValue, newValue, ipAddress, userAgent, metadata, }) {
        try {
            return await db_1.prisma.auditLog.create({
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
        }
        catch (error) {
            logger_1.logger.error("Failed to create audit log:", error);
        }
    }
}
exports.AuditLogService = AuditLogService;
//# sourceMappingURL=audit.service.js.map