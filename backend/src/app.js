import express from 'express';
import cors from 'cors';

const app = express();

// Global Middlewares
app.use(cors());
app.use(express.json()); // Parses incoming JSON requests

// Basic Health Check Route
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'CodeArena API is running! 🚀' });
});

import { authRoutes } from './modules/auth/index.js';
import { usersRoutes } from './modules/users/index.js';
import { tipsRoutes } from './modules/tips/index.js';

// Mount our module routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/tip', tipsRoutes);

export default app;
