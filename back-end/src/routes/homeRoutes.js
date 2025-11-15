import { Router } from "express";
import { createMeeting, joinMeeting } from "../controllers/homeController.js";

const router = Router();

router.post("/create-meeting", createMeeting)
router.post("/join-meeting", joinMeeting)

export default router;
