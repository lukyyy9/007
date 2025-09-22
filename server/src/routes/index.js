// Routes index file - will be populated in task 4.1
const express = require('express');
const router = express.Router();

// Import route modules here when they are created
// const authRoutes = require('./auth');
// const gameRoutes = require('./game');
// const tournamentRoutes = require('./tournament');

// Use route modules here when they are created
// router.use('/auth', authRoutes);
// router.use('/game', gameRoutes);
// router.use('/tournament', tournamentRoutes);

// Basic API info endpoint
router.get('/', (req, res) => {
  res.json({
    message: 'Tactical Card Game API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api'
    }
  });
});

module.exports = router;