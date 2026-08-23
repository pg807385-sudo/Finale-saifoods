"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cart_controller_1 = require("../controllers/cart.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get("/", cart_controller_1.CartController.getCart);
router.post("/", cart_controller_1.CartController.addToCart);
router.patch("/:id", cart_controller_1.CartController.updateCartItem);
router.delete("/:id", cart_controller_1.CartController.removeFromCart);
router.delete("/", cart_controller_1.CartController.clearCart);
exports.default = router;
//# sourceMappingURL=cart.routes.js.map