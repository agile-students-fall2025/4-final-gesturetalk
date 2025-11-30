import { Router } from "express";
import {
  createMeetingRoom,
  joinMeetingRoom,
} from "../controllers/meetingController.js";
import {
  createMeetingValidation,
  joinMeetingValidation,
} from "../middleware/validators.js";

const router = Router();
router.post("/create", createMeetingValidation, createMeetingRoom);
router.get("/join/:meetingCode", joinMeetingValidation, joinMeetingRoom);

export default router;
