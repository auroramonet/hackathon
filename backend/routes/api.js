import express from 'express';
import userRoutes from './users.js';
import mapRoutes from './map.js';

const router = express.Router();

// API routes
router.use('/users', userRoutes);
router.use('/map', mapRoutes);

// API health check
router.get('/', (req, res) => {
  res.json({
    message: 'API is running!',
    version: '1.0.0',
    endpoints: {
      users: '/api/users',
      map: '/api/map',
      health: '/health'
    }
  });
});

export default router;
