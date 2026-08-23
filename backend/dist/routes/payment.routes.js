"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const payment_controller_1 = require("../controllers/payment.controller");
const auth_1 = require("../middleware/auth");
const roles_1 = require("../config/roles");
const router = (0, express_1.Router)();
// Public webhook — Razorpay calls this directly, no user session.
router.post("/webhook", payment_controller_1.PaymentController.handleWebhook);
router.use(auth_1.authenticate);
router.post("/create-order", payment_controller_1.PaymentController.createPaymentOrder);
router.post("/verify", payment_controller_1.PaymentController.verifyPayment);
router.get("/status/:orderId", payment_controller_1.PaymentController.getPaymentStatus);
router.post("/refund/:orderId", (0, auth_1.authorize)(...roles_1.ADMIN_ROLES), payment_controller_1.PaymentController.processRefund);
exports.default = router;
//# sourceMappingURL=payment.routes.js.map