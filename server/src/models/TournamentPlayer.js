const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TournamentPlayer = sequelize.define('TournamentPlayer', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  tournamentId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'tournaments',
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
  status: {
    type: DataTypes.ENUM('active', 'eliminated', 'winner'),
    defaultValue: 'active',
    allowNull: false
  },
  seedPosition: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  finalRank: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  wins: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  losses: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  joinedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false
  },
  eliminatedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'tournament_players',
  timestamps: true,
  indexes: [
    {
      fields: ['tournamentId']
    },
    {
      fields: ['playerId']
    },
    {
      fields: ['status']
    },
    {
      fields: ['tournamentId', 'playerId'],
      unique: true
    }
  ]
});

module.exports = TournamentPlayer;