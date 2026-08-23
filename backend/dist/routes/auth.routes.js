"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_1 = require("../middleware/auth");
const rateLimiter_1 = require("../middleware/rateLimiter");
const router = (0, express_1.Router)();
router.post("/register", rateLimiter_1.authLimiter, auth_controller_1.AuthController.signup);
router.post("/login", rateLimiter_1.authLimiter, auth_controller_1.AuthController.login);
router.post("/refresh-token", auth_controller_1.AuthController.refreshToken);
router.post("/logout", auth_1.authenticate, auth_controller_1.AuthController.logout);
router.get("/me", auth_1.authenticate, auth_controller_1.AuthController.getMe);
router.patch("/profile", auth_1.authenticate, auth_controller_1.AuthController.updateProfile);
router.post("/change-password", auth_1.authenticate, auth_controller_1.AuthController.changePassword);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map