// Unit test setup file
// This file runs before unit test suites that don't need a real database

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_NAME = 'tactical_card_game';
process.env.DB_USER = 'postgres';
process.env.DB_PASSWORD = 'password';

// Set test timeout
jest.setTimeout(30000);

// Mock database for unit tests that don't need real database operations
jest.mock('../models', () => {
  const mockModel = {
    create: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    count: jest.fn(),
    bulkCreate: jest.fn()
  };

  return {
    sequelize: {
      authenticate: jest.fn().mockResolvedValue(true),
      sync: jest.fn().mockResolvedValue(true),
      close: jest.fn().mockResolvedValue(true),
      transaction: jest.fn().mockResolvedValue({
        commit: jest.fn(),
        rollback: jest.fn()
      })
    },
    User: mockModel,
    Game: mockModel,
    Tournament: mockModel,
    Match: mockModel,
    TournamentPlayer: mockModel,
    GameAction: mockModel,
    CardDefinition: mockModel
  };
});

// Global test utilities for unit tests
global.createMockUser = (userData = {}) => ({
  id: 'mock-user-id',
  username: 'testuser',
  email: 'test@example.com',
  password: 'hashedpassword',
  isActive: true,
  validatePassword: jest.fn(),
  toJSON: jest.fn(() => ({ id: 'mock-user-id', username: 'testuser', email: 'test@example.com' })),
  ...userData
});

global.createMockGame = (gameData = {}) => ({
  id: 'mock-game-id',
  player1Id: 'mock-player1-id',
  player2Id: 'mock-player2-id',
  status: 'waiting',
  phase: 'selection',
  currentTurn: 1,
  player1Health: 6,
  player2Health: 6,
  player1Charges: 0,
  player2Charges: 0,
  gameConfig: {
    maxHealth: 6,
    turnTimeLimit: 20,
    bestOfSeries: 1
  },
  ...gameData
});

global.createMockTournament = (tournamentData = {}) => ({
  id: 'mock-tournament-id',
  name: 'Test Tournament',
  format: 'single-elimination',
  maxPlayers: 8,
  status: 'waiting',
  currentPlayers: 0,
  currentRound: 1,
  gameConfig: {
    maxHealth: 6,
    turnTimeLimit: 20,
    bestOfSeries: 1
  },
  ...tournamentData
});