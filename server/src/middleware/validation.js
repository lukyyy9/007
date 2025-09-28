const { body, param, query, validationResult } = require('express-validator');

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: errors.array()
    });
  }
  next();
};

// Game validation rules
const validateGameCreation = [
  body('gameConfig.maxHealth')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Max health must be between 1 and 50'),
  body('gameConfig.turnTimeLimit')
    .optional()
    .isInt({ min: 5, max: 120 })
    .withMessage('Turn time limit must be between 5 and 120 seconds'),
  body('gameConfig.bestOfSeries')
    .optional()
    .isInt({ min: 1, max: 7 })
    .withMessage('Best of series must be between 1 and 7'),
  body('gameConfig.gameMode')
    .optional()
    .isIn(['standard', 'blitz', 'endurance'])
    .withMessage('Game mode must be standard, blitz, or endurance'),
  body('name')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Game name must be between 1 and 100 characters'),
  handleValidationErrors
];

const validateGameJoin = [
  param('gameId')
    .isUUID()
    .withMessage('Game ID must be a valid UUID'),
  handleValidationErrors
];

// Tournament validation rules
const validateTournamentCreation = [
  body('name')
    .isLength({ min: 3, max: 100 })
    .withMessage('Tournament name must be between 3 and 100 characters'),
  body('format')
    .isIn(['single-elimination', 'double-elimination'])
    .withMessage('Format must be either single-elimination or double-elimination'),
  body('maxPlayers')
    .isInt({ min: 4, max: 64 })
    .withMessage('Max players must be between 4 and 64'),
  body('gameConfig.maxHealth')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Max health must be between 1 and 20'),
  body('gameConfig.turnTimeLimit')
    .optional()
    .isInt({ min: 10, max: 120 })
    .withMessage('Turn time limit must be between 10 and 120 seconds'),
  body('gameConfig.bestOfSeries')
    .optional()
    .isInt({ min: 1, max: 9 })
    .withMessage('Best of series must be between 1 and 9'),
  handleValidationErrors
];

const validateTournamentJoin = [
  param('tournamentId')
    .isUUID()
    .withMessage('Tournament ID must be a valid UUID'),
  handleValidationErrors
];

// UUID parameter validation
const validateUUIDParam = (paramName) => [
  param(paramName)
    .isUUID()
    .withMessage(`${paramName} must be a valid UUID`),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateGameCreation,
  validateGameJoin,
  validateTournamentCreation,
  validateTournamentJoin,
  validateUUIDParam
};