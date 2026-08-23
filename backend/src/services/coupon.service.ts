import { prisma } from "../config/db";
import { BadRequestError, NotFoundError } from "../utils/error";

export class CouponService {
  static async validateCoupon(code: string, userId: string, orderValue: number) {
    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
      include: { usages: { where: { userId } } },
    });

    if (!coupon) {
      throw new NotFoundError("Coupon not found");
    }

    if (!coupon.isActive) {
      throw new BadRequestError("Coupon is inactive");
    }

    const now = new Date();
    if (now < coupon.startDate || now > coupon.endDate) {
      throw new BadRequestError("Coupon is expired or not yet active");
    }

    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      throw new BadRequestError("Coupon usage limit exceeded");
    }

    if (coupon.usages.length >= coupon.perUserLimit) {
      throw new BadRequestError("You have already used this coupon");
    }

    if (coupon.minOrderValue && orderValue < Number(coupon.minOrderValue)) {
      throw new BadRequestError(`Minimum order value of ₹${coupon.minOrderValue} required`);
    }

    let discount = 0;
    if (coupon.type === "PERCENTAGE") {
      discount = (orderValue * Number(coupon.value)) / 100;
      if (coupon.maxDiscount) {
        discount = Math.min(discount, Number(coupon.maxDiscount));
      }
    } else {
      discount = Number(coupon.value);
    }

    return {
      coupon,
      discount: Math.min(discount, orderValue),
      code: coupon.code,
    };
  }

  static async applyCoupon(code: string, userId: string, orderId: string, orderValue: number) {
    const validation = await this.validateCoupon(code, userId, orderValue);

    await prisma.couponUsage.create({
      data: {
        couponId: validation.coupon.id,
        userId,
        orderId,
      },
    });

    await prisma.coupon.update({
      where: { id: validation.coupon.id },
      data: { usageCount: { increment: 1 } },
    });

    return validation;
  }
}
