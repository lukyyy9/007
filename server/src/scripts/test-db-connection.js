// Database connection test script
const sequelize = require('../config/database');
const db = require('../models');

async function testDatabaseConnection() {
  try {
    console.log('Testing database connection...');
    
    // Test basic connection
    await sequelize.authenticate();
    console.log('✓ Database connection established successfully');
    
    // Test model loading
    console.log('✓ Models loaded:', Object.keys(db).filter(key => key !== 'sequelize' && key !== 'Sequelize'));
    
    // Test basic queries
    const userCount = await db.User.count();
    console.log(`✓ Users table accessible (${userCount} records)`);
    
    const cardCount = await db.CardDefinition.count();
    console.log(`✓ Card definitions table accessible (${cardCount} records)`);
    
    const gameCount = await db.Game.count();
    console.log(`✓ Games table accessible (${gameCount} records)`);
    
    const tournamentCount = await db.Tournament.count();
    console.log(`✓ Tournaments table accessible (${tournamentCount} records)`);
    
    const matchCount = await db.Match.count();
    console.log(`✓ Matches table accessible (${matchCount} records)`);
    
    console.log('✓ All database tests passed successfully');
    
  } catch (error) {
    console.error('✗ Database test failed:', error.message);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  testDatabaseConnection()
    .then(() => {
      console.log('Database connection test completed successfully.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Database connection test failed:', error);
      process.exit(1);
    });
}

module.exports = testDatabaseConnection;