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

/**
 * @swagger
 * /api:
 *   get:
 *     summary: Get API information
 *     description: Returns basic information about the API and available endpoints
 *     tags: [API Info]
 *     security: []
 *     responses:
 *       200:
 *         description: API information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Tactical Card Game API
 *                 version:
 *                   type: string
 *                   example: 1.0.0
 *                 endpoints:
 *                   type: object
 *                   properties:
 *                     health:
 *                       type: string
 *                       example: /health
 *                     auth:
 *                       type: string
 *                       example: /api/auth
 *                     game:
 *                       type: string
 *                       example: /api/game
 *                     tournament:
 *                       type: string
 *                       example: /api/tournament
 */
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