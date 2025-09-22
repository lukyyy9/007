const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.createTable('games', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      status: {
        type: DataTypes.ENUM('waiting', 'active', 'completed', 'cancelled'),
        defaultValue: 'waiting',
        allowNull: false
      },
      phase: {
        type: DataTypes.ENUM('selection', 'resolution', 'ended'),
        defaultValue: 'selection',
        allowNull: false
      },
      currentTurn: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        allowNull: false
      },
      turnTimeLimit: {
        type: DataTypes.INTEGER,
        defaultValue: 20,
        allowNull: false
      },
      maxHealth: {
        type: DataTypes.INTEGER,
        defaultValue: 6,
        allowNull: false
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
      player1Health: {
        type: DataTypes.INTEGER,
        defaultValue: 6,
        allowNull: false
      },
      player2Health: {
        type: DataTypes.INTEGER,
        defaultValue: 6,
        allowNull: false
      },
      player1Charges: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      player2Charges: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      player1StatusEffects: {
        type: DataTypes.JSONB,
        defaultValue: [],
        allowNull: false
      },
      player2StatusEffects: {
        type: DataTypes.JSONB,
        defaultValue: [],
        allowNull: false
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
      matchId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'matches',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      gameConfig: {
        type: DataTypes.JSONB,
        defaultValue: {},
        allowNull: false
      },
      turnStartedAt: {
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
    await queryInterface.addIndex('games', ['status']);
    await queryInterface.addIndex('games', ['player1Id']);
    await queryInterface.addIndex('games', ['player2Id']);
    await queryInterface.addIndex('games', ['winnerId']);
    await queryInterface.addIndex('games', ['matchId']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('games');
  }
};