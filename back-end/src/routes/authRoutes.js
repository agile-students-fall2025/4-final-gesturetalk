import { Router } from "express";
import {
  signUp,
  signIn,
  googleSignIn,
  updatePassword,
} from "../controllers/authController.js";
import {
  signUpValidation,
  signInValidation,
  googleSignInValidation,
  updatePasswordValidation,
} from "../middleware/validators.js";

const router = Router();
router.post("/signup", signUpValidation, signUp);
router.post("/signin", signInValidation, signIn);
router.post("/google", googleSignInValidation, googleSignIn);
router.post("/update-password", updatePasswordValidation, updatePassword);

export default router;
