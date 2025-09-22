const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Game = sequelize.define('Game', {
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
    allowNull: false,
    validate: {
      min: 5,
      max: 120
    }
  },
  maxHealth: {
    type: DataTypes.INTEGER,
    defaultValue: 6,
    allowNull: false,
    validate: {
      min: 1,
      max: 20
    }
  },
  player1Id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  player2Id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
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
    }
  },
  matchId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'matches',
      key: 'id'
    }
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
  }
}, {
  tableName: 'games',
  timestamps: true,
  indexes: [
    {
      fields: ['status']
    },
    {
      fields: ['player1Id']
    },
    {
      fields: ['player2Id']
    },
    {
      fields: ['winnerId']
    }
  ]
});

module.exports = Game;