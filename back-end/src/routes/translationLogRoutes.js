import { Router } from "express";
import { getTranslationLog } from "../controllers/translationLogController.js";
import { getTranslationLogValidation } from "../middleware/validators.js";

const router = Router();

// change ":id" maybe
router.get("/:meetingId", getTranslationLogValidation, getTranslationLog);

export default router;
