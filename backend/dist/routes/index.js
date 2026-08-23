"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("./auth.routes"));
const menu_routes_1 = __importDefault(require("./menu.routes"));
const cart_routes_1 = __importDefault(require("./cart.routes"));
const order_routes_1 = __importDefault(require("./order.routes"));
const payment_routes_1 = __importDefault(require("./payment.routes"));
const user_routes_1 = __importDefault(require("./user.routes"));
const notification_routes_1 = __importDefault(require("./notification.routes"));
const upload_routes_1 = __importDefault(require("./upload.routes"));
const admin_routes_1 = __importDefault(require("./admin.routes"));
const dashboard_routes_1 = __importDefault(require("./dashboard.routes"));
const router = (0, express_1.Router)();
router.use("/auth", auth_routes_1.default);
router.use("/menu", menu_routes_1.default);
router.use("/cart", cart_routes_1.default);
router.use("/orders", order_routes_1.default);
router.use("/payments", payment_routes_1.default);
router.use("/users", user_routes_1.default);
router.use("/notifications", notification_routes_1.default);
router.use("/upload", upload_routes_1.default);
router.use("/admin", admin_routes_1.default);
router.use("/dashboard", dashboard_routes_1.default);
exports.default = router;
//# sourceMappingURL=index.js.map