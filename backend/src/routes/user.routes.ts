import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import { authenticate } from "../middleware/auth";

const router = Router();

router.use(authenticate);

router.get("/addresses", UserController.getAddresses);
router.post("/addresses", UserController.createAddress);
router.patch("/addresses/:id", UserController.updateAddress);
router.delete("/addresses/:id", UserController.deleteAddress);
router.patch("/addresses/:id/default", UserController.setDefaultAddress);

export default router;
