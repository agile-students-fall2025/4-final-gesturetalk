
import { Router } from "express";
import { getTranslationLog, addTranslationLog } from "../controllers/translationLogController.js";

const router = Router();


router.get('/:meetingId', getTranslationLog);
router.post('/:meetingId', addTranslationLog);


export default router;