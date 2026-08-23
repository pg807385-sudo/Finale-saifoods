import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { prisma } from "../config/db";
import { UnauthorizedError, ForbiddenError } from "../utils/error";
import { JwtPayload } from "../types";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload & { adminUserId?: string; role?: string };
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "") || req.cookies?.token;

    if (!token) {
      throw new UnauthorizedError("Authentication required");
    }

    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;

    const user = await prisma.user.findFirst({
      where: { id: decoded.userId, isActive: true },
      include: { adminUser: { include: { role: true } } },
    });

    if (!user) {
      throw new UnauthorizedError("User not found or inactive");
    }

    req.user = {
      ...decoded,
      adminUserId: user.adminUser?.id,
      role: user.adminUser?.role?.name,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new UnauthorizedError("Invalid token"));
    } else {
      next(error);
    }
  }
};

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user?.role || !roles.includes(req.user.role)) {
      throw new ForbiddenError("Insufficient permissions");
    }
    next();
  };
};

export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (token) {
      const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
      const user = await prisma.user.findFirst({
        where: { id: decoded.userId, isActive: true },
        include: { adminUser: { include: { role: true } } },
      });
      if (user) {
        req.user = {
          ...decoded,
          adminUserId: user.adminUser?.id,
          role: user.adminUser?.role?.name,
        };
      }
    }
    next();
  } catch {
    next();
  }
};
