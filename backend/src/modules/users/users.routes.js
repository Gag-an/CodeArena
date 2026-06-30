import express from 'express';
import * as usersController from './users.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';

const router = express.Router();

// The authMiddleware protects this route!
router.get('/profile', authMiddleware, usersController.getProfile);
router.put('/profile', authMiddleware, usersController.updateProfile);
router.get('/heatmap', authMiddleware, usersController.getHeatmap);
router.post('/solve', authMiddleware, usersController.solveQuestion);
router.get('/search', authMiddleware, usersController.searchUser);
router.get('/leaderboard', authMiddleware, usersController.getLeaderboard);

export default router;
