// Model validation script - validates model structure without database connection
const path = require('path');
const fs = require('fs');

function validateModelFiles() {
  const modelsDir = path.join(__dirname, '../models');
  const expectedModels = [
    'User.js',
    'Game.js',
    'Tournament.js',
    'Match.js',
    'GameAction.js',
    'TournamentPlayer.js',
    'CardDefinition.js',
    'index.js'
  ];

  console.log('Validating model files...');
  
  for (const modelFile of expectedModels) {
    const modelPath = path.join(modelsDir, modelFile);
    if (fs.existsSync(modelPath)) {
      console.log(`✓ ${modelFile} exists`);
    } else {
      console.error(`✗ ${modelFile} missing`);
      return false;
    }
  }
  
  return true;
}

function validateMigrationFiles() {
  const migrationsDir = path.join(__dirname, 'migrations');
  const expectedMigrations = [
    '001-create-users.js',
    '002-create-tournaments.js',
    '003-create-matches.js',
    '004-create-games.js',
    '005-create-game-actions.js',
    '006-create-tournament-players.js',
    '007-create-card-definitions.js'
  ];

  console.log('Validating migration files...');
  
  for (const migrationFile of expectedMigrations) {
    const migrationPath = path.join(migrationsDir, migrationFile);
    if (fs.existsSync(migrationPath)) {
      console.log(`✓ ${migrationFile} exists`);
    } else {
      console.error(`✗ ${migrationFile} missing`);
      return false;
    }
  }
  
  return true;
}

function validateModelStructure() {
  try {
    console.log('Validating model structure...');
    
    // Try to require models without connecting to database
    const User = require('../models/User');
    const Game = require('../models/Game');
    const Tournament = require('../models/Tournament');
    const Match = require('../models/Match');
    const GameAction = require('../models/GameAction');
    const TournamentPlayer = require('../models/TournamentPlayer');
    const CardDefinition = require('../models/CardDefinition');
    
    console.log('✓ All models can be required successfully');
    
    // Check if models have expected properties
    const userAttributes = Object.keys(User.rawAttributes);
    const expectedUserAttributes = ['id', 'username', 'email', 'password', 'isActive', 'lastLoginAt'];
    
    for (const attr of expectedUserAttributes) {
      if (userAttributes.includes(attr)) {
        console.log(`✓ User model has ${attr} attribute`);
      } else {
        console.error(`✗ User model missing ${attr} attribute`);
        return false;
      }
    }
    
    const gameAttributes = Object.keys(Game.rawAttributes);
    const expectedGameAttributes = ['id', 'status', 'phase', 'player1Id', 'player2Id', 'winnerId'];
    
    for (const attr of expectedGameAttributes) {
      if (gameAttributes.includes(attr)) {
        console.log(`✓ Game model has ${attr} attribute`);
      } else {
        console.error(`✗ Game model missing ${attr} attribute`);
        return false;
      }
    }
    
    return true;
    
  } catch (error) {
    console.error('✗ Model structure validation failed:', error.message);
    return false;
  }
}

function validateScripts() {
  const scriptsDir = __dirname;
  const expectedScripts = [
    'init-db.js',
    'run-migrations.js',
    'seed-cards.js',
    'test-db-connection.js'
  ];

  console.log('Validating script files...');
  
  for (const scriptFile of expectedScripts) {
    const scriptPath = path.join(scriptsDir, scriptFile);
    if (fs.existsSync(scriptPath)) {
      console.log(`✓ ${scriptFile} exists`);
    } else {
      console.error(`✗ ${scriptFile} missing`);
      return false;
    }
  }
  
  return true;
}

async function validateModels() {
  try {
    console.log('=== Model Validation ===\n');
    
    const filesValid = validateModelFiles();
    const migrationsValid = validateMigrationFiles();
    const structureValid = validateModelStructure();
    const scriptsValid = validateScripts();
    
    if (filesValid && migrationsValid && structureValid && scriptsValid) {
      console.log('\n✓ All model validations passed successfully');
      console.log('✓ Database models and setup are ready for use');
      return true;
    } else {
      console.log('\n✗ Some validations failed');
      return false;
    }
    
  } catch (error) {
    console.error('✗ Model validation failed:', error);
    return false;
  }
}

// Run if called directly
if (require.main === module) {
  validateModels()
    .then((success) => {
      if (success) {
        console.log('\nModel validation completed successfully.');
        process.exit(0);
      } else {
        console.log('\nModel validation failed.');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('Model validation error:', error);
      process.exit(1);
    });
}

module.exports = validateModels;