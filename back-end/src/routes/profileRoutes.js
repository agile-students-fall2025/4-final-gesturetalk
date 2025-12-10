import { Router } from "express";
import multer from "multer";
import upload from "../middleware/upload.js";
import { uploadProfilePicture } from "../controllers/profileController.js";
import { uploadProfilePictureValidation } from "../middleware/validators.js";

const router = Router();

// Wrapper to handle multer errors with user-friendly messages
const uploadWithErrorHandling = (req, res, next) => {
  upload.single("picture")(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ 
          error: "File too large. Maximum size is 5MB." 
        });
      }
      return res.status(400).json({ error: err.message });
    } else if (err) {
      // Custom error from fileFilter (e.g., "Only image files are allowed")
      return res.status(400).json({ error: err.message });
    }
    next();
  });
};

router.post(
  "/upload",
  uploadWithErrorHandling,
  uploadProfilePictureValidation,
  uploadProfilePicture,
);

export default router;
