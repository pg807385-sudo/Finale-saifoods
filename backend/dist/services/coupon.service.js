"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CouponService = void 0;
const db_1 = require("../config/db");
const error_1 = require("../utils/error");
class CouponService {
    static async validateCoupon(code, userId, orderValue) {
        const coupon = await db_1.prisma.coupon.findUnique({
            where: { code: code.toUpperCase() },
            include: { usages: { where: { userId } } },
        });
        if (!coupon) {
            throw new error_1.NotFoundError("Coupon not found");
        }
        if (!coupon.isActive) {
            throw new error_1.BadRequestError("Coupon is inactive");
        }
        const now = new Date();
        if (now < coupon.startDate || now > coupon.endDate) {
            throw new error_1.BadRequestError("Coupon is expired or not yet active");
        }
        if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
            throw new error_1.BadRequestError("Coupon usage limit exceeded");
        }
        if (coupon.usages.length >= coupon.perUserLimit) {
            throw new error_1.BadRequestError("You have already used this coupon");
        }
        if (coupon.minOrderValue && orderValue < Number(coupon.minOrderValue)) {
            throw new error_1.BadRequestError(`Minimum order value of ₹${coupon.minOrderValue} required`);
        }
        let discount = 0;
        if (coupon.type === "PERCENTAGE") {
            discount = (orderValue * Number(coupon.value)) / 100;
            if (coupon.maxDiscount) {
                discount = Math.min(discount, Number(coupon.maxDiscount));
            }
        }
        else {
            discount = Number(coupon.value);
        }
        return {
            coupon,
            discount: Math.min(discount, orderValue),
            code: coupon.code,
        };
    }
    static async applyCoupon(code, userId, orderId, orderValue) {
        const validation = await this.validateCoupon(code, userId, orderValue);
        await db_1.prisma.couponUsage.create({
            data: {
                couponId: validation.coupon.id,
                userId,
                orderId,
            },
        });
        await db_1.prisma.coupon.update({
            where: { id: validation.coupon.id },
            data: { usageCount: { increment: 1 } },
        });
        return validation;
    }
}
exports.CouponService = CouponService;
//# sourceMappingURL=coupon.service.js.map