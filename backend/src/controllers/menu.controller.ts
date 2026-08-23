import { Request, Response } from "express";
import { prisma } from "../config/db";
import { asyncHandler } from "../utils/asyncHandler";
import { sendResponse } from "../utils/response";
import { NotFoundError } from "../utils/error";

export const MenuController = {
  getCategories: asyncHandler(async (req: Request, res: Response) => {
    const categories = await prisma.category.findMany({
      where: { isActive: true, isDeleted: false },
      orderBy: { sortOrder: "asc" },
    });
    sendResponse(res, 200, "Categories retrieved", categories);
  }),

  getFoodItems: asyncHandler(async (req: Request, res: Response) => {
    const {
      category,
      search,
      veg,
      featured,
      popular,
      minPrice,
      maxPrice,
      sortBy = "createdAt",
      sortOrder = "desc",
      page = "1",
      limit = "20",
    } = req.query;

    const where: any = {
      isAvailable: true,
      isDeleted: false,
    };

    if (category) {
      where.categoryId = category as string;
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: "insensitive" } },
        { description: { contains: search as string, mode: "insensitive" } },
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
      if (minPrice) where.price.gte = parseFloat(minPrice as string);
      if (maxPrice) where.price.lte = parseFloat(maxPrice as string);
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const [items, total] = await Promise.all([
      prisma.foodItem.findMany({
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
        orderBy: { [sortBy as string]: sortOrder },
        skip,
        take,
      }),
      prisma.foodItem.count({ where }),
    ]);

    sendResponse(res, 200, "Food items retrieved", items, {
      page: parseInt(page as string),
      limit: take,
      total,
      totalPages: Math.ceil(total / take),
    });
  }),

  getFoodItemById: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const item = await prisma.foodItem.findFirst({
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
      throw new NotFoundError("Food item not found");
    }

    sendResponse(res, 200, "Food item retrieved", item);
  }),

  getFeaturedItems: asyncHandler(async (req: Request, res: Response) => {
    const items = await prisma.foodItem.findMany({
      where: { isFeatured: true, isAvailable: true, isDeleted: false },
      include: {
        category: { select: { id: true, name: true } },
      },
      take: 10,
    });
    sendResponse(res, 200, "Featured items retrieved", items);
  }),

  getPopularItems: asyncHandler(async (req: Request, res: Response) => {
    const items = await prisma.foodItem.findMany({
      where: { isPopular: true, isAvailable: true, isDeleted: false },
      include: {
        category: { select: { id: true, name: true } },
      },
      take: 10,
    });
    sendResponse(res, 200, "Popular items retrieved", items);
  }),
};
