import { Router } from "express";
import { OrderController } from "../controllers/order.controller";
import { authenticate, authorize } from "../middleware/auth";
import { ADMIN_ROLES } from "../config/roles";

const router = Router();

router.use(authenticate);

// Admin routes — must be declared before the "/:id" customer route
// so "admin" isn't captured as an order id.
router.get("/admin/all", authorize(...ADMIN_ROLES), OrderController.getAllOrders);
router.patch("/admin/:id/status", authorize(...ADMIN_ROLES), OrderController.updateOrderStatus);

// Customer routes
router.post("/", OrderController.createOrder);
router.get("/", OrderController.getOrders);
router.get("/:id", OrderController.getOrderById);
router.post("/:id/cancel", OrderController.cancelOrder);

export default router;
