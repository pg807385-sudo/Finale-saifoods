import { Request, Response } from "express";
import { prisma } from "../config/db";
import { asyncHandler } from "../utils/asyncHandler";
import { sendResponse } from "../utils/response";
import { NotFoundError } from "../utils/error";

export const UserController = {
  getAddresses: asyncHandler(async (req: Request, res: Response) => {
    const addresses = await prisma.address.findMany({
      where: { userId: req.user!.userId, isActive: true },
      orderBy: { isDefault: "desc" },
    });
    sendResponse(res, 200, "Addresses retrieved", addresses);
  }),

  createAddress: asyncHandler(async (req: Request, res: Response) => {
    const data = req.body;

    if (data.isDefault) {
      await prisma.address.updateMany({
        where: { userId: req.user!.userId },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.create({
      data: {
        ...data,
        userId: req.user!.userId,
      },
    });

    sendResponse(res, 201, "Address added successfully", address);
  }),

  updateAddress: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const data = req.body;

    const existing = await prisma.address.findFirst({
      where: { id, userId: req.user!.userId },
    });

    if (!existing) {
      throw new NotFoundError("Address not found");
    }

    if (data.isDefault) {
      await prisma.address.updateMany({
        where: { userId: req.user!.userId },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.update({
      where: { id },
      data,
    });

    sendResponse(res, 200, "Address updated successfully", address);
  }),

  deleteAddress: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const existing = await prisma.address.findFirst({
      where: { id, userId: req.user!.userId },
    });

    if (!existing) {
      throw new NotFoundError("Address not found");
    }

    await prisma.address.update({
      where: { id },
      data: { isActive: false },
    });

    sendResponse(res, 200, "Address removed successfully");
  }),

  setDefaultAddress: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    await prisma.address.updateMany({
      where: { userId: req.user!.userId },
      data: { isDefault: false },
    });

    const address = await prisma.address.update({
      where: { id },
      data: { isDefault: true },
    });

    sendResponse(res, 200, "Default address updated", address);
  }),
};
