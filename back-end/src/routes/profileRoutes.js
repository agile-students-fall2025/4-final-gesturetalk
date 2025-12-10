import { Router } from "express";
import upload from "../middleware/upload.js";
import { uploadProfilePicture, updateProfile } from "../controllers/profileController.js";
import { uploadProfilePictureValidation, updateProfileValidation } from "../middleware/validators.js";

const router = Router();

router.post(
  "/upload",
  upload.single("picture"),
  uploadProfilePictureValidation,
  uploadProfilePicture,
);

router.post(
  "/update",
  updateProfileValidation,
  updateProfile,
);

export default router;
