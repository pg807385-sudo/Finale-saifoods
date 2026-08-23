"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("../config/db");
const config_1 = require("../config");
const asyncHandler_1 = require("../utils/asyncHandler");
const response_1 = require("../utils/response");
const error_1 = require("../utils/error");
const audit_service_1 = require("../services/audit.service");
const generateTokens = (userId, email) => {
    const accessToken = jsonwebtoken_1.default.sign({ userId, email }, config_1.config.jwt.secret, {
        expiresIn: config_1.config.jwt.expiresIn,
    });
    const refreshToken = jsonwebtoken_1.default.sign({ userId, email }, config_1.config.jwt.refreshSecret, {
        expiresIn: config_1.config.jwt.refreshExpiresIn,
    });
    return { accessToken, refreshToken };
};
exports.AuthController = {
    signup: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { email, phone, password, name } = req.body;
        const existingUser = await db_1.prisma.user.findFirst({
            where: { OR: [{ email }, { phone }] },
        });
        if (existingUser) {
            throw new error_1.ConflictError("Email or phone already registered");
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 12);
        const user = await db_1.prisma.user.create({
            data: {
                email,
                phone,
                password: hashedPassword,
                name,
            },
            select: {
                id: true,
                email: true,
                phone: true,
                name: true,
                createdAt: true,
            },
        });
        const tokens = generateTokens(user.id, user.email);
        await audit_service_1.AuditLogService.log({
            userId: user.id,
            action: "USER_SIGNUP",
            resource: "user",
            resourceId: user.id,
            ipAddress: req.ip,
            userAgent: req.headers["user-agent"],
        });
        (0, response_1.sendResponse)(res, 201, "Account created successfully", {
            user,
            ...tokens,
        });
    }),
    login: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { email, password } = req.body;
        const user = await db_1.prisma.user.findUnique({
            where: { email },
            include: { adminUser: { include: { role: true } } },
        });
        if (!user || !user.isActive) {
            throw new error_1.UnauthorizedError("Invalid credentials");
        }
        const isValidPassword = await bcryptjs_1.default.compare(password, user.password);
        if (!isValidPassword) {
            throw new error_1.UnauthorizedError("Invalid credentials");
        }
        await db_1.prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });
        const tokens = generateTokens(user.id, user.email);
        await audit_service_1.AuditLogService.log({
            userId: user.id,
            action: "USER_LOGIN",
            resource: "user",
            resourceId: user.id,
            ipAddress: req.ip,
            userAgent: req.headers["user-agent"],
        });
        const userResponse = {
            id: user.id,
            email: user.email,
            phone: user.phone,
            name: user.name,
            avatar: user.avatar,
            isVerified: user.isVerified,
            role: user.adminUser?.role?.name || "customer",
        };
        (0, response_1.sendResponse)(res, 200, "Login successful", {
            user: userResponse,
            ...tokens,
        });
    }),
    refreshToken: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            throw new error_1.UnauthorizedError("Refresh token required");
        }
        const decoded = jsonwebtoken_1.default.verify(refreshToken, config_1.config.jwt.refreshSecret);
        const user = await db_1.prisma.user.findFirst({
            where: { id: decoded.userId, isActive: true },
        });
        if (!user) {
            throw new error_1.UnauthorizedError("Invalid refresh token");
        }
        const tokens = generateTokens(user.id, user.email);
        (0, response_1.sendResponse)(res, 200, "Token refreshed", tokens);
    }),
    logout: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        await audit_service_1.AuditLogService.log({
            userId: req.user.userId,
            action: "USER_LOGOUT",
            resource: "user",
            resourceId: req.user.userId,
            ipAddress: req.ip,
            userAgent: req.headers["user-agent"],
        });
        (0, response_1.sendResponse)(res, 200, "Logged out successfully");
    }),
    getMe: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const user = await db_1.prisma.user.findUnique({
            where: { id: req.user.userId },
            include: {
                addresses: { where: { isActive: true } },
                adminUser: { include: { role: true } },
            },
        });
        if (!user) {
            throw new error_1.UnauthorizedError("User not found");
        }
        const { password, ...userWithoutPassword } = user;
        (0, response_1.sendResponse)(res, 200, "User profile retrieved", userWithoutPassword);
    }),
    updateProfile: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { name, phone, avatar } = req.body;
        const user = await db_1.prisma.user.update({
            where: { id: req.user.userId },
            data: { name, phone, avatar },
            select: {
                id: true,
                email: true,
                phone: true,
                name: true,
                avatar: true,
                updatedAt: true,
            },
        });
        (0, response_1.sendResponse)(res, 200, "Profile updated successfully", user);
    }),
    changePassword: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { currentPassword, newPassword } = req.body;
        const user = await db_1.prisma.user.findUnique({
            where: { id: req.user.userId },
        });
        if (!user) {
            throw new error_1.UnauthorizedError("User not found");
        }
        const isValid = await bcryptjs_1.default.compare(currentPassword, user.password);
        if (!isValid) {
            throw new error_1.BadRequestError("Current password is incorrect");
        }
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, 12);
        await db_1.prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword },
        });
        await audit_service_1.AuditLogService.log({
            userId: user.id,
            action: "PASSWORD_CHANGE",
            resource: "user",
            resourceId: user.id,
            ipAddress: req.ip,
        });
        (0, response_1.sendResponse)(res, 200, "Password changed successfully");
    }),
};
//# sourceMappingURL=auth.controller.js.map