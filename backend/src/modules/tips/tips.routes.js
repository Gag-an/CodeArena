import express from 'express';
import { getDailyTip } from './tips.controller.js';

const router = express.Router();

router.get('/', getDailyTip);

export default router;
