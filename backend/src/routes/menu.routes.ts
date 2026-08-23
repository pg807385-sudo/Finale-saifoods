import { Router } from "express";
import { MenuController } from "../controllers/menu.controller";

const router = Router();

router.get("/categories", MenuController.getCategories);
router.get("/featured", MenuController.getFeaturedItems);
router.get("/popular", MenuController.getPopularItems);
router.get("/items", MenuController.getFoodItems);
router.get("/items/:id", MenuController.getFoodItemById);

export default router;
