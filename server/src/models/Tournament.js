const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Tournament = sequelize.define('Tournament', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      len: [3, 100],
      notEmpty: true
    }
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
    allowNull: false,
    validate: {
      min: 2,
      max: 64
    }
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
    }
  },
  winnerId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
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
  }
}, {
  tableName: 'tournaments',
  timestamps: true,
  indexes: [
    {
      fields: ['status']
    },
    {
      fields: ['format']
    },
    {
      fields: ['creatorId']
    },
    {
      fields: ['winnerId']
    }
  ]
});

module.exports = Tournament;