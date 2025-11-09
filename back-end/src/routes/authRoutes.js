import { Router } from "express";
import { signIn, signUp } from "../controllers/authController.js";

const router = Router();

// Sign In
router.post("/signin", signIn);

// Sign Up
router.post("/signup", signUp);

export default router;