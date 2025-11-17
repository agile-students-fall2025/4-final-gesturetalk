import { Router } from 'express';
import { getCallHistory } from '../controllers/callHistoryController.js';

const router = Router();

router.post('/', getCallHistory);

export default router;
