import { Router } from "express";
import authRoutes from "./auth.routes";
import menuRoutes from "./menu.routes";
import cartRoutes from "./cart.routes";
import orderRoutes from "./order.routes";
import paymentRoutes from "./payment.routes";
import userRoutes from "./user.routes";
import notificationRoutes from "./notification.routes";
import uploadRoutes from "./upload.routes";
import adminRoutes from "./admin.routes";
import dashboardRoutes from "./dashboard.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/menu", menuRoutes);
router.use("/cart", cartRoutes);
router.use("/orders", orderRoutes);
router.use("/payments", paymentRoutes);
router.use("/users", userRoutes);
router.use("/notifications", notificationRoutes);
router.use("/upload", uploadRoutes);
router.use("/admin", adminRoutes);
router.use("/dashboard", dashboardRoutes);

export default router;
