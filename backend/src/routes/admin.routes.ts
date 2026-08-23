import { Router } from "express";
import { AdminController } from "../controllers/admin.controller";
import { authenticate, authorize } from "../middleware/auth";
import { upload } from "../middleware/upload";
import { ADMIN_ROLES } from "../config/roles";

const router = Router();

router.use(authenticate, authorize(...ADMIN_ROLES));

// Categories
router.post("/categories", AdminController.createCategory);
router.patch("/categories/:id", AdminController.updateCategory);
router.delete("/categories/:id", AdminController.deleteCategory);

// Food items
router.post("/food-items", upload.single("image"), AdminController.createFoodItem);
router.patch("/food-items/:id", upload.single("image"), AdminController.updateFoodItem);
router.delete("/food-items/:id", AdminController.deleteFoodItem);

// Customizations
router.post("/customizations", AdminController.createCustomization);
router.patch("/customizations/:id", AdminController.updateCustomization);

// Coupons
router.get("/coupons", AdminController.getCoupons);
router.post("/coupons", AdminController.createCoupon);
router.patch("/coupons/:id", AdminController.updateCoupon);
router.delete("/coupons/:id", AdminController.deleteCoupon);

// Alerts
router.get("/alerts", AdminController.getAlerts);
router.post("/alerts", AdminController.createAlert);
router.patch("/alerts/:id", AdminController.updateAlert);
router.delete("/alerts/:id", AdminController.deleteAlert);

// Customers
router.get("/customers", AdminController.getCustomers);
router.get("/customers/:id", AdminController.getCustomerById);
router.patch("/customers/:id/toggle", AdminController.toggleCustomerStatus);

// Audit logs
router.get("/audit-logs", AdminController.getAuditLogs);

export default router;
