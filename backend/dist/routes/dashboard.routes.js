"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dashboard_controller_1 = require("../controllers/dashboard.controller");
const auth_1 = require("../middleware/auth");
const roles_1 = require("../config/roles");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate, (0, auth_1.authorize)(...roles_1.ADMIN_ROLES));
router.get("/stats", dashboard_controller_1.DashboardController.getStats);
router.get("/sales-report", dashboard_controller_1.DashboardController.getSalesReport);
exports.default = router;
//# sourceMappingURL=dashboard.routes.js.map