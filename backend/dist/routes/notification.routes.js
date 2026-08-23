"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notification_controller_1 = require("../controllers/notification.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get("/", notification_controller_1.NotificationController.getNotifications);
router.patch("/read-all", notification_controller_1.NotificationController.markAllAsRead);
router.patch("/:id/read", notification_controller_1.NotificationController.markAsRead);
exports.default = router;
//# sourceMappingURL=notification.routes.js.map