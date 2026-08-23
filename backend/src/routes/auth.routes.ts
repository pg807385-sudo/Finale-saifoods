import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth";
import { authLimiter } from "../middleware/rateLimiter";

const router = Router();

router.post("/register", authLimiter, AuthController.signup);
router.post("/login", authLimiter, AuthController.login);
router.post("/refresh-token", AuthController.refreshToken);
router.post("/logout", authenticate, AuthController.logout);
router.get("/me", authenticate, AuthController.getMe);
router.patch("/profile", authenticate, AuthController.updateProfile);
router.post("/change-password", authenticate, AuthController.changePassword);

export default router;
