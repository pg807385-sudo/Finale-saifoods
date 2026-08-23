"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_1 = require("../controllers/admin.controller");
const auth_1 = require("../middleware/auth");
const upload_1 = require("../middleware/upload");
const roles_1 = require("../config/roles");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate, (0, auth_1.authorize)(...roles_1.ADMIN_ROLES));
// Categories
router.post("/categories", admin_controller_1.AdminController.createCategory);
router.patch("/categories/:id", admin_controller_1.AdminController.updateCategory);
router.delete("/categories/:id", admin_controller_1.AdminController.deleteCategory);
// Food items
router.post("/food-items", upload_1.upload.single("image"), admin_controller_1.AdminController.createFoodItem);
router.patch("/food-items/:id", upload_1.upload.single("image"), admin_controller_1.AdminController.updateFoodItem);
router.delete("/food-items/:id", admin_controller_1.AdminController.deleteFoodItem);
// Customizations
router.post("/customizations", admin_controller_1.AdminController.createCustomization);
router.patch("/customizations/:id", admin_controller_1.AdminController.updateCustomization);
// Coupons
router.get("/coupons", admin_controller_1.AdminController.getCoupons);
router.post("/coupons", admin_controller_1.AdminController.createCoupon);
router.patch("/coupons/:id", admin_controller_1.AdminController.updateCoupon);
router.delete("/coupons/:id", admin_controller_1.AdminController.deleteCoupon);
// Alerts
router.get("/alerts", admin_controller_1.AdminController.getAlerts);
router.post("/alerts", admin_controller_1.AdminController.createAlert);
router.patch("/alerts/:id", admin_controller_1.AdminController.updateAlert);
router.delete("/alerts/:id", admin_controller_1.AdminController.deleteAlert);
// Customers
router.get("/customers", admin_controller_1.AdminController.getCustomers);
router.get("/customers/:id", admin_controller_1.AdminController.getCustomerById);
router.patch("/customers/:id/toggle", admin_controller_1.AdminController.toggleCustomerStatus);
// Audit logs
router.get("/audit-logs", admin_controller_1.AdminController.getAuditLogs);
exports.default = router;
//# sourceMappingURL=admin.routes.js.map