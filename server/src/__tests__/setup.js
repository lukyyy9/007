// Test setup file
// This file runs before each test suite

// Set test environment variables BEFORE requiring any modules
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';

// Always use testcontainers by default
const useTestcontainers = true;

// Set test timeout (increased for container startup if using testcontainers)
jest.setTimeout(useTestcontainers ? 60000 : 30000);

// Global test database instance
let testDatabase;

const TestDatabase = require('./testcontainers-setup');

// Global setup - runs once before all tests
beforeAll(async () => {
  testDatabase = new TestDatabase();
  await testDatabase.start();
  await testDatabase.setupDatabase();
  
  // Make testDatabase available globally
  global.testDatabase = testDatabase;
});

// Global teardown - runs once after all tests
afterAll(async () => {
  if (testDatabase) {
    await testDatabase.stop();
  }
});

// Clean database between test suites
beforeEach(async () => {
  if (testDatabase) {
    await testDatabase.cleanDatabase();
  }
});

// Testcontainers setup is always used

// Global test utilities (this will be overridden below if needed)

// These will be overridden below

// This will be overridden below

// Global test utilities (available in all tests)
global.createTestUser = async (userData = {}) => {
  // Placeholder for test utilities - implement as needed
  return { id: 1, username: 'testuser', ...userData };
};

global.createTestGame = async (gameData = {}) => {
  // Placeholder for test utilities - implement as needed
  return { id: 1, status: 'waiting', ...gameData };
};

global.createTestTournament = async (tournamentData = {}) => {
  // Placeholder for test utilities - implement as needed
  return { id: 1, name: 'Test Tournament', ...tournamentData };
};