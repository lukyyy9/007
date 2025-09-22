// Migration runner script
const sequelize = require('../config/database');
const path = require('path');
const fs = require('fs');

async function runMigrations() {
  try {
    // Test the connection first
    await sequelize.authenticate();
    console.log('✓ Database connection established');
    
    const migrationsDir = path.join(__dirname, 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.js'))
      .sort();

    console.log(`Found ${migrationFiles.length} migration files`);
    
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
    
    console.log('✓ All migrations completed successfully');
    
  } catch (error) {
    console.error('✗ Migration failed:', error);
    throw error;
  }
}

async function rollbackMigrations() {
  try {
    await sequelize.authenticate();
    console.log('✓ Database connection established');
    
    const migrationsDir = path.join(__dirname, 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.js'))
      .sort()
      .reverse(); // Reverse order for rollback

    console.log(`Rolling back ${migrationFiles.length} migration files`);
    
    for (const file of migrationFiles) {
      console.log(`Rolling back migration: ${file}`);
      const migration = require(path.join(migrationsDir, file));
      
      try {
        await migration.down(sequelize.getQueryInterface());
        console.log(`✓ Migration ${file} rolled back successfully`);
      } catch (error) {
        console.error(`✗ Migration ${file} rollback failed:`, error.message);
        throw error;
      }
    }
    
    console.log('✓ All migrations rolled back successfully');
    
  } catch (error) {
    console.error('✗ Migration rollback failed:', error);
    throw error;
  }
}

// Command line interface
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === 'up') {
    runMigrations()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  } else if (command === 'down') {
    rollbackMigrations()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  } else {
    console.log('Usage: node run-migrations.js [up|down]');
    console.log('  up   - Run all migrations');
    console.log('  down - Rollback all migrations');
    process.exit(1);
  }
}

module.exports = { runMigrations, rollbackMigrations };