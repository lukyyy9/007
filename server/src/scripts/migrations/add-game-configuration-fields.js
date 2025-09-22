const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add new columns to games table
    await queryInterface.addColumn('games', 'name', {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: null
    });

    await queryInterface.addColumn('games', 'seriesScore', {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: { player1: 0, player2: 0 }
    });

    await queryInterface.addColumn('games', 'currentGameInSeries', {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    });

    await queryInterface.addColumn('games', 'gameHistory', {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
    });

    // Update maxHealth validation to allow up to 50
    await queryInterface.changeColumn('games', 'maxHealth', {
      type: DataTypes.INTEGER,
      defaultValue: 6,
      allowNull: false,
      validate: {
        min: 1,
        max: 50
      }
    });

    // Update turnTimeLimit validation to allow down to 5 seconds
    await queryInterface.changeColumn('games', 'turnTimeLimit', {
      type: DataTypes.INTEGER,
      defaultValue: 20,
      allowNull: false,
      validate: {
        min: 5,
        max: 120
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove added columns
    await queryInterface.removeColumn('games', 'name');
    await queryInterface.removeColumn('games', 'seriesScore');
    await queryInterface.removeColumn('games', 'currentGameInSeries');
    await queryInterface.removeColumn('games', 'gameHistory');

    // Revert maxHealth validation
    await queryInterface.changeColumn('games', 'maxHealth', {
      type: DataTypes.INTEGER,
      defaultValue: 6,
      allowNull: false,
      validate: {
        min: 1,
        max: 20
      }
    });

    // Revert turnTimeLimit validation
    await queryInterface.changeColumn('games', 'turnTimeLimit', {
      type: DataTypes.INTEGER,
      defaultValue: 20,
      allowNull: false,
      validate: {
        min: 10,
        max: 120
      }
    });
  }
};