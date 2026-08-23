export declare class AuditLogService {
    static log({ userId, adminUserId, action, resource, resourceId, oldValue, newValue, ipAddress, userAgent, metadata, }: {
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
    }): Promise<{
        userId: string | null;
        adminUserId: string | null;
        action: string;
        resource: string;
        resourceId: string | null;
        oldValue: import("@prisma/client/runtime/library").JsonValue | null;
        newValue: import("@prisma/client/runtime/library").JsonValue | null;
        ipAddress: string | null;
        userAgent: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        id: string;
        createdAt: Date;
    } | undefined>;
}
//# sourceMappingURL=audit.service.d.ts.map