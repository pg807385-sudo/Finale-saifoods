import { Router } from "express";
import { DashboardController } from "../controllers/dashboard.controller";
import { authenticate, authorize } from "../middleware/auth";
import { ADMIN_ROLES } from "../config/roles";

const router = Router();

router.use(authenticate, authorize(...ADMIN_ROLES));

router.get("/stats", DashboardController.getStats);
router.get("/sales-report", DashboardController.getSalesReport);

export default router;
