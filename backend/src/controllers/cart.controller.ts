import { Request, Response } from "express";
import { prisma } from "../config/db";
import { asyncHandler } from "../utils/asyncHandler";
import { sendResponse } from "../utils/response";
import { NotFoundError, BadRequestError } from "../utils/error";

export const CartController = {
  getCart: asyncHandler(async (req: Request, res: Response) => {
    const cartItems = await prisma.cartItem.findMany({
      where: { userId: req.user!.userId },
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

    sendResponse(res, 200, "Cart retrieved", {
      items: itemsWithPricing,
      pricing: {
        subtotal: Number(subtotal.toFixed(2)),
        deliveryFee,
        tax: Number(tax.toFixed(2)),
        total: Number(total.toFixed(2)),
      },
    });
  }),

  addToCart: asyncHandler(async (req: Request, res: Response) => {
    const { foodItemId, quantity, selectedCustomizations, specialInstructions } = req.body;

    const foodItem = await prisma.foodItem.findFirst({
      where: { id: foodItemId, isAvailable: true, isDeleted: false },
    });

    if (!foodItem) {
      throw new NotFoundError("Food item not found or unavailable");
    }

    const existingItem = await prisma.cartItem.findFirst({
      where: {
        userId: req.user!.userId,
        foodItemId,
        selectedCustomizations: selectedCustomizations || null,
      },
    });

    if (existingItem) {
      const updated = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + (quantity || 1) },
        include: { foodItem: true },
      });
      return sendResponse(res, 200, "Cart updated", updated);
    }

    const cartItem = await prisma.cartItem.create({
      data: {
        userId: req.user!.userId,
        foodItemId,
        quantity: quantity || 1,
        selectedCustomizations: selectedCustomizations || null,
        specialInstructions,
      },
      include: { foodItem: true },
    });

    sendResponse(res, 201, "Item added to cart", cartItem);
  }),

  updateCartItem: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { quantity } = req.body;

    if (quantity < 1) {
      throw new BadRequestError("Quantity must be at least 1");
    }

    const cartItem = await prisma.cartItem.findFirst({
      where: { id, userId: req.user!.userId },
    });

    if (!cartItem) {
      throw new NotFoundError("Cart item not found");
    }

    const updated = await prisma.cartItem.update({
      where: { id },
      data: { quantity },
      include: { foodItem: true },
    });

    sendResponse(res, 200, "Cart item updated", updated);
  }),

  removeFromCart: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const cartItem = await prisma.cartItem.findFirst({
      where: { id, userId: req.user!.userId },
    });

    if (!cartItem) {
      throw new NotFoundError("Cart item not found");
    }

    await prisma.cartItem.delete({ where: { id } });
    sendResponse(res, 200, "Item removed from cart");
  }),

  clearCart: asyncHandler(async (req: Request, res: Response) => {
    await prisma.cartItem.deleteMany({
      where: { userId: req.user!.userId },
    });
    sendResponse(res, 200, "Cart cleared");
  }),
};
