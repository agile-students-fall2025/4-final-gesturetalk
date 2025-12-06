import { Router } from "express";
import upload from "../middleware/upload.js";
import { uploadProfilePicture } from "../controllers/profileController.js";
import { uploadProfilePictureValidation } from "../middleware/validators.js";

const router = Router();

router.post(
  "/upload",
  upload.single("picture"),
  uploadProfilePictureValidation,
  uploadProfilePicture,
);

export default router;
