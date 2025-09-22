const express = require('express');
const { Game, User, GameAction } = require('../models');
const { auth, validation } = require('../middleware');
const router = express.Router();

// Create a new game
router.post('/create', auth.authenticateToken, validation.validateGameCreation, async (req, res) => {
  try {
    const { gameConfig = {} } = req.body;
    
    const defaultConfig = {
      maxHealth: 6,
      turnTimeLimit: 20,
      bestOfSeries: 1
    };

    const finalConfig = { ...defaultConfig, ...gameConfig };

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
      gameHistory: []
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