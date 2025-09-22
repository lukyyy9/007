const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CardDefinition = sequelize.define('CardDefinition', {
  id: {
    type: DataTypes.STRING(50),
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  emoji: {
    type: DataTypes.STRING(10),
    allowNull: false
  },
  cost: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 10
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  effects: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: []
  },
  conditions: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: []
  },
  category: {
    type: DataTypes.ENUM('attack', 'defense', 'utility', 'special'),
    allowNull: false
  },
  rarity: {
    type: DataTypes.ENUM('common', 'uncommon', 'rare', 'epic'),
    defaultValue: 'common',
    allowNull: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  }
}, {
  tableName: 'card_definitions',
  timestamps: true,
  indexes: [
    {
      fields: ['category']
    },
    {
      fields: ['rarity']
    },
    {
      fields: ['isActive']
    }
  ]
});

module.exports = CardDefinition;