// Routes index file
const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth');
const gameRoutes = require('./game');
const tournamentRoutes = require('./tournament');

// Use route modules
router.use('/auth', authRoutes);
router.use('/game', gameRoutes);
router.use('/tournament', tournamentRoutes);

// Basic API info endpoint
router.get('/', (req, res) => {
  res.json({
    message: 'Tactical Card Game API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      game: '/api/game',
      tournament: '/api/tournament'
    }
  });
});

module.exports = router;