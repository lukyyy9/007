/**
 * Testcontainers setup for database testing
 * This file manages PostgreSQL container lifecycle for tests
 */

let PostgreSqlContainer;
try {
  // Try to import testcontainers - it might not be installed
  PostgreSqlContainer = require('@testcontainers/postgresql').PostgreSqlContainer;
} catch (error) {
  console.warn('Testcontainers not available. Install @testcontainers/postgresql for database testing.');
}

const { Sequelize } = require('sequelize');

class TestDatabase {
  constructor() {
    this.container = null;
    this.sequelize = null;
  }

  async start() {
    if (!PostgreSqlContainer) {
      throw new Error('Testcontainers not available. Install @testcontainers/postgresql for database testing.');
    }
    
    console.log('Starting PostgreSQL test container...');
    
    // Start PostgreSQL container
    this.container = await new PostgreSqlContainer('postgres:15-alpine')
      .withDatabase('tactical_card_game')
      .withUsername('testuser')
      .withPassword('testpass')
      .withExposedPorts(5432)
      .start();

    const host = this.container.getHost();
    const port = this.container.getMappedPort(5432);
    const database = this.container.getDatabase();
    const username = this.container.getUsername();
    const password = this.container.getPassword();

    console.log(`PostgreSQL container started at ${host}:${port}`);

    // Update environment variables for tests
    process.env.DB_HOST = host;
    process.env.DB_PORT = port.toString();
    process.env.DB_NAME = database;
    process.env.DB_USER = username;
    process.env.DB_PASSWORD = password;

    // Create Sequelize instance for test database
    this.sequelize = new Sequelize({
      host,
      port,
      database,
      username,
      password,
      dialect: 'postgres',
      logging: false, // Disable logging in tests
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    });

    // Test connection
    await this.sequelize.authenticate();
    console.log('Test database connection established');

    return this.sequelize;
  }

  async stop() {
    if (this.sequelize) {
      await this.sequelize.close();
      this.sequelize = null;
    }

    if (this.container) {
      console.log('Stopping PostgreSQL test container...');
      await this.container.stop();
      this.container = null;
    }
  }

  getSequelize() {
    return this.sequelize;
  }

  async setupDatabase() {
    if (!this.sequelize) {
      throw new Error('Database not started. Call start() first.');
    }

    // Run migrations to create tables
    await this.runMigrations();
    
    // Seed card definitions
    await this.seedCardDefinitions();

    console.log('Test database setup completed');
  }

  async runMigrations() {
    const path = require('path');
    const fs = require('fs');
    
    const migrationsDir = path.join(__dirname, '../scripts/migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.js'))
      .sort();

    console.log('Running test database migrations...');
    
    for (const file of migrationFiles) {
      console.log(`Running migration: ${file}`);
      const migration = require(path.join(migrationsDir, file));
      
      try {
        await migration.up(this.sequelize.getQueryInterface());
        console.log(`✓ Migration ${file} completed successfully`);
      } catch (error) {
        console.error(`✗ Migration ${file} failed:`, error.message);
        throw error;
      }
    }
  }

  async seedCardDefinitions() {
    // Create a temporary Sequelize instance to define the CardDefinition model
    const { DataTypes } = require('sequelize');
    
    const CardDefinition = this.sequelize.define('CardDefinition', {
      id: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      emoji: {
        type: DataTypes.STRING,
        allowNull: false
      },
      cost: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      category: {
        type: DataTypes.ENUM('attack', 'defense', 'utility', 'special'),
        allowNull: false
      },
      rarity: {
        type: DataTypes.ENUM('common', 'uncommon', 'rare', 'legendary'),
        allowNull: false,
        defaultValue: 'common'
      },
      effects: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: []
      },
      conditions: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: []
      }
    }, {
      tableName: 'card_definitions',
      timestamps: true
    });
    
    const cardDefinitions = [
      {
        id: 'charger',
        name: 'Charger',
        emoji: '⚡',
        cost: 0,
        description: 'Gain 1 charge',
        category: 'utility',
        rarity: 'common',
        effects: [{ type: 'charge', value: 1, target: 'self', timing: 'immediate' }]
      },
      {
        id: 'tirer',
        name: 'Tirer',
        emoji: '🔫',
        cost: 1,
        description: 'Deal 1 damage to opponent',
        category: 'attack',
        rarity: 'common',
        effects: [{ type: 'damage', value: 1, target: 'opponent', timing: 'immediate' }]
      },
      {
        id: 'big-blast',
        name: 'Big Blast',
        emoji: '💥',
        cost: 5,
        description: 'Deal 5 damage to opponent',
        category: 'attack',
        rarity: 'rare',
        effects: [{ type: 'damage', value: 5, target: 'opponent', timing: 'immediate' }]
      },
      {
        id: 'bloquer',
        name: 'Bloquer',
        emoji: '🛡️',
        cost: 1,
        description: 'Block 1 damage this turn',
        category: 'defense',
        rarity: 'common',
        effects: [{ type: 'block', value: 1, target: 'self', timing: 'immediate' }]
      },
      {
        id: 'bruler',
        name: 'Brûler',
        emoji: '🔥',
        cost: 2,
        description: 'Deal 1 damage and apply burn for 2 turns',
        category: 'attack',
        rarity: 'uncommon',
        effects: [
          { type: 'damage', value: 1, target: 'opponent', timing: 'immediate' },
          { type: 'status', value: 2, target: 'opponent', timing: 'immediate', statusType: 'burn' }
        ]
      },
      {
        id: 'riposte',
        name: 'Riposte',
        emoji: '⚔️',
        cost: 2,
        description: 'Block 1 damage and counter for 2 if you block',
        category: 'defense',
        rarity: 'uncommon',
        effects: [
          { type: 'block', value: 1, target: 'self', timing: 'immediate' },
          { type: 'damage', value: 2, target: 'opponent', timing: 'conditional', condition: 'blocked_damage' }
        ]
      },
      {
        id: 'furie',
        name: 'Furie',
        emoji: '😡',
        cost: 3,
        description: 'Deal 3 damage to opponent and 2 to yourself',
        category: 'attack',
        rarity: 'uncommon',
        effects: [
          { type: 'damage', value: 3, target: 'opponent', timing: 'immediate' },
          { type: 'damage', value: 2, target: 'self', timing: 'immediate' }
        ]
      },
      {
        id: 'armure-magique',
        name: 'Armure magique',
        emoji: '🔮',
        cost: 4,
        description: 'Block all damage this turn',
        category: 'defense',
        rarity: 'rare',
        effects: [{ type: 'block', value: 999, target: 'self', timing: 'immediate' }]
      },
      {
        id: 'court-circuit',
        name: 'Court circuit',
        emoji: '⚡',
        cost: 1,
        description: 'Gain charges based on opponent blocking',
        category: 'utility',
        rarity: 'uncommon',
        effects: [
          { type: 'charge', value: 2, target: 'self', timing: 'conditional', condition: 'opponent_blocked' },
          { type: 'charge', value: 1, target: 'self', timing: 'conditional', condition: 'opponent_not_blocked' },
          { type: 'damage', value: 2, target: 'self', timing: 'conditional', condition: 'opponent_not_blocked' }
        ]
      },
      {
        id: 'vampirisme',
        name: 'Vampirisme',
        emoji: '🧛',
        cost: 2,
        description: 'Heal 1 if opponent blocked',
        category: 'utility',
        rarity: 'uncommon',
        effects: [
          { type: 'heal', value: 1, target: 'self', timing: 'conditional', condition: 'opponent_blocked' }
        ]
      },
      {
        id: 'tourmente',
        name: 'Tourmente',
        emoji: '🌪️',
        cost: 0,
        description: 'Deal damage based on repeated cards (step 1 only)',
        category: 'special',
        rarity: 'rare',
        conditions: [{ type: 'step_requirement', value: 1 }],
        effects: [
          { type: 'damage', value: 1, target: 'opponent', timing: 'end-of-turn', condition: 'repeated_cards' }
        ]
      },
      {
        id: 'soigner',
        name: 'Soigner',
        emoji: '💚',
        cost: 1,
        description: 'Heal 2 health',
        category: 'utility',
        rarity: 'common',
        effects: [{ type: 'heal', value: 2, target: 'self', timing: 'immediate' }]
      }
    ];

    await CardDefinition.bulkCreate(cardDefinitions, { ignoreDuplicates: true });
  }

  async cleanDatabase() {
    if (!this.sequelize) {
      return;
    }

    try {
      // Truncate all tables except card definitions
      await this.sequelize.query('TRUNCATE TABLE "users", "games", "tournaments", "matches", "tournament_players", "game_actions" RESTART IDENTITY CASCADE');
    } catch (error) {
      // If tables don't exist yet, that's okay - they'll be created by migrations
      if (!error.message.includes('does not exist')) {
        throw error;
      }
    }
  }
}

module.exports = TestDatabase;