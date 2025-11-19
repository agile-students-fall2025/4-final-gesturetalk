import { Router } from "express";
import { getCallHistory } from "../controllers/callHistoryController.js";
import auth from '../middleware/auth.js';

const router = Router();

router.post("/", getCallHistory);

export default router;
