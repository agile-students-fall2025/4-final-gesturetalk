import { Router } from "express";
import {
  createMeetingRoom,
  joinMeetingRoom,
} from "../controllers/meetingController.js";

const router = Router();
router.post("/create", createMeetingRoom);
router.get("/join/:meetingCode", joinMeetingRoom);

export default router;
