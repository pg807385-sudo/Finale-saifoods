"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MenuController = void 0;
const db_1 = require("../config/db");
const asyncHandler_1 = require("../utils/asyncHandler");
const response_1 = require("../utils/response");
const error_1 = require("../utils/error");
exports.MenuController = {
    getCategories: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const categories = await db_1.prisma.category.findMany({
            where: { isActive: true, isDeleted: false },
            orderBy: { sortOrder: "asc" },
        });
        (0, response_1.sendResponse)(res, 200, "Categories retrieved", categories);
    }),
    getFoodItems: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { category, search, veg, featured, popular, minPrice, maxPrice, sortBy = "createdAt", sortOrder = "desc", page = "1", limit = "20", } = req.query;
        const where = {
            isAvailable: true,
            isDeleted: false,
        };
        if (category) {
            where.categoryId = category;
        }
        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
            ];
        }
        if (veg !== undefined) {
            where.isVeg = veg === "true";
        }
        if (featured === "true") {
            where.isFeatured = true;
        }
        if (popular === "true") {
            where.isPopular = true;
        }
        if (minPrice || maxPrice) {
            where.price = {};
            if (minPrice)
                where.price.gte = parseFloat(minPrice);
            if (maxPrice)
                where.price.lte = parseFloat(maxPrice);
        }
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);
        const [items, total] = await Promise.all([
            db_1.prisma.foodItem.findMany({
                where,
                include: {
                    category: { select: { id: true, name: true } },
                    customizations: {
                        where: { isActive: true },
                        include: {
                            options: { where: { isActive: true } },
                        },
                        orderBy: { sortOrder: "asc" },
                    },
                },
                orderBy: { [sortBy]: sortOrder },
                skip,
                take,
            }),
            db_1.prisma.foodItem.count({ where }),
        ]);
        (0, response_1.sendResponse)(res, 200, "Food items retrieved", items, {
            page: parseInt(page),
            limit: take,
            total,
            totalPages: Math.ceil(total / take),
        });
    }),
    getFoodItemById: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { id } = req.params;
        const item = await db_1.prisma.foodItem.findFirst({
            where: { id, isDeleted: false },
            include: {
                category: true,
                customizations: {
                    where: { isActive: true },
                    include: {
                        options: { where: { isActive: true } },
                    },
                    orderBy: { sortOrder: "asc" },
                },
            },
        });
        if (!item) {
            throw new error_1.NotFoundError("Food item not found");
        }
        (0, response_1.sendResponse)(res, 200, "Food item retrieved", item);
    }),
    getFeaturedItems: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const items = await db_1.prisma.foodItem.findMany({
            where: { isFeatured: true, isAvailable: true, isDeleted: false },
            include: {
                category: { select: { id: true, name: true } },
            },
            take: 10,
        });
        (0, response_1.sendResponse)(res, 200, "Featured items retrieved", items);
    }),
    getPopularItems: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const items = await db_1.prisma.foodItem.findMany({
            where: { isPopular: true, isAvailable: true, isDeleted: false },
            include: {
                category: { select: { id: true, name: true } },
            },
            take: 10,
        });
        (0, response_1.sendResponse)(res, 200, "Popular items retrieved", items);
    }),
};
//# sourceMappingURL=menu.controller.js.map