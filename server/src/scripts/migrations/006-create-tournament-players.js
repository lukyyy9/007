const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.createTable('tournament_players', {
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
    await queryInterface.addIndex('tournament_players', ['tournamentId']);
    await queryInterface.addIndex('tournament_players', ['playerId']);
    await queryInterface.addIndex('tournament_players', ['status']);
    await queryInterface.addIndex('tournament_players', ['tournamentId', 'playerId'], { unique: true });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('tournament_players');
  }
};