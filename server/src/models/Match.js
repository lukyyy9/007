const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Match = sequelize.define('Match', {
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
  winnerId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
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
    allowNull: false,
    validate: {
      min: 1,
      max: 9
    }
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
  }
}, {
  tableName: 'matches',
  timestamps: true,
  indexes: [
    {
      fields: ['status']
    },
    {
      fields: ['tournamentId']
    },
    {
      fields: ['player1Id']
    },
    {
      fields: ['player2Id']
    },
    {
      fields: ['winnerId']
    },
    {
      fields: ['matchType']
    }
  ]
});

module.exports = Match;