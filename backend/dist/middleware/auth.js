"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.authorize = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
const db_1 = require("../config/db");
const error_1 = require("../utils/error");
const authenticate = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace("Bearer ", "") || req.cookies?.token;
        if (!token) {
            throw new error_1.UnauthorizedError("Authentication required");
        }
        const decoded = jsonwebtoken_1.default.verify(token, config_1.config.jwt.secret);
        const user = await db_1.prisma.user.findFirst({
            where: { id: decoded.userId, isActive: true },
            include: { adminUser: { include: { role: true } } },
        });
        if (!user) {
            throw new error_1.UnauthorizedError("User not found or inactive");
        }
        req.user = {
            ...decoded,
            adminUserId: user.adminUser?.id,
            role: user.adminUser?.role?.name,
        };
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            next(new error_1.UnauthorizedError("Invalid token"));
        }
        else {
            next(error);
        }
    }
};
exports.authenticate = authenticate;
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user?.role || !roles.includes(req.user.role)) {
            throw new error_1.ForbiddenError("Insufficient permissions");
        }
        next();
    };
};
exports.authorize = authorize;
const optionalAuth = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace("Bearer ", "");
        if (token) {
            const decoded = jsonwebtoken_1.default.verify(token, config_1.config.jwt.secret);
            const user = await db_1.prisma.user.findFirst({
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
    }
    catch {
        next();
    }
};
exports.optionalAuth = optionalAuth;
//# sourceMappingURL=auth.js.map