"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get("/addresses", user_controller_1.UserController.getAddresses);
router.post("/addresses", user_controller_1.UserController.createAddress);
router.patch("/addresses/:id", user_controller_1.UserController.updateAddress);
router.delete("/addresses/:id", user_controller_1.UserController.deleteAddress);
router.patch("/addresses/:id/default", user_controller_1.UserController.setDefaultAddress);
exports.default = router;
//# sourceMappingURL=user.routes.js.map