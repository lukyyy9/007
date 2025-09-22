const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.createTable('card_definitions', {
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
        defaultValue: 0
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
    await queryInterface.addIndex('card_definitions', ['category']);
    await queryInterface.addIndex('card_definitions', ['rarity']);
    await queryInterface.addIndex('card_definitions', ['isActive']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('card_definitions');
  }
};