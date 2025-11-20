import { Router } from "express";
import { getTranslationLog } from "../controllers/translationLogController.js";

const router = Router();

// change ":id" maybe
router.get("/:meetingId", getTranslationLog);

export default router;
