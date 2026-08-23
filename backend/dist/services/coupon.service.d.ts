export declare class CouponService {
    static validateCoupon(code: string, userId: string, orderValue: number): Promise<{
        coupon: {
            usages: {
                userId: string;
                id: string;
                couponId: string;
                orderId: string | null;
                usedAt: Date;
            }[];
        } & {
            description: string | null;
            id: string;
            createdAt: Date;
            isActive: boolean;
            updatedAt: Date;
            type: string;
            code: string;
            value: import("@prisma/client/runtime/library").Decimal;
            minOrderValue: import("@prisma/client/runtime/library").Decimal | null;
            maxDiscount: import("@prisma/client/runtime/library").Decimal | null;
            usageLimit: number | null;
            usageCount: number;
            perUserLimit: number;
            startDate: Date;
            endDate: Date;
            applicableCategories: string[];
            applicableItems: string[];
        };
        discount: number;
        code: string;
    }>;
    static applyCoupon(code: string, userId: string, orderId: string, orderValue: number): Promise<{
        coupon: {
            usages: {
                userId: string;
                id: string;
                couponId: string;
                orderId: string | null;
                usedAt: Date;
            }[];
        } & {
            description: string | null;
            id: string;
            createdAt: Date;
            isActive: boolean;
            updatedAt: Date;
            type: string;
            code: string;
            value: import("@prisma/client/runtime/library").Decimal;
            minOrderValue: import("@prisma/client/runtime/library").Decimal | null;
            maxDiscount: import("@prisma/client/runtime/library").Decimal | null;
            usageLimit: number | null;
            usageCount: number;
            perUserLimit: number;
            startDate: Date;
            endDate: Date;
            applicableCategories: string[];
            applicableItems: string[];
        };
        discount: number;
        code: string;
    }>;
}
//# sourceMappingURL=coupon.service.d.ts.map