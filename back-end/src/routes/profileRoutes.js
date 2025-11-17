import { Router } from 'express';
import upload from '../middleware/upload.js';
import { uploadProfilePicture } from '../controllers/profileController.js';

const router = Router();

router.post('/upload', upload.single('picture'), uploadProfilePicture);

export default router;
