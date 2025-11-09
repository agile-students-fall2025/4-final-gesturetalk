import { Router } from "express";
import { getCallHistory } from "../controllers/callHistoryController.js";

const router = Router();

router.get("/", getCallHistory);

export default router;
