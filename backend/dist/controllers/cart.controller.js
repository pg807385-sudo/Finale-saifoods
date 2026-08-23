"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CartController = void 0;
const db_1 = require("../config/db");
const asyncHandler_1 = require("../utils/asyncHandler");
const response_1 = require("../utils/response");
const error_1 = require("../utils/error");
exports.CartController = {
    getCart: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const cartItems = await db_1.prisma.cartItem.findMany({
            where: { userId: req.user.userId },
            include: {
                foodItem: {
                    include: {
                        category: { select: { id: true, name: true } },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });
        let subtotal = 0;
        const itemsWithPricing = cartItems.map((item) => {
            const price = Number(item.foodItem.discountedPrice || item.foodItem.price);
            const customizationPrice = 0; // Calculate from selectedCustomizations
            const itemTotal = (price + customizationPrice) * item.quantity;
            subtotal += itemTotal;
            return {
                ...item,
                unitPrice: price,
                customizationPrice,
                itemTotal,
            };
        });
        const deliveryFee = subtotal > 500 ? 0 : 40;
        const tax = subtotal * 0.05;
        const total = subtotal + deliveryFee + tax;
        (0, response_1.sendResponse)(res, 200, "Cart retrieved", {
            items: itemsWithPricing,
            pricing: {
                subtotal: Number(subtotal.toFixed(2)),
                deliveryFee,
                tax: Number(tax.toFixed(2)),
                total: Number(total.toFixed(2)),
            },
        });
    }),
    addToCart: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { foodItemId, quantity, selectedCustomizations, specialInstructions } = req.body;
        const foodItem = await db_1.prisma.foodItem.findFirst({
            where: { id: foodItemId, isAvailable: true, isDeleted: false },
        });
        if (!foodItem) {
            throw new error_1.NotFoundError("Food item not found or unavailable");
        }
        const existingItem = await db_1.prisma.cartItem.findFirst({
            where: {
                userId: req.user.userId,
                foodItemId,
                selectedCustomizations: selectedCustomizations || null,
            },
        });
        if (existingItem) {
            const updated = await db_1.prisma.cartItem.update({
                where: { id: existingItem.id },
                data: { quantity: existingItem.quantity + (quantity || 1) },
                include: { foodItem: true },
            });
            return (0, response_1.sendResponse)(res, 200, "Cart updated", updated);
        }
        const cartItem = await db_1.prisma.cartItem.create({
            data: {
                userId: req.user.userId,
                foodItemId,
                quantity: quantity || 1,
                selectedCustomizations: selectedCustomizations || null,
                specialInstructions,
            },
            include: { foodItem: true },
        });
        (0, response_1.sendResponse)(res, 201, "Item added to cart", cartItem);
    }),
    updateCartItem: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { id } = req.params;
        const { quantity } = req.body;
        if (quantity < 1) {
            throw new error_1.BadRequestError("Quantity must be at least 1");
        }
        const cartItem = await db_1.prisma.cartItem.findFirst({
            where: { id, userId: req.user.userId },
        });
        if (!cartItem) {
            throw new error_1.NotFoundError("Cart item not found");
        }
        const updated = await db_1.prisma.cartItem.update({
            where: { id },
            data: { quantity },
            include: { foodItem: true },
        });
        (0, response_1.sendResponse)(res, 200, "Cart item updated", updated);
    }),
    removeFromCart: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { id } = req.params;
        const cartItem = await db_1.prisma.cartItem.findFirst({
            where: { id, userId: req.user.userId },
        });
        if (!cartItem) {
            throw new error_1.NotFoundError("Cart item not found");
        }
        await db_1.prisma.cartItem.delete({ where: { id } });
        (0, response_1.sendResponse)(res, 200, "Item removed from cart");
    }),
    clearCart: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        await db_1.prisma.cartItem.deleteMany({
            where: { userId: req.user.userId },
        });
        (0, response_1.sendResponse)(res, 200, "Cart cleared");
    }),
};
//# sourceMappingURL=cart.controller.js.map