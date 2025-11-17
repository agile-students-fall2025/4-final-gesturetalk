import { Router } from 'express';
import { signUp, signIn, googleSignIn } from '../controllers/authController.js';

const router = Router();
router.post('/signup', signUp);
router.post('/signin', signIn);
router.post("/google", googleSignIn);

export default router;
