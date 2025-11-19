import { Router } from "express";
import { getTranslationLog } from "../controllers/translationLogController.js";
import auth from '../middleware/auth.js';

const router = Router();
// change ":id" maybe
router.get("/:id", getTranslationLog);

export default router;
