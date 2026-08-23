import { Request, Response } from "express";
import { prisma } from "../config/db";
import { asyncHandler } from "../utils/asyncHandler";
import { sendResponse } from "../utils/response";
import { NotFoundError } from "../utils/error";
import { AuditLogService } from "../services/audit.service";

export const AdminController = {
  // Category Management
  createCategory: asyncHandler(async (req: Request, res: Response) => {
    const category = await prisma.category.create({ data: req.body });

    await AuditLogService.log({
      adminUserId: req.user!.adminUserId,
      action: "CATEGORY_CREATED",
      resource: "category",
      resourceId: category.id,
      newValue: category,
      ipAddress: req.ip,
    });

    sendResponse(res, 201, "Category created", category);
  }),

  updateCategory: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const category = await prisma.category.update({
      where: { id },
      data: req.body,
    });

    await AuditLogService.log({
      adminUserId: req.user!.adminUserId,
      action: "CATEGORY_UPDATED",
      resource: "category",
      resourceId: id,
      newValue: category,
      ipAddress: req.ip,
    });

    sendResponse(res, 200, "Category updated", category);
  }),

  deleteCategory: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await prisma.category.update({
      where: { id },
      data: { isDeleted: true, isActive: false },
    });

    await AuditLogService.log({
      adminUserId: req.user!.adminUserId,
      action: "CATEGORY_DELETED",
      resource: "category",
      resourceId: id,
      ipAddress: req.ip,
    });

    sendResponse(res, 200, "Category deleted");
  }),

  // Food Item Management
  createFoodItem: asyncHandler(async (req: Request, res: Response) => {
    const data = req.body;
    if (req.file) {
      data.images = [`/uploads/${req.file.filename}`];
    }

    const foodItem = await prisma.foodItem.create({
      data,
      include: { category: true, customizations: true },
    });

    await AuditLogService.log({
      adminUserId: req.user!.adminUserId,
      action: "FOOD_ITEM_CREATED",
      resource: "food_item",
      resourceId: foodItem.id,
      newValue: foodItem,
      ipAddress: req.ip,
    });

    sendResponse(res, 201, "Food item created", foodItem);
  }),

  updateFoodItem: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const data = req.body;
    if (req.file) {
      data.images = [`/uploads/${req.file.filename}`];
    }

    const foodItem = await prisma.foodItem.update({
      where: { id },
      data,
      include: { category: true, customizations: true },
    });

    await AuditLogService.log({
      adminUserId: req.user!.adminUserId,
      action: "FOOD_ITEM_UPDATED",
      resource: "food_item",
      resourceId: id,
      newValue: foodItem,
      ipAddress: req.ip,
    });

    sendResponse(res, 200, "Food item updated", foodItem);
  }),

  deleteFoodItem: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await prisma.foodItem.update({
      where: { id },
      data: { isDeleted: true, isAvailable: false },
    });

    await AuditLogService.log({
      adminUserId: req.user!.adminUserId,
      action: "FOOD_ITEM_DELETED",
      resource: "food_item",
      resourceId: id,
      ipAddress: req.ip,
    });

    sendResponse(res, 200, "Food item deleted");
  }),

  // Customization Management
  createCustomization: asyncHandler(async (req: Request, res: Response) => {
    const { foodItemId, ...data } = req.body;
    const customization = await prisma.foodCustomization.create({
      data: { ...data, foodItemId },
      include: { options: true },
    });

    sendResponse(res, 201, "Customization created", customization);
  }),

  updateCustomization: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const customization = await prisma.foodCustomization.update({
      where: { id },
      data: req.body,
      include: { options: true },
    });

    sendResponse(res, 200, "Customization updated", customization);
  }),

  // Coupon Management
  createCoupon: asyncHandler(async (req: Request, res: Response) => {
    const coupon = await prisma.coupon.create({ data: req.body });

    await AuditLogService.log({
      adminUserId: req.user!.adminUserId,
      action: "COUPON_CREATED",
      resource: "coupon",
      resourceId: coupon.id,
      newValue: coupon,
      ipAddress: req.ip,
    });

    sendResponse(res, 201, "Coupon created", coupon);
  }),

  updateCoupon: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const coupon = await prisma.coupon.update({
      where: { id },
      data: req.body,
    });

    await AuditLogService.log({
      adminUserId: req.user!.adminUserId,
      action: "COUPON_UPDATED",
      resource: "coupon",
      resourceId: id,
      newValue: coupon,
      ipAddress: req.ip,
    });

    sendResponse(res, 200, "Coupon updated", coupon);
  }),

  deleteCoupon: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await prisma.coupon.update({
      where: { id },
      data: { isActive: false },
    });

    sendResponse(res, 200, "Coupon deactivated");
  }),

  getCoupons: asyncHandler(async (req: Request, res: Response) => {
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: "desc" },
    });
    sendResponse(res, 200, "Coupons retrieved", coupons);
  }),

  // Admin Alert Management
  createAlert: asyncHandler(async (req: Request, res: Response) => {
    const alert = await prisma.adminAlert.create({
      data: {
        ...req.body,
        createdBy: req.user!.adminUserId,
      },
    });

    sendResponse(res, 201, "Alert created", alert);
  }),

  updateAlert: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const alert = await prisma.adminAlert.update({
      where: { id },
      data: req.body,
    });

    sendResponse(res, 200, "Alert updated", alert);
  }),

  deleteAlert: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await prisma.adminAlert.delete({ where: { id } });
    sendResponse(res, 200, "Alert deleted");
  }),

  getAlerts: asyncHandler(async (req: Request, res: Response) => {
    const alerts = await prisma.adminAlert.findMany({
      orderBy: { createdAt: "desc" },
    });
    sendResponse(res, 200, "Alerts retrieved", alerts);
  }),

  // Customer Management
  getCustomers: asyncHandler(async (req: Request, res: Response) => {
    const { search, page = "1", limit = "20" } = req.query;
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: "insensitive" } },
        { email: { contains: search as string, mode: "insensitive" } },
        { phone: { contains: search as string, mode: "insensitive" } },
      ];
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const [customers, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          isActive: true,
          isVerified: true,
          createdAt: true,
          lastLoginAt: true,
          _count: { select: { orders: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.user.count({ where }),
    ]);

    sendResponse(res, 200, "Customers retrieved", customers, {
      page: parseInt(page as string),
      limit: take,
      total,
      totalPages: Math.ceil(total / take),
    });
  }),

  getCustomerById: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const customer = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
        lastLoginAt: true,
        addresses: true,
        orders: {
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            id: true,
            orderNumber: true,
            status: true,
            finalTotal: true,
            createdAt: true,
          },
        },
      },
    });

    if (!customer) {
      throw new NotFoundError("Customer not found");
    }

    sendResponse(res, 200, "Customer retrieved", customer);
  }),

  toggleCustomerStatus: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const customer = await prisma.user.findUnique({ where: { id } });

    if (!customer) {
      throw new NotFoundError("Customer not found");
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: !customer.isActive },
    });

    await AuditLogService.log({
      adminUserId: req.user!.adminUserId,
      action: updated.isActive ? "CUSTOMER_ENABLED" : "CUSTOMER_DISABLED",
      resource: "user",
      resourceId: id,
      oldValue: { isActive: customer.isActive },
      newValue: { isActive: updated.isActive },
      ipAddress: req.ip,
    });

    sendResponse(res, 200, `Customer ${updated.isActive ? "enabled" : "disabled"}`, updated);
  }),

  // Audit Logs
  getAuditLogs: asyncHandler(async (req: Request, res: Response) => {
    const { action, resource, page = "1", limit = "50" } = req.query;
    const where: any = {};

    if (action) where.action = action as string;
    if (resource) where.resource = resource as string;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: { select: { name: true, email: true } },
          adminUser: { include: { user: { select: { name: true, email: true } } } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.auditLog.count({ where }),
    ]);

    sendResponse(res, 200, "Audit logs retrieved", logs, {
      page: parseInt(page as string),
      limit: take,
      total,
      totalPages: Math.ceil(total / take),
    });
  }),
};
