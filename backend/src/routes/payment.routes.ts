import { Router } from "express";
import { PaymentController } from "../controllers/payment.controller";
import { authenticate, authorize } from "../middleware/auth";
import { ADMIN_ROLES } from "../config/roles";

const router = Router();

// Public webhook — Razorpay calls this directly, no user session.
router.post("/webhook", PaymentController.handleWebhook);

router.use(authenticate);

router.post("/create-order", PaymentController.createPaymentOrder);
router.post("/verify", PaymentController.verifyPayment);
router.get("/status/:orderId", PaymentController.getPaymentStatus);
router.post("/refund/:orderId", authorize(...ADMIN_ROLES), PaymentController.processRefund);

export default router;
