const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.createTable('tournaments', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      format: {
        type: DataTypes.ENUM('single-elimination', 'double-elimination'),
        allowNull: false,
        defaultValue: 'single-elimination'
      },
      status: {
        type: DataTypes.ENUM('waiting', 'active', 'completed', 'cancelled'),
        defaultValue: 'waiting',
        allowNull: false
      },
      maxPlayers: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      currentPlayers: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      creatorId: {
        type: DataTypes.UUID,
        allowNull: false,
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
      settings: {
        type: DataTypes.JSONB,
        defaultValue: {
          turnTimeLimit: 20,
          maxHealth: 6,
          bestOfSeries: 1
        },
        allowNull: false
      },
      brackets: {
        type: DataTypes.JSONB,
        defaultValue: {
          winner: [],
          loser: []
        },
        allowNull: false
      },
      currentRound: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
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
    await queryInterface.addIndex('tournaments', ['status']);
    await queryInterface.addIndex('tournaments', ['format']);
    await queryInterface.addIndex('tournaments', ['creatorId']);
    await queryInterface.addIndex('tournaments', ['winnerId']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('tournaments');
  }
};