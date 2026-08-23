import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../config/db";
import { config } from "../config";
import { asyncHandler } from "../utils/asyncHandler";
import { sendResponse } from "../utils/response";
import { BadRequestError, UnauthorizedError, ConflictError } from "../utils/error";
import { AuditLogService } from "../services/audit.service";

const generateTokens = (userId: string, email: string) => {
  const accessToken = jwt.sign({ userId, email }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
  const refreshToken = jwt.sign({ userId, email }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  });
  return { accessToken, refreshToken };
};

export const AuthController = {
  signup: asyncHandler(async (req: Request, res: Response) => {
    const { email, phone, password, name } = req.body;

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { phone }] },
    });

    if (existingUser) {
      throw new ConflictError("Email or phone already registered");
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
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

    await AuditLogService.log({
      userId: user.id,
      action: "USER_SIGNUP",
      resource: "user",
      resourceId: user.id,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    sendResponse(res, 201, "Account created successfully", {
      user,
      ...tokens,
    });
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { adminUser: { include: { role: true } } },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedError("Invalid credentials");
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new UnauthorizedError("Invalid credentials");
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = generateTokens(user.id, user.email);

    await AuditLogService.log({
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

    sendResponse(res, 200, "Login successful", {
      user: userResponse,
      ...tokens,
    });
  }),

  refreshToken: asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new UnauthorizedError("Refresh token required");
    }

    const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as {
      userId: string;
      email: string;
    };

    const user = await prisma.user.findFirst({
      where: { id: decoded.userId, isActive: true },
    });

    if (!user) {
      throw new UnauthorizedError("Invalid refresh token");
    }

    const tokens = generateTokens(user.id, user.email);
    sendResponse(res, 200, "Token refreshed", tokens);
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    await AuditLogService.log({
      userId: req.user!.userId,
      action: "USER_LOGOUT",
      resource: "user",
      resourceId: req.user!.userId,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    sendResponse(res, 200, "Logged out successfully");
  }),

  getMe: asyncHandler(async (req: Request, res: Response) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: {
        addresses: { where: { isActive: true } },
        adminUser: { include: { role: true } },
      },
    });

    if (!user) {
      throw new UnauthorizedError("User not found");
    }

    const { password, ...userWithoutPassword } = user;
    sendResponse(res, 200, "User profile retrieved", userWithoutPassword);
  }),

  updateProfile: asyncHandler(async (req: Request, res: Response) => {
    const { name, phone, avatar } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user!.userId },
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

    sendResponse(res, 200, "Profile updated successfully", user);
  }),

  changePassword: asyncHandler(async (req: Request, res: Response) => {
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
    });

    if (!user) {
      throw new UnauthorizedError("User not found");
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      throw new BadRequestError("Current password is incorrect");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    await AuditLogService.log({
      userId: user.id,
      action: "PASSWORD_CHANGE",
      resource: "user",
      resourceId: user.id,
      ipAddress: req.ip,
    });

    sendResponse(res, 200, "Password changed successfully");
  }),
};
