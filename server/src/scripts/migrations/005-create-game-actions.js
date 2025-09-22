const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.createTable('game_actions', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      gameId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'games',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      playerId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      turn: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      step: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      actionType: {
        type: DataTypes.ENUM(
          'card_selection',
          'card_play',
          'damage_dealt',
          'damage_received',
          'healing',
          'charge_gain',
          'charge_loss',
          'status_applied',
          'status_removed',
          'turn_timeout',
          'game_end'
        ),
        allowNull: false
      },
      cardPlayed: {
        type: DataTypes.STRING(50),
        allowNull: true
      },
      cardsSelected: {
        type: DataTypes.JSONB,
        allowNull: true
      },
      actionData: {
        type: DataTypes.JSONB,
        defaultValue: {},
        allowNull: false
      },
      playerHealthBefore: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      playerHealthAfter: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      playerChargesBefore: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      playerChargesAfter: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      opponentHealthBefore: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      opponentHealthAfter: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      opponentChargesBefore: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      opponentChargesAfter: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      statusEffectsApplied: {
        type: DataTypes.JSONB,
        defaultValue: [],
        allowNull: false
      },
      statusEffectsRemoved: {
        type: DataTypes.JSONB,
        defaultValue: [],
        allowNull: false
      },
      timestamp: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false
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
    await queryInterface.addIndex('game_actions', ['gameId']);
    await queryInterface.addIndex('game_actions', ['playerId']);
    await queryInterface.addIndex('game_actions', ['turn']);
    await queryInterface.addIndex('game_actions', ['actionType']);
    await queryInterface.addIndex('game_actions', ['timestamp']);
    await queryInterface.addIndex('game_actions', ['gameId', 'turn', 'step']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('game_actions');
  }
};