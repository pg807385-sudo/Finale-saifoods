"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const db_1 = require("../config/db");
const asyncHandler_1 = require("../utils/asyncHandler");
const response_1 = require("../utils/response");
const error_1 = require("../utils/error");
const audit_service_1 = require("../services/audit.service");
exports.AdminController = {
    // Category Management
    createCategory: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const category = await db_1.prisma.category.create({ data: req.body });
        await audit_service_1.AuditLogService.log({
            adminUserId: req.user.adminUserId,
            action: "CATEGORY_CREATED",
            resource: "category",
            resourceId: category.id,
            newValue: category,
            ipAddress: req.ip,
        });
        (0, response_1.sendResponse)(res, 201, "Category created", category);
    }),
    updateCategory: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { id } = req.params;
        const category = await db_1.prisma.category.update({
            where: { id },
            data: req.body,
        });
        await audit_service_1.AuditLogService.log({
            adminUserId: req.user.adminUserId,
            action: "CATEGORY_UPDATED",
            resource: "category",
            resourceId: id,
            newValue: category,
            ipAddress: req.ip,
        });
        (0, response_1.sendResponse)(res, 200, "Category updated", category);
    }),
    deleteCategory: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { id } = req.params;
        await db_1.prisma.category.update({
            where: { id },
            data: { isDeleted: true, isActive: false },
        });
        await audit_service_1.AuditLogService.log({
            adminUserId: req.user.adminUserId,
            action: "CATEGORY_DELETED",
            resource: "category",
            resourceId: id,
            ipAddress: req.ip,
        });
        (0, response_1.sendResponse)(res, 200, "Category deleted");
    }),
    // Food Item Management
    createFoodItem: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const data = req.body;
        if (req.file) {
            data.images = [`/uploads/${req.file.filename}`];
        }
        const foodItem = await db_1.prisma.foodItem.create({
            data,
            include: { category: true, customizations: true },
        });
        await audit_service_1.AuditLogService.log({
            adminUserId: req.user.adminUserId,
            action: "FOOD_ITEM_CREATED",
            resource: "food_item",
            resourceId: foodItem.id,
            newValue: foodItem,
            ipAddress: req.ip,
        });
        (0, response_1.sendResponse)(res, 201, "Food item created", foodItem);
    }),
    updateFoodItem: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { id } = req.params;
        const data = req.body;
        if (req.file) {
            data.images = [`/uploads/${req.file.filename}`];
        }
        const foodItem = await db_1.prisma.foodItem.update({
            where: { id },
            data,
            include: { category: true, customizations: true },
        });
        await audit_service_1.AuditLogService.log({
            adminUserId: req.user.adminUserId,
            action: "FOOD_ITEM_UPDATED",
            resource: "food_item",
            resourceId: id,
            newValue: foodItem,
            ipAddress: req.ip,
        });
        (0, response_1.sendResponse)(res, 200, "Food item updated", foodItem);
    }),
    deleteFoodItem: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { id } = req.params;
        await db_1.prisma.foodItem.update({
            where: { id },
            data: { isDeleted: true, isAvailable: false },
        });
        await audit_service_1.AuditLogService.log({
            adminUserId: req.user.adminUserId,
            action: "FOOD_ITEM_DELETED",
            resource: "food_item",
            resourceId: id,
            ipAddress: req.ip,
        });
        (0, response_1.sendResponse)(res, 200, "Food item deleted");
    }),
    // Customization Management
    createCustomization: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { foodItemId, ...data } = req.body;
        const customization = await db_1.prisma.foodCustomization.create({
            data: { ...data, foodItemId },
            include: { options: true },
        });
        (0, response_1.sendResponse)(res, 201, "Customization created", customization);
    }),
    updateCustomization: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { id } = req.params;
        const customization = await db_1.prisma.foodCustomization.update({
            where: { id },
            data: req.body,
            include: { options: true },
        });
        (0, response_1.sendResponse)(res, 200, "Customization updated", customization);
    }),
    // Coupon Management
    createCoupon: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const coupon = await db_1.prisma.coupon.create({ data: req.body });
        await audit_service_1.AuditLogService.log({
            adminUserId: req.user.adminUserId,
            action: "COUPON_CREATED",
            resource: "coupon",
            resourceId: coupon.id,
            newValue: coupon,
            ipAddress: req.ip,
        });
        (0, response_1.sendResponse)(res, 201, "Coupon created", coupon);
    }),
    updateCoupon: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { id } = req.params;
        const coupon = await db_1.prisma.coupon.update({
            where: { id },
            data: req.body,
        });
        await audit_service_1.AuditLogService.log({
            adminUserId: req.user.adminUserId,
            action: "COUPON_UPDATED",
            resource: "coupon",
            resourceId: id,
            newValue: coupon,
            ipAddress: req.ip,
        });
        (0, response_1.sendResponse)(res, 200, "Coupon updated", coupon);
    }),
    deleteCoupon: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { id } = req.params;
        await db_1.prisma.coupon.update({
            where: { id },
            data: { isActive: false },
        });
        (0, response_1.sendResponse)(res, 200, "Coupon deactivated");
    }),
    getCoupons: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const coupons = await db_1.prisma.coupon.findMany({
            orderBy: { createdAt: "desc" },
        });
        (0, response_1.sendResponse)(res, 200, "Coupons retrieved", coupons);
    }),
    // Admin Alert Management
    createAlert: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const alert = await db_1.prisma.adminAlert.create({
            data: {
                ...req.body,
                createdBy: req.user.adminUserId,
            },
        });
        (0, response_1.sendResponse)(res, 201, "Alert created", alert);
    }),
    updateAlert: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { id } = req.params;
        const alert = await db_1.prisma.adminAlert.update({
            where: { id },
            data: req.body,
        });
        (0, response_1.sendResponse)(res, 200, "Alert updated", alert);
    }),
    deleteAlert: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { id } = req.params;
        await db_1.prisma.adminAlert.delete({ where: { id } });
        (0, response_1.sendResponse)(res, 200, "Alert deleted");
    }),
    getAlerts: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const alerts = await db_1.prisma.adminAlert.findMany({
            orderBy: { createdAt: "desc" },
        });
        (0, response_1.sendResponse)(res, 200, "Alerts retrieved", alerts);
    }),
    // Customer Management
    getCustomers: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { search, page = "1", limit = "20" } = req.query;
        const where = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
                { phone: { contains: search, mode: "insensitive" } },
            ];
        }
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);
        const [customers, total] = await Promise.all([
            db_1.prisma.user.findMany({
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
            db_1.prisma.user.count({ where }),
        ]);
        (0, response_1.sendResponse)(res, 200, "Customers retrieved", customers, {
            page: parseInt(page),
            limit: take,
            total,
            totalPages: Math.ceil(total / take),
        });
    }),
    getCustomerById: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { id } = req.params;
        const customer = await db_1.prisma.user.findUnique({
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
            throw new error_1.NotFoundError("Customer not found");
        }
        (0, response_1.sendResponse)(res, 200, "Customer retrieved", customer);
    }),
    toggleCustomerStatus: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { id } = req.params;
        const customer = await db_1.prisma.user.findUnique({ where: { id } });
        if (!customer) {
            throw new error_1.NotFoundError("Customer not found");
        }
        const updated = await db_1.prisma.user.update({
            where: { id },
            data: { isActive: !customer.isActive },
        });
        await audit_service_1.AuditLogService.log({
            adminUserId: req.user.adminUserId,
            action: updated.isActive ? "CUSTOMER_ENABLED" : "CUSTOMER_DISABLED",
            resource: "user",
            resourceId: id,
            oldValue: { isActive: customer.isActive },
            newValue: { isActive: updated.isActive },
            ipAddress: req.ip,
        });
        (0, response_1.sendResponse)(res, 200, `Customer ${updated.isActive ? "enabled" : "disabled"}`, updated);
    }),
    // Audit Logs
    getAuditLogs: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { action, resource, page = "1", limit = "50" } = req.query;
        const where = {};
        if (action)
            where.action = action;
        if (resource)
            where.resource = resource;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);
        const [logs, total] = await Promise.all([
            db_1.prisma.auditLog.findMany({
                where,
                include: {
                    user: { select: { name: true, email: true } },
                    adminUser: { include: { user: { select: { name: true, email: true } } } },
                },
                orderBy: { createdAt: "desc" },
                skip,
                take,
            }),
            db_1.prisma.auditLog.count({ where }),
        ]);
        (0, response_1.sendResponse)(res, 200, "Audit logs retrieved", logs, {
            page: parseInt(page),
            limit: take,
            total,
            totalPages: Math.ceil(total / take),
        });
    }),
};
//# sourceMappingURL=admin.controller.js.map