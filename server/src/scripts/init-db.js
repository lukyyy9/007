// Database initialization script
const sequelize = require('../config/database');
const db = require('../models');
const path = require('path');
const fs = require('fs');

async function runMigrations() {
  const migrationsDir = path.join(__dirname, 'migrations');
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.js'))
    .sort();

  console.log('Running migrations...');
  
  for (const file of migrationFiles) {
    console.log(`Running migration: ${file}`);
    const migration = require(path.join(migrationsDir, file));
    
    try {
      await migration.up(sequelize.getQueryInterface());
      console.log(`✓ Migration ${file} completed successfully`);
    } catch (error) {
      console.error(`✗ Migration ${file} failed:`, error.message);
      throw error;
    }
  }
}

async function seedCardDefinitions() {
  const { CardDefinition } = db;
  
  console.log('Seeding card definitions...');
  
  const cardDefinitions = [
    {
      id: 'charger',
      name: 'Charger',
      emoji: '⚡',
      cost: 0,
      description: 'Gain 1 charge at no cost',
      effects: [
        { type: 'charge', value: 1, target: 'self', timing: 'immediate' }
      ],
      category: 'utility',
      rarity: 'common'
    },
    {
      id: 'tirer',
      name: 'Tirer',
      emoji: '🏹',
      cost: 1,
      description: 'Deal 1 damage to opponent for 1 charge',
      effects: [
        { type: 'damage', value: 1, target: 'opponent', timing: 'immediate' }
      ],
      category: 'attack',
      rarity: 'common'
    },
    {
      id: 'big-blast',
      name: 'Big Blast',
      emoji: '💥',
      cost: 3,
      description: 'Deal 5 damage to opponent for 3 charges',
      effects: [
        { type: 'damage', value: 5, target: 'opponent', timing: 'immediate' }
      ],
      category: 'attack',
      rarity: 'rare'
    },
    {
      id: 'bloquer',
      name: 'Bloquer',
      emoji: '🛡️',
      cost: 0,
      description: 'Block all incoming damage for this step',
      effects: [
        { type: 'block', value: 1, target: 'self', timing: 'immediate' }
      ],
      category: 'defense',
      rarity: 'common'
    },
    {
      id: 'bruler',
      name: 'Brûler',
      emoji: '🔥',
      cost: 2,
      description: 'Deal 1 damage and apply burn status for 2 turns',
      effects: [
        { type: 'damage', value: 1, target: 'opponent', timing: 'immediate' },
        { type: 'status', value: 2, target: 'opponent', timing: 'immediate', statusType: 'burn' }
      ],
      category: 'attack',
      rarity: 'uncommon'
    },
    {
      id: 'riposte',
      name: 'Riposte',
      emoji: '⚔️',
      cost: 0,
      description: 'If you successfully block damage, deal 2 damage to attacker',
      effects: [
        { type: 'block', value: 1, target: 'self', timing: 'immediate' },
        { type: 'damage', value: 2, target: 'opponent', timing: 'conditional', condition: 'blocked_damage' }
      ],
      category: 'defense',
      rarity: 'uncommon'
    },
    {
      id: 'furie',
      name: 'Furie',
      emoji: '😡',
      cost: 2,
      description: 'Deal 3 damage to opponent and 2 damage to self',
      effects: [
        { type: 'damage', value: 3, target: 'opponent', timing: 'immediate' },
        { type: 'damage', value: 2, target: 'self', timing: 'immediate' }
      ],
      category: 'attack',
      rarity: 'uncommon'
    },
    {
      id: 'armure-magique',
      name: 'Armure magique',
      emoji: '✨',
      cost: 3,
      description: 'Block all damage for this step',
      effects: [
        { type: 'block', value: 999, target: 'self', timing: 'immediate' }
      ],
      category: 'defense',
      rarity: 'rare'
    },
    {
      id: 'court-circuit',
      name: 'Court circuit',
      emoji: '⚡',
      cost: 0,
      description: 'If opponent blocked damage, gain 2 charges. Otherwise gain 1 charge and take 2 damage',
      effects: [
        { type: 'charge', value: 2, target: 'self', timing: 'conditional', condition: 'opponent_blocked' },
        { type: 'charge', value: 1, target: 'self', timing: 'conditional', condition: 'opponent_not_blocked' },
        { type: 'damage', value: 2, target: 'self', timing: 'conditional', condition: 'opponent_not_blocked' }
      ],
      category: 'utility',
      rarity: 'uncommon'
    },
    {
      id: 'vampirisme',
      name: 'Vampirisme',
      emoji: '🧛',
      cost: 0,
      description: 'If opponent blocked damage, heal 1 health point',
      effects: [
        { type: 'heal', value: 1, target: 'self', timing: 'conditional', condition: 'opponent_blocked' }
      ],
      category: 'utility',
      rarity: 'uncommon'
    },
    {
      id: 'tourmente',
      name: 'Tourmente',
      emoji: '🌪️',
      cost: 0,
      description: 'Must be played in first step. At turn end, deal 1 damage per repeated card opponent played',
      effects: [
        { type: 'damage', value: 1, target: 'opponent', timing: 'end-of-turn', condition: 'repeated_cards' }
      ],
      conditions: [
        { type: 'step_requirement', value: 1 }
      ],
      category: 'special',
      rarity: 'rare'
    }
  ];

  for (const cardData of cardDefinitions) {
    await CardDefinition.upsert(cardData);
  }
  
  console.log(`✓ Seeded ${cardDefinitions.length} card definitions`);
}

async function initializeDatabase() {
  try {
    // Test the connection
    await sequelize.authenticate();
    console.log('✓ Database connection established successfully');
    
    // Run migrations to create tables
    await runMigrations();
    console.log('✓ Database migrations completed');
    
    // Seed card definitions
    await seedCardDefinitions();
    console.log('✓ Database seeding completed');
    
    console.log('✓ Database initialization completed successfully');
    
  } catch (error) {
    console.error('✗ Database initialization failed:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('Database setup completed successfully.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Database setup failed:', error);
      process.exit(1);
    });
}

module.exports = initializeDatabase;