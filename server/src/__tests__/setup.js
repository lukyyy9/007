// Test setup file
// This file runs before each test suite

// Set test environment variables BEFORE requiring any modules
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';  // Test postgres container
process.env.DB_NAME = 'tactical_card_game_test';
process.env.DB_USER = 'postgres';
process.env.DB_PASSWORD = 'password';

// Set test timeout
jest.setTimeout(30000);

// Global test utilities can be added here