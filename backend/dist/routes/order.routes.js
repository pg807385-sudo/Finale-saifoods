"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const order_controller_1 = require("../controllers/order.controller");
const auth_1 = require("../middleware/auth");
const roles_1 = require("../config/roles");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
// Admin routes — must be declared before the "/:id" customer route
// so "admin" isn't captured as an order id.
router.get("/admin/all", (0, auth_1.authorize)(...roles_1.ADMIN_ROLES), order_controller_1.OrderController.getAllOrders);
router.patch("/admin/:id/status", (0, auth_1.authorize)(...roles_1.ADMIN_ROLES), order_controller_1.OrderController.updateOrderStatus);
// Customer routes
router.post("/", order_controller_1.OrderController.createOrder);
router.get("/", order_controller_1.OrderController.getOrders);
router.get("/:id", order_controller_1.OrderController.getOrderById);
router.post("/:id/cancel", order_controller_1.OrderController.cancelOrder);
exports.default = router;
//# sourceMappingURL=order.routes.js.map