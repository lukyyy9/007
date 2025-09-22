const express = require('express');
const { Game, User, GameAction } = require('../models');
const { auth, validation } = require('../middleware');
const { GameSettingsService } = require('../services');
const router = express.Router();

const gameSettingsService = new GameSettingsService();

/**
 * @swagger
 * tags:
 *   name: Games
 *   description: Game management and gameplay
 */

/**
 * @swagger
 * /api/game/create:
 *   post:
 *     summary: Create a new game
 *     tags: [Games]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Game name
 *                 example: "My Awesome Game"
 *               gameConfig:
 *                 type: object
 *                 description: Game configuration settings
 *                 properties:
 *                   gameMode:
 *                     type: string
 *                     enum: [standard, blitz, endurance]
 *                     example: standard
 *                   maxHealth:
 *                     type: integer
 *                     example: 6
 *                   turnTimeLimit:
 *                     type: integer
 *                     example: 20
 *                   seriesLength:
 *                     type: integer
 *                     example: 1
 *     responses:
 *       201:
 *         description: Game created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Game created successfully
 *                 game:
 *                   $ref: '#/components/schemas/Game'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 */
// Create a new game
router.post('/create', auth.authenticateToken, validation.validateGameCreation, async (req, res) => {
  try {
    const { gameConfig = {}, name } = req.body;
    
    // Create and validate game configuration using the service
    const finalConfig = gameSettingsService.createGameConfiguration(
      gameConfig, 
      name || `${req.user.username}'s Game`
    );

    const game = await Game.create({
      player1Id: req.user.id,
      player2Id: null,
      status: 'waiting',
      phase: 'waiting',
      currentTurn: 0,
      gameConfig: finalConfig,
      player1Health: finalConfig.maxHealth,
      player2Health: finalConfig.maxHealth,
      player1Charges: 0,
      player2Charges: 0,
      player1StatusEffects: [],
      player2StatusEffects: [],
      turnTimer: finalConfig.turnTimeLimit,
      gameHistory: [],
      name: finalConfig.name,
      seriesScore: { player1: 0, player2: 0 },
      currentGameInSeries: 1
    });

    // Include player information
    const gameWithPlayers = await Game.findByPk(game.id, {
      include: [
        { model: User, as: 'player1', attributes: ['id', 'username'] },
        { model: User, as: 'player2', attributes: ['id', 'username'] }
      ]
    });

    res.status(201).json({
      message: 'Game created successfully',
      game: gameWithPlayers
    });
  } catch (error) {
    console.error('Game creation error:', error);
    res.status(500).json({
      error: 'Failed to create game',
      code: 'GAME_CREATION_ERROR'
    });
  }
});

/**
 * @swagger
 * /api/game/join/{gameId}:
 *   post:
 *     summary: Join an existing game
 *     tags: [Games]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: gameId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Game ID to join
 *     responses:
 *       200:
 *         description: Joined game successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Joined game successfully
 *                 game:
 *                   $ref: '#/components/schemas/Game'
 *       400:
 *         description: Cannot join game (full, own game, etc.)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Game not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Join an existing game
router.post('/join/:gameId', auth.authenticateToken, validation.validateGameJoin, async (req, res) => {
  try {
    const { gameId } = req.params;

    const game = await Game.findByPk(gameId, {
      include: [
        { model: User, as: 'player1', attributes: ['id', 'username'] },
        { model: User, as: 'player2', attributes: ['id', 'username'] }
      ]
    });

    if (!game) {
      return res.status(404).json({
        error: 'Game not found',
        code: 'GAME_NOT_FOUND'
      });
    }

    if (game.status !== 'waiting') {
      return res.status(400).json({
        error: 'Game is not available for joining',
        code: 'GAME_NOT_JOINABLE'
      });
    }

    if (game.player1Id === req.user.id) {
      return res.status(400).json({
        error: 'Cannot join your own game',
        code: 'CANNOT_JOIN_OWN_GAME'
      });
    }

    if (game.player2Id) {
      return res.status(400).json({
        error: 'Game is already full',
        code: 'GAME_FULL'
      });
    }

    // Join the game
    await game.update({
      player2Id: req.user.id,
      status: 'active',
      phase: 'selection'
    });

    // Reload with updated player information
    await game.reload({
      include: [
        { model: User, as: 'player1', attributes: ['id', 'username'] },
        { model: User, as: 'player2', attributes: ['id', 'username'] }
      ]
    });

    res.json({
      message: 'Joined game successfully',
      game
    });
  } catch (error) {
    console.error('Game join error:', error);
    res.status(500).json({
      error: 'Failed to join game',
      code: 'GAME_JOIN_ERROR'
    });
  }
});

/**
 * @swagger
 * /api/game/{gameId}:
 *   get:
 *     summary: Get game details
 *     tags: [Games]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: gameId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Game ID
 *     responses:
 *       200:
 *         description: Game details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 game:
 *                   $ref: '#/components/schemas/Game'
 *       403:
 *         description: Access denied (not a player in this game)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Game not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Get game status
router.get('/:gameId', auth.authenticateToken, validation.validateUUIDParam('gameId'), async (req, res) => {
  try {
    const { gameId } = req.params;

    const game = await Game.findByPk(gameId, {
      include: [
        { model: User, as: 'player1', attributes: ['id', 'username'] },
        { model: User, as: 'player2', attributes: ['id', 'username'] },
        { model: User, as: 'winner', attributes: ['id', 'username'] }
      ]
    });

    if (!game) {
      return res.status(404).json({
        error: 'Game not found',
        code: 'GAME_NOT_FOUND'
      });
    }

    // Check if user is part of this game
    if (game.player1Id !== req.user.id && game.player2Id !== req.user.id) {
      return res.status(403).json({
        error: 'Access denied',
        code: 'ACCESS_DENIED'
      });
    }

    res.json({
      game
    });
  } catch (error) {
    console.error('Get game error:', error);
    res.status(500).json({
      error: 'Failed to get game',
      code: 'GET_GAME_ERROR'
    });
  }
});

/**
 * @swagger
 * /api/game:
 *   get:
 *     summary: Get list of available games
 *     tags: [Games]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [waiting, active, completed]
 *           default: waiting
 *         description: Filter games by status
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           minimum: 1
 *           maximum: 100
 *         description: Number of games to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *           minimum: 0
 *         description: Number of games to skip
 *     responses:
 *       200:
 *         description: Games list retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 games:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Game'
 *                 total:
 *                   type: integer
 *                   description: Total number of games matching criteria
 *                 limit:
 *                   type: integer
 *                 offset:
 *                   type: integer
 */
// Get list of available games
router.get('/', auth.optionalAuth, async (req, res) => {
  try {
    const { status = 'waiting', limit = 20, offset = 0 } = req.query;

    const whereClause = { status };
    
    // If user is authenticated, exclude their own games from the list
    if (req.user) {
      whereClause.player1Id = { [require('sequelize').Op.ne]: req.user.id };
    }

    const games = await Game.findAndCountAll({
      where: whereClause,
      include: [
        { model: User, as: 'player1', attributes: ['id', 'username'] },
        { model: User, as: 'player2', attributes: ['id', 'username'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      games: games.rows,
      total: games.count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Get games list error:', error);
    res.status(500).json({
      error: 'Failed to get games list',
      code: 'GET_GAMES_ERROR'
    });
  }
});

/**
 * @swagger
 * /api/game/user/my-games:
 *   get:
 *     summary: Get current user's games
 *     tags: [Games]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [waiting, active, completed]
 *         description: Filter games by status
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           minimum: 1
 *           maximum: 100
 *         description: Number of games to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *           minimum: 0
 *         description: Number of games to skip
 *     responses:
 *       200:
 *         description: User games retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 games:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Game'
 *                 total:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 offset:
 *                   type: integer
 */
// Get user's games
router.get('/user/my-games', auth.authenticateToken, async (req, res) => {
  try {
    const { status, limit = 20, offset = 0 } = req.query;

    const whereClause = {
      [require('sequelize').Op.or]: [
        { player1Id: req.user.id },
        { player2Id: req.user.id }
      ]
    };

    if (status) {
      whereClause.status = status;
    }

    const games = await Game.findAndCountAll({
      where: whereClause,
      include: [
        { model: User, as: 'player1', attributes: ['id', 'username'] },
        { model: User, as: 'player2', attributes: ['id', 'username'] },
        { model: User, as: 'winner', attributes: ['id', 'username'] }
      ],
      order: [['updatedAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      games: games.rows,
      total: games.count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Get user games error:', error);
    res.status(500).json({
      error: 'Failed to get user games',
      code: 'GET_USER_GAMES_ERROR'
    });
  }
});

/**
 * @swagger
 * /api/game/config/options:
 *   get:
 *     summary: Get game configuration options
 *     tags: [Games]
 *     security: []
 *     responses:
 *       200:
 *         description: Configuration options retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 gameModes:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       value:
 *                         type: string
 *                       label:
 *                         type: string
 *                       description:
 *                         type: string
 *                 seriesOptions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       value:
 *                         type: integer
 *                       label:
 *                         type: string
 *                       description:
 *                         type: string
 *                 timerOptions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       value:
 *                         type: integer
 *                       label:
 *                         type: string
 *                       description:
 *                         type: string
 *                 healthOptions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       value:
 *                         type: integer
 *                       label:
 *                         type: string
 *                       description:
 *                         type: string
 *                 defaults:
 *                   type: object
 *                   description: Default game settings
 *                 validationRules:
 *                   type: object
 *                   description: Validation rules for game configuration
 */
// Get game configuration options and defaults
router.get('/config/options', async (req, res) => {
  try {
    const options = {
      gameModes: [
        { value: 'standard', label: 'Standard', description: 'Classic tactical card game experience' },
        { value: 'blitz', label: 'Blitz', description: 'Fast-paced gameplay with reduced turn timers' },
        { value: 'endurance', label: 'Endurance', description: 'Extended matches with increased starting health' }
      ],
      seriesOptions: [
        { value: 1, label: 'Quick Match', description: 'Single game, winner takes all' },
        { value: 3, label: 'Best of 3', description: 'First to win 2 games' },
        { value: 5, label: 'Best of 5', description: 'First to win 3 games' },
        { value: 7, label: 'Best of 7', description: 'First to win 4 games' }
      ],
      timerOptions: [
        { value: 10, label: '10 seconds', description: 'Lightning fast' },
        { value: 15, label: '15 seconds', description: 'Quick decisions' },
        { value: 20, label: '20 seconds', description: 'Standard pace' },
        { value: 30, label: '30 seconds', description: 'Thoughtful play' },
        { value: 45, label: '45 seconds', description: 'Relaxed timing' },
        { value: 60, label: '60 seconds', description: 'Maximum thinking time' }
      ],
      healthOptions: [
        { value: 3, label: '3 Health', description: 'Quick matches' },
        { value: 6, label: '6 Health', description: 'Standard game' },
        { value: 10, label: '10 Health', description: 'Extended matches' },
        { value: 15, label: '15 Health', description: 'Long strategic games' }
      ],
      defaults: gameSettingsService.defaultSettings,
      validationRules: gameSettingsService.validationRules
    };

    res.json(options);
  } catch (error) {
    console.error('Get config options error:', error);
    res.status(500).json({
      error: 'Failed to get configuration options',
      code: 'GET_CONFIG_OPTIONS_ERROR'
    });
  }
});

// Validate game configuration
router.post('/config/validate', async (req, res) => {
  try {
    const { gameConfig } = req.body;
    
    const validation = gameSettingsService.validateGameConfig(gameConfig);
    const displayInfo = validation.isValid ? 
      gameSettingsService.getConfigDisplayInfo(validation.config) : null;

    res.json({
      isValid: validation.isValid,
      errors: validation.errors,
      config: validation.config,
      displayInfo
    });
  } catch (error) {
    console.error('Config validation error:', error);
    res.status(500).json({
      error: 'Failed to validate configuration',
      code: 'CONFIG_VALIDATION_ERROR'
    });
  }
});

// Leave/forfeit a game
router.post('/:gameId/forfeit', auth.authenticateToken, validation.validateUUIDParam('gameId'), async (req, res) => {
  try {
    const { gameId } = req.params;

    const game = await Game.findByPk(gameId);

    if (!game) {
      return res.status(404).json({
        error: 'Game not found',
        code: 'GAME_NOT_FOUND'
      });
    }

    // Check if user is part of this game
    if (game.player1Id !== req.user.id && game.player2Id !== req.user.id) {
      return res.status(403).json({
        error: 'Access denied',
        code: 'ACCESS_DENIED'
      });
    }

    if (game.status === 'completed') {
      return res.status(400).json({
        error: 'Game is already completed',
        code: 'GAME_COMPLETED'
      });
    }

    // Determine winner (the other player)
    const winnerId = game.player1Id === req.user.id ? game.player2Id : game.player1Id;

    await game.update({
      status: 'completed',
      phase: 'ended',
      winnerId,
      endedAt: new Date()
    });

    // Reload with player information
    await game.reload({
      include: [
        { model: User, as: 'player1', attributes: ['id', 'username'] },
        { model: User, as: 'player2', attributes: ['id', 'username'] },
        { model: User, as: 'winner', attributes: ['id', 'username'] }
      ]
    });

    res.json({
      message: 'Game forfeited',
      game
    });
  } catch (error) {
    console.error('Game forfeit error:', error);
    res.status(500).json({
      error: 'Failed to forfeit game',
      code: 'GAME_FORFEIT_ERROR'
    });
  }
});

module.exports = router;