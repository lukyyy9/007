// Test setup file
// This file runs before each test suite

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.DB_NAME = 'tactical_card_game_test';

// Global test utilities can be added here