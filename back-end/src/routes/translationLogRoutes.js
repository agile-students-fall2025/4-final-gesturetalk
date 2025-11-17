import { Router } from 'express';
import { getLog } from '../controllers/translationLogController.js';

const router = Router();
// change ":id" maybe
router.get('/:id', getLog);

export default router;
