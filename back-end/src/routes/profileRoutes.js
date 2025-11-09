// routes for user info

import { Router } from "express";
import { getProfile, updateProfile } from "../controllers/profileController.js";
import upload from "../middleware/upload.js"; 

const router = Router();

router.get("/", getProfile);
router.post("/", upload.single("image"),  updateProfile); // to be updated

export default router;