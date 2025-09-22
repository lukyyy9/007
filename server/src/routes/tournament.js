const express = require('express');
const { Tournament, TournamentPlayer, User, Match } = require('../models');
const { auth, validation } = require('../middleware');
const { TournamentManager } = require('../services');
const router = express.Router();

const tournamentManager = new TournamentManager();

/**
 * @swagger
 * tags:
 *   name: Tournaments
 *   description: Tournament management and brackets
 */

/**
 * @swagger
 * /api/tournament/create:
 *   post:
 *     summary: Create a new tournament
 *     tags: [Tournaments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - format
 *               - maxPlayers
 *             properties:
 *               name:
 *                 type: string
 *                 description: Tournament name
 *                 example: "Weekly Championship"
 *               format:
 *                 type: string
 *                 enum: [single-elimination, double-elimination]
 *                 description: Tournament format
 *                 example: single-elimination
 *               maxPlayers:
 *                 type: integer
 *                 minimum: 4
 *                 maximum: 64
 *                 description: Maximum number of players
 *                 example: 8
 *               gameConfig:
 *                 type: object
 *                 description: Game configuration for tournament matches
 *     responses:
 *       201:
 *         description: Tournament created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Tournament created successfully
 *                 tournament:
 *                   $ref: '#/components/schemas/Tournament'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 */
// Create a new tournament
router.post('/create', auth.authenticateToken, validation.validateTournamentCreation, async (req, res) => {
  try {
    const { name, format, maxPlayers, gameConfig = {} } = req.body;
    
    const tournament = await tournamentManager.createTournament({
      name,
      format,
      maxPlayers,
      creatorId: req.user.id,
      gameConfig
    });

    // Include creator information
    const tournamentWithCreator = await Tournament.findByPk(tournament.id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'username'] },
        { 
          model: TournamentPlayer, 
          include: [{ model: User, as: 'player', attributes: ['id', 'username'] }]
        }
      ]
    });

    res.status(201).json({
      message: 'Tournament created successfully',
      tournament: tournamentWithCreator
    });
  } catch (error) {
    console.error('Tournament creation error:', error);
    res.status(500).json({
      error: error.message || 'Failed to create tournament',
      code: 'TOURNAMENT_CREATION_ERROR'
    });
  }
});

/**
 * @swagger
 * /api/tournament/join/{tournamentId}:
 *   post:
 *     summary: Join a tournament
 *     tags: [Tournaments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tournamentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Tournament ID to join
 *     responses:
 *       200:
 *         description: Joined tournament successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Joined tournament successfully
 *                 tournament:
 *                   $ref: '#/components/schemas/Tournament'
 *       400:
 *         description: Cannot join tournament (full, already started, etc.)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Tournament not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Join a tournament
router.post('/join/:tournamentId', auth.authenticateToken, validation.validateTournamentJoin, async (req, res) => {
  try {
    const { tournamentId } = req.params;

    await tournamentManager.addPlayer(tournamentId, req.user.id);

    // Get updated tournament information
    const tournament = await Tournament.findByPk(tournamentId, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'username'] },
        { 
          model: TournamentPlayer, 
          include: [{ model: User, as: 'player', attributes: ['id', 'username'] }]
        }
      ]
    });

    res.json({
      message: 'Joined tournament successfully',
      tournament
    });
  } catch (error) {
    console.error('Tournament join error:', error);
    res.status(500).json({
      error: error.message || 'Failed to join tournament',
      code: 'TOURNAMENT_JOIN_ERROR'
    });
  }
});

/**
 * @swagger
 * /api/tournament/{tournamentId}:
 *   get:
 *     summary: Get tournament details
 *     tags: [Tournaments]
 *     parameters:
 *       - in: path
 *         name: tournamentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Tournament ID
 *     responses:
 *       200:
 *         description: Tournament details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tournament:
 *                   $ref: '#/components/schemas/Tournament'
 *       404:
 *         description: Tournament not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Get tournament details
router.get('/:tournamentId', auth.optionalAuth, validation.validateUUIDParam('tournamentId'), async (req, res) => {
  try {
    const { tournamentId } = req.params;

    const tournament = await Tournament.findByPk(tournamentId, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'username'] },
        { model: User, as: 'winner', attributes: ['id', 'username'] },
        { 
          model: TournamentPlayer, 
          include: [{ model: User, as: 'player', attributes: ['id', 'username'] }]
        },
        {
          model: Match,
          include: [
            { model: User, as: 'player1', attributes: ['id', 'username'] },
            { model: User, as: 'player2', attributes: ['id', 'username'] },
            { model: User, as: 'winner', attributes: ['id', 'username'] }
          ]
        }
      ]
    });

    if (!tournament) {
      return res.status(404).json({
        error: 'Tournament not found',
        code: 'TOURNAMENT_NOT_FOUND'
      });
    }

    res.json({
      tournament
    });
  } catch (error) {
    console.error('Get tournament error:', error);
    res.status(500).json({
      error: 'Failed to get tournament',
      code: 'GET_TOURNAMENT_ERROR'
    });
  }
});

// Get tournament brackets
router.get('/:tournamentId/brackets', auth.optionalAuth, validation.validateUUIDParam('tournamentId'), async (req, res) => {
  try {
    const { tournamentId } = req.params;

    const tournament = await Tournament.findByPk(tournamentId);

    if (!tournament) {
      return res.status(404).json({
        error: 'Tournament not found',
        code: 'TOURNAMENT_NOT_FOUND'
      });
    }

    const matches = await Match.findAll({
      where: { tournamentId },
      include: [
        { model: User, as: 'player1', attributes: ['id', 'username'] },
        { model: User, as: 'player2', attributes: ['id', 'username'] },
        { model: User, as: 'winner', attributes: ['id', 'username'] }
      ],
      order: [['round', 'ASC'], ['position', 'ASC']]
    });

    // Group matches by bracket type and round
    const brackets = {
      winner: {},
      loser: tournament.format === 'double-elimination' ? {} : null
    };

    matches.forEach(match => {
      const bracketType = match.bracketType || 'winner';
      if (!brackets[bracketType][match.round]) {
        brackets[bracketType][match.round] = [];
      }
      brackets[bracketType][match.round].push(match);
    });

    res.json({
      tournament: {
        id: tournament.id,
        name: tournament.name,
        format: tournament.format,
        status: tournament.status,
        currentRound: tournament.currentRound
      },
      brackets
    });
  } catch (error) {
    console.error('Get tournament brackets error:', error);
    res.status(500).json({
      error: 'Failed to get tournament brackets',
      code: 'GET_BRACKETS_ERROR'
    });
  }
});

/**
 * @swagger
 * /api/tournament:
 *   get:
 *     summary: Get list of tournaments
 *     tags: [Tournaments]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [waiting, active, completed, all]
 *           default: waiting
 *         description: Filter tournaments by status
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           minimum: 1
 *           maximum: 100
 *         description: Number of tournaments to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *           minimum: 0
 *         description: Number of tournaments to skip
 *     responses:
 *       200:
 *         description: Tournaments list retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tournaments:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Tournament'
 *                 total:
 *                   type: integer
 *                   description: Total number of tournaments matching criteria
 *                 limit:
 *                   type: integer
 *                 offset:
 *                   type: integer
 */
// Get list of tournaments
router.get('/', auth.optionalAuth, async (req, res) => {
  try {
    const { status = 'waiting', limit = 20, offset = 0 } = req.query;

    const whereClause = {};
    if (status !== 'all') {
      whereClause.status = status;
    }

    const tournaments = await Tournament.findAndCountAll({
      where: whereClause,
      include: [
        { model: User, as: 'creator', attributes: ['id', 'username'] },
        { model: User, as: 'winner', attributes: ['id', 'username'] },
        { 
          model: TournamentPlayer, 
          include: [{ model: User, as: 'player', attributes: ['id', 'username'] }]
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      tournaments: tournaments.rows,
      total: tournaments.count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Get tournaments list error:', error);
    res.status(500).json({
      error: 'Failed to get tournaments list',
      code: 'GET_TOURNAMENTS_ERROR'
    });
  }
});

// Start tournament (only creator can start)
router.post('/:tournamentId/start', auth.authenticateToken, validation.validateUUIDParam('tournamentId'), async (req, res) => {
  try {
    const { tournamentId } = req.params;

    const result = await tournamentManager.startTournament(tournamentId, req.user.id);

    res.json({
      message: 'Tournament started successfully',
      tournament: {
        id: result.tournament.id,
        name: result.tournament.name,
        status: result.tournament.status,
        playerCount: result.playerCount
      },
      brackets: result.brackets
    });
  } catch (error) {
    console.error('Tournament start error:', error);
    res.status(500).json({
      error: error.message || 'Failed to start tournament',
      code: 'TOURNAMENT_START_ERROR'
    });
  }
});

// Leave tournament (only if not started)
router.post('/:tournamentId/leave', auth.authenticateToken, validation.validateUUIDParam('tournamentId'), async (req, res) => {
  try {
    const { tournamentId } = req.params;

    const tournament = await Tournament.findByPk(tournamentId);

    if (!tournament) {
      return res.status(404).json({
        error: 'Tournament not found',
        code: 'TOURNAMENT_NOT_FOUND'
      });
    }

    if (tournament.status !== 'waiting') {
      return res.status(400).json({
        error: 'Cannot leave tournament after it has started',
        code: 'TOURNAMENT_STARTED'
      });
    }

    const tournamentPlayer = await TournamentPlayer.findOne({
      where: {
        tournamentId: tournament.id,
        playerId: req.user.id
      }
    });

    if (!tournamentPlayer) {
      return res.status(400).json({
        error: 'Not a participant in this tournament',
        code: 'NOT_PARTICIPANT'
      });
    }

    await tournamentPlayer.destroy();

    res.json({
      message: 'Left tournament successfully'
    });
  } catch (error) {
    console.error('Tournament leave error:', error);
    res.status(500).json({
      error: 'Failed to leave tournament',
      code: 'TOURNAMENT_LEAVE_ERROR'
    });
  }
});

module.exports = router;