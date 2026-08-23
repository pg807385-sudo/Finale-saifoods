"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const upload_controller_1 = require("../controllers/upload.controller");
const auth_1 = require("../middleware/auth");
const upload_1 = require("../middleware/upload");
const roles_1 = require("../config/roles");
const router = (0, express_1.Router)();
router.post("/", auth_1.authenticate, (0, auth_1.authorize)(...roles_1.ADMIN_ROLES), upload_1.upload.single("image"), upload_controller_1.UploadController.uploadImage);
exports.default = router;
//# sourceMappingURL=upload.routes.js.map