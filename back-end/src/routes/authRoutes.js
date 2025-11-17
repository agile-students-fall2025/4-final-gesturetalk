import { Router } from 'express';
import { signUp, signIn, googleSignIn, updatePassword } from '../controllers/authController.js';

const router = Router();
router.post('/signup', signUp);
router.post('/signin', signIn);
router.post("/google", googleSignIn);
router.post('/update-password', updatePassword);

export default router;
