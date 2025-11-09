// routes for meeting/room data

import { Router } from "express";
import { getMeetingInfo, endMeeting } from "../controllers/meetingController.js";

const router = Router();

router.get("/:meetingId", getMeetingInfo);
router.post("/end-meeting/:meetingId", endMeeting);

export default router;