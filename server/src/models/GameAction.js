const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const GameAction = sequelize.define('GameAction', {
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
    }
  },
  playerId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  turn: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  step: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 3
    }
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
  }
}, {
  tableName: 'game_actions',
  timestamps: true,
  indexes: [
    {
      fields: ['gameId']
    },
    {
      fields: ['playerId']
    },
    {
      fields: ['turn']
    },
    {
      fields: ['actionType']
    },
    {
      fields: ['timestamp']
    },
    {
      fields: ['gameId', 'turn', 'step']
    }
  ]
});

module.exports = GameAction;