"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const db_1 = require("../config/db");
const asyncHandler_1 = require("../utils/asyncHandler");
const response_1 = require("../utils/response");
const error_1 = require("../utils/error");
exports.UserController = {
    getAddresses: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const addresses = await db_1.prisma.address.findMany({
            where: { userId: req.user.userId, isActive: true },
            orderBy: { isDefault: "desc" },
        });
        (0, response_1.sendResponse)(res, 200, "Addresses retrieved", addresses);
    }),
    createAddress: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const data = req.body;
        if (data.isDefault) {
            await db_1.prisma.address.updateMany({
                where: { userId: req.user.userId },
                data: { isDefault: false },
            });
        }
        const address = await db_1.prisma.address.create({
            data: {
                ...data,
                userId: req.user.userId,
            },
        });
        (0, response_1.sendResponse)(res, 201, "Address added successfully", address);
    }),
    updateAddress: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { id } = req.params;
        const data = req.body;
        const existing = await db_1.prisma.address.findFirst({
            where: { id, userId: req.user.userId },
        });
        if (!existing) {
            throw new error_1.NotFoundError("Address not found");
        }
        if (data.isDefault) {
            await db_1.prisma.address.updateMany({
                where: { userId: req.user.userId },
                data: { isDefault: false },
            });
        }
        const address = await db_1.prisma.address.update({
            where: { id },
            data,
        });
        (0, response_1.sendResponse)(res, 200, "Address updated successfully", address);
    }),
    deleteAddress: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { id } = req.params;
        const existing = await db_1.prisma.address.findFirst({
            where: { id, userId: req.user.userId },
        });
        if (!existing) {
            throw new error_1.NotFoundError("Address not found");
        }
        await db_1.prisma.address.update({
            where: { id },
            data: { isActive: false },
        });
        (0, response_1.sendResponse)(res, 200, "Address removed successfully");
    }),
    setDefaultAddress: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { id } = req.params;
        await db_1.prisma.address.updateMany({
            where: { userId: req.user.userId },
            data: { isDefault: false },
        });
        const address = await db_1.prisma.address.update({
            where: { id },
            data: { isDefault: true },
        });
        (0, response_1.sendResponse)(res, 200, "Default address updated", address);
    }),
};
//# sourceMappingURL=user.controller.js.map