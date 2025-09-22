# Testing Infrastructure

This directory contains the testing infrastructure for the tactical card game server, including comprehensive database testing using testcontainers.

## Overview

The testing setup uses **testcontainers** to provide isolated, real PostgreSQL database instances for each test run. This ensures that:

- Tests run against actual PostgreSQL instead of mocks
- Each test suite gets a fresh database state
- Database operations are tested with real constraints and transactions
- Tests are isolated and can run in parallel

## Test Types

### Unit Tests
- **File Pattern**: `*.test.js` (excluding integration and database)
- **Purpose**: Test individual functions and classes in isolation
- **Examples**: Card effects, game logic, utility functions
- **Run Command**: `npm run test:unit`

### Integration Tests
- **File Pattern**: `*.integration.test.js`
- **Purpose**: Test component interactions with database
- **Examples**: GameEngine with database, API endpoints
- **Run Command**: `npm run test:integration`

### Database Tests
- **File Pattern**: `database.test.js`
- **Purpose**: Test database models, relationships, and operations
- **Examples**: Model validation, associations, transactions
- **Run Command**: `npm run test:database`

## Test Infrastructure Files

### `setup.js`
Global test setup that:
- Starts PostgreSQL testcontainer before all tests
- Sets up database schema and seeds card definitions
- Provides global test utilities
- Cleans database between test suites
- Stops container after all tests

### `testcontainers-setup.js`
TestDatabase class that manages:
- PostgreSQL container lifecycle
- Database connection management
- Schema synchronization
- Card definition seeding
- Database cleanup utilities

### `database.test.js`
Comprehensive database integration tests covering:
- Model creation and validation
- Relationship testing
- Transaction handling
- Concurrent operations
- Performance testing

## Global Test Utilities

The setup provides global utilities available in all tests:

```javascript
// Create test user with default or custom data
const user = await global.createTestUser({
  username: 'testuser',
  email: 'test@example.com'
});

// Create test game with default or custom data
const game = await global.createTestGame({
  player1Id: user.id,
  status: 'active'
});

// Create test tournament with default or custom data
const tournament = await global.createTestTournament({
  name: 'Test Tournament',
  creatorId: user.id
});
```

## Running Tests

```bash
# Run all tests
npm test

# Run specific test types
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:database      # Database tests only

# Run with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

## Test Configuration

### Jest Configuration
- **Timeout**: 60 seconds (for container startup)
- **Max Workers**: 1 (to avoid container conflicts)
- **Force Exit**: Enabled for clean container shutdown
- **Detect Open Handles**: Enabled for debugging

### Environment Variables
Tests automatically set up these environment variables:
- `NODE_ENV=test`
- `JWT_SECRET=test-secret`
- Database connection variables (set by testcontainer)

## Docker Support

For local development, you can also use Docker Compose:

```bash
# Start test database container
docker-compose -f docker-compose.test.yml up -d

# Run tests against the container
npm test

# Stop test database container
docker-compose -f docker-compose.test.yml down
```

## Best Practices

### Writing Database Tests
1. Use the global test utilities for creating test data
2. Don't manually clean database - it's handled automatically
3. Test both success and failure scenarios
4. Include transaction testing for critical operations

### Writing Integration Tests
1. Test complete workflows, not just individual functions
2. Verify database state changes
3. Test error handling and edge cases
4. Include concurrent operation testing

### Performance Considerations
1. Testcontainers add startup time - group related tests
2. Use `beforeEach` for test data setup, not `beforeAll`
3. Keep test data minimal but realistic
4. Monitor test execution time and optimize slow tests

## Troubleshooting

### Container Issues
- Ensure Docker is running
- Check available ports (PostgreSQL uses random ports)
- Increase timeout if containers are slow to start

### Test Failures
- Check database connection in test output
- Verify test data setup in `beforeEach` blocks
- Use `--detectOpenHandles` to find connection leaks

### Performance Issues
- Reduce test data size
- Use `maxWorkers: 1` to avoid container conflicts
- Consider test grouping to minimize container restarts