// Models index file
const sequelize = require('../config/database');

// Import models
const User = require('./User');
const Game = require('./Game');
const Tournament = require('./Tournament');
const Match = require('./Match');
const GameAction = require('./GameAction');
const TournamentPlayer = require('./TournamentPlayer');
const CardDefinition = require('./CardDefinition');

// Define associations

// User associations
User.hasMany(Game, { as: 'player1Games', foreignKey: 'player1Id' });
User.hasMany(Game, { as: 'player2Games', foreignKey: 'player2Id' });
User.hasMany(Game, { as: 'wonGames', foreignKey: 'winnerId' });
User.hasMany(Tournament, { as: 'createdTournaments', foreignKey: 'creatorId' });
User.hasMany(Tournament, { as: 'wonTournaments', foreignKey: 'winnerId' });
User.hasMany(Match, { as: 'player1Matches', foreignKey: 'player1Id' });
User.hasMany(Match, { as: 'player2Matches', foreignKey: 'player2Id' });
User.hasMany(Match, { as: 'wonMatches', foreignKey: 'winnerId' });
User.hasMany(GameAction, { foreignKey: 'playerId' });
User.hasMany(TournamentPlayer, { foreignKey: 'playerId' });

// Game associations
Game.belongsTo(User, { as: 'player1', foreignKey: 'player1Id' });
Game.belongsTo(User, { as: 'player2', foreignKey: 'player2Id' });
Game.belongsTo(User, { as: 'winner', foreignKey: 'winnerId' });
Game.hasMany(GameAction, { foreignKey: 'gameId' });
Game.belongsTo(Match, { foreignKey: 'matchId' });

// Tournament associations
Tournament.belongsTo(User, { as: 'creator', foreignKey: 'creatorId' });
Tournament.belongsTo(User, { as: 'winner', foreignKey: 'winnerId' });
Tournament.hasMany(Match, { foreignKey: 'tournamentId' });
Tournament.hasMany(TournamentPlayer, { foreignKey: 'tournamentId' });

// Match associations
Match.belongsTo(Tournament, { foreignKey: 'tournamentId' });
Match.belongsTo(User, { as: 'player1', foreignKey: 'player1Id' });
Match.belongsTo(User, { as: 'player2', foreignKey: 'player2Id' });
Match.belongsTo(User, { as: 'winner', foreignKey: 'winnerId' });
Match.hasMany(Game, { foreignKey: 'matchId' });

// GameAction associations
GameAction.belongsTo(Game, { foreignKey: 'gameId' });
GameAction.belongsTo(User, { as: 'player', foreignKey: 'playerId' });

// TournamentPlayer associations
TournamentPlayer.belongsTo(Tournament, { foreignKey: 'tournamentId' });
TournamentPlayer.belongsTo(User, { as: 'player', foreignKey: 'playerId' });

const db = {
  sequelize,
  Sequelize: require('sequelize'),
  User,
  Game,
  Tournament,
  Match,
  GameAction,
  TournamentPlayer,
  CardDefinition
};

module.exports = db;