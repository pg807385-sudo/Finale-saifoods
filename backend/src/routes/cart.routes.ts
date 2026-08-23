import { Router } from "express";
import { CartController } from "../controllers/cart.controller";
import { authenticate } from "../middleware/auth";

const router = Router();

router.use(authenticate);

router.get("/", CartController.getCart);
router.post("/", CartController.addToCart);
router.patch("/:id", CartController.updateCartItem);
router.delete("/:id", CartController.removeFromCart);
router.delete("/", CartController.clearCart);

export default router;
