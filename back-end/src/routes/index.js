// root router
import { Router } from "express";
import homeRoutes from './homeRoutes.js';
import callHistoryRoutes from './callHistoryRoutes.js';
import authRoutes from './authRoutes.js';
import meetingRoutes from './meetingRoutes.js';
import profileRoutes from './profileRoutes.js';
import translationLogRoutes from './translationLogRoutes.js';

const router = Router();

router.use("/auth", authRoutes);
router.use("/home", homeRoutes);
router.use("/call-history", callHistoryRoutes);
router.use("/profile", profileRoutes);
router.use("/meeting", meetingRoutes);
router.use("/translation-log", translationLogRoutes);

export default router;
