"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const menu_controller_1 = require("../controllers/menu.controller");
const router = (0, express_1.Router)();
router.get("/categories", menu_controller_1.MenuController.getCategories);
router.get("/featured", menu_controller_1.MenuController.getFeaturedItems);
router.get("/popular", menu_controller_1.MenuController.getPopularItems);
router.get("/items", menu_controller_1.MenuController.getFoodItems);
router.get("/items/:id", menu_controller_1.MenuController.getFoodItemById);
exports.default = router;
//# sourceMappingURL=menu.routes.js.map