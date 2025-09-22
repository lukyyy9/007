const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.createTable('matches', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      tournamentId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'tournaments',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      player1Id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      player2Id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      winnerId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      status: {
        type: DataTypes.ENUM('pending', 'active', 'completed', 'cancelled'),
        defaultValue: 'pending',
        allowNull: false
      },
      matchType: {
        type: DataTypes.ENUM('casual', 'tournament', 'ranked'),
        defaultValue: 'casual',
        allowNull: false
      },
      bestOfSeries: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        allowNull: false
      },
      currentGame: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        allowNull: false
      },
      player1Wins: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      player2Wins: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      bracketType: {
        type: DataTypes.ENUM('winner', 'loser'),
        allowNull: true
      },
      bracketRound: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      bracketPosition: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      settings: {
        type: DataTypes.JSONB,
        defaultValue: {
          turnTimeLimit: 20,
          maxHealth: 6
        },
        allowNull: false
      },
      startedAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      completedAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    });

    // Add indexes
    await queryInterface.addIndex('matches', ['status']);
    await queryInterface.addIndex('matches', ['tournamentId']);
    await queryInterface.addIndex('matches', ['player1Id']);
    await queryInterface.addIndex('matches', ['player2Id']);
    await queryInterface.addIndex('matches', ['winnerId']);
    await queryInterface.addIndex('matches', ['matchType']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('matches');
  }
};