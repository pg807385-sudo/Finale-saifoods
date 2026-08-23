import { Router } from "express";
import { UploadController } from "../controllers/upload.controller";
import { authenticate, authorize } from "../middleware/auth";
import { upload } from "../middleware/upload";
import { ADMIN_ROLES } from "../config/roles";

const router = Router();

router.post(
  "/",
  authenticate,
  authorize(...ADMIN_ROLES),
  upload.single("image"),
  UploadController.uploadImage
);

export default router;
