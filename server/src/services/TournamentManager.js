const { Tournament, TournamentPlayer, Match, User } = require('../models');
const { Op } = require('sequelize');

/**
 * Tournament management service for bracket generation and tournament logic
 */
class TournamentManager {
  constructor() {
    this.supportedFormats = ['single-elimination', 'double-elimination'];
  }

  /**
   * Create a new tournament
   * @param {Object} config - Tournament configuration
   * @returns {Promise<Tournament>} Created tournament
   */
  async createTournament(config) {
    const {
      name,
      format = 'single-elimination',
      maxPlayers,
      creatorId,
      gameConfig = {}
    } = config;

    if (!this.supportedFormats.includes(format)) {
      throw new Error(`Unsupported tournament format: ${format}`);
    }

    if (!this.isPowerOfTwo(maxPlayers) || maxPlayers < 4 || maxPlayers > 64) {
      throw new Error('Tournament must have a power of 2 players between 4 and 64');
    }

    const defaultGameConfig = {
      maxHealth: 6,
      turnTimeLimit: 20,
      bestOfSeries: 1
    };

    const tournament = await Tournament.create({
      name,
      format,
      maxPlayers,
      creatorId,
      status: 'waiting',
      settings: { ...defaultGameConfig, ...gameConfig },
      brackets: { winner: [], loser: [] },
      currentRound: 0
    });

    // Automatically add creator as first participant
    await TournamentPlayer.create({
      tournamentId: tournament.id,
      playerId: creatorId,
      status: 'active',
      seedPosition: 1
    });

    await tournament.update({ currentPlayers: 1 });

    return tournament;
  }

  /**
   * Add a player to a tournament
   * @param {string} tournamentId - Tournament ID
   * @param {string} playerId - Player ID
   * @returns {Promise<TournamentPlayer>} Created tournament player
   */
  async addPlayer(tournamentId, playerId) {
    const tournament = await Tournament.findByPk(tournamentId, {
      include: [{ model: TournamentPlayer }]
    });

    if (!tournament) {
      throw new Error('Tournament not found');
    }

    if (tournament.status !== 'waiting') {
      throw new Error('Tournament is not accepting new players');
    }

    // Check if player is already in tournament
    const existingPlayer = tournament.TournamentPlayers.find(tp => tp.playerId === playerId);
    if (existingPlayer) {
      throw new Error('Player already joined this tournament');
    }

    // Check if tournament is full
    if (tournament.TournamentPlayers.length >= tournament.maxPlayers) {
      throw new Error('Tournament is full');
    }

    const seedPosition = tournament.TournamentPlayers.length + 1;

    const tournamentPlayer = await TournamentPlayer.create({
      tournamentId,
      playerId,
      status: 'active',
      seedPosition
    });

    await tournament.update({ currentPlayers: tournament.TournamentPlayers.length + 1 });

    return tournamentPlayer;
  }

  /**
   * Start a tournament and generate initial brackets
   * @param {string} tournamentId - Tournament ID
   * @param {string} creatorId - Creator ID (for authorization)
   * @returns {Promise<Object>} Tournament start result with brackets
   */
  async startTournament(tournamentId, creatorId) {
    const tournament = await Tournament.findByPk(tournamentId, {
      include: [{ 
        model: TournamentPlayer, 
        include: [{ model: User, as: 'player', attributes: ['id', 'username'] }]
      }]
    });

    if (!tournament) {
      throw new Error('Tournament not found');
    }

    if (tournament.creatorId !== creatorId) {
      throw new Error('Only tournament creator can start the tournament');
    }

    if (tournament.status !== 'waiting') {
      throw new Error('Tournament cannot be started');
    }

    const playerCount = tournament.TournamentPlayers.length;
    if (playerCount < 4) {
      throw new Error('Tournament needs at least 4 players to start');
    }

    if (!this.isPowerOfTwo(playerCount)) {
      throw new Error('Tournament requires a power of 2 number of players');
    }

    // Update tournament status
    await tournament.update({
      status: 'active',
      startedAt: new Date(),
      currentRound: 1
    });

    // Generate initial brackets
    const brackets = await this.generateBrackets(tournament);

    return {
      tournament,
      brackets,
      playerCount
    };
  }

  /**
   * Generate tournament brackets based on format
   * @param {Tournament} tournament - Tournament instance with players
   * @returns {Promise<Object>} Generated brackets
   */
  async generateBrackets(tournament) {
    const players = tournament.TournamentPlayers;
    
    if (tournament.format === 'single-elimination') {
      return await this.generateSingleEliminationBrackets(tournament.id, players);
    } else if (tournament.format === 'double-elimination') {
      return await this.generateDoubleEliminationBrackets(tournament.id, players);
    }

    throw new Error(`Unsupported tournament format: ${tournament.format}`);
  }

  /**
   * Generate single elimination brackets
   * @param {string} tournamentId - Tournament ID
   * @param {Array} players - Array of tournament players
   * @returns {Promise<Object>} Single elimination brackets
   */
  async generateSingleEliminationBrackets(tournamentId, players) {
    const playerList = [...players].sort((a, b) => a.seedPosition - b.seedPosition);
    const matches = [];

    // Create first round matches
    const firstRoundMatches = playerList.length / 2;
    
    for (let i = 0; i < firstRoundMatches; i++) {
      const player1 = playerList[i];
      const player2 = playerList[playerList.length - 1 - i]; // Pair highest with lowest seed

      const match = await Match.create({
        tournamentId,
        player1Id: player1.playerId,
        player2Id: player2.playerId,
        bracketRound: 1,
        bracketPosition: i + 1,
        bracketType: 'winner',
        status: 'pending',
        matchType: 'tournament',
        bestOfSeries: 1
      });

      matches.push(match);
    }

    return {
      winner: { 1: matches },
      loser: null
    };
  }

  /**
   * Generate double elimination brackets
   * @param {string} tournamentId - Tournament ID
   * @param {Array} players - Array of tournament players
   * @returns {Promise<Object>} Double elimination brackets
   */
  async generateDoubleEliminationBrackets(tournamentId, players) {
    const playerList = [...players].sort((a, b) => a.seedPosition - b.seedPosition);
    const winnerMatches = [];

    // Create first round winner bracket matches
    const firstRoundMatches = playerList.length / 2;
    
    for (let i = 0; i < firstRoundMatches; i++) {
      const player1 = playerList[i];
      const player2 = playerList[playerList.length - 1 - i]; // Pair highest with lowest seed

      const match = await Match.create({
        tournamentId,
        player1Id: player1.playerId,
        player2Id: player2.playerId,
        bracketRound: 1,
        bracketPosition: i + 1,
        bracketType: 'winner',
        status: 'pending',
        matchType: 'tournament',
        bestOfSeries: 1
      });

      winnerMatches.push(match);
    }

    return {
      winner: { 1: winnerMatches },
      loser: {} // Loser bracket will be populated as players are eliminated
    };
  }

  /**
   * Process match result and advance tournament
   * @param {string} matchId - Match ID
   * @param {string} winnerId - Winner player ID
   * @returns {Promise<Object>} Match result processing outcome
   */
  async processMatchResult(matchId, winnerId) {
    const match = await Match.findByPk(matchId, {
      include: [{ model: Tournament }]
    });

    if (!match) {
      throw new Error('Match not found');
    }

    if (match.status !== 'active') {
      throw new Error('Match is not active');
    }

    if (winnerId !== match.player1Id && winnerId !== match.player2Id) {
      throw new Error('Winner must be one of the match participants');
    }

    const loserId = winnerId === match.player1Id ? match.player2Id : match.player1Id;

    // Update match with result
    await match.update({
      winnerId,
      status: 'completed',
      completedAt: new Date()
    });

    const tournament = match.Tournament;

    // Handle elimination and advancement based on tournament format
    if (tournament.format === 'single-elimination') {
      await this.handleSingleEliminationAdvancement(tournament, match, winnerId, loserId);
    } else if (tournament.format === 'double-elimination') {
      await this.handleDoubleEliminationAdvancement(tournament, match, winnerId, loserId);
    }

    return {
      matchId,
      winnerId,
      loserId,
      tournamentId: tournament.id
    };
  }

  /**
   * Handle single elimination advancement
   * @param {Tournament} tournament - Tournament instance
   * @param {Match} completedMatch - Completed match
   * @param {string} winnerId - Winner ID
   * @param {string} loserId - Loser ID
   */
  async handleSingleEliminationAdvancement(tournament, completedMatch, winnerId, loserId) {
    // Eliminate loser
    await TournamentPlayer.update(
      { 
        status: 'eliminated',
        eliminatedAt: new Date()
      },
      { 
        where: { 
          tournamentId: tournament.id,
          playerId: loserId
        }
      }
    );

    // Check if round is complete
    const currentRoundMatches = await Match.findAll({
      where: {
        tournamentId: tournament.id,
        bracketRound: tournament.currentRound,
        bracketType: 'winner'
      }
    });

    const completedMatches = currentRoundMatches.filter(m => m.status === 'completed');

    if (completedMatches.length === currentRoundMatches.length) {
      // Round complete, check if tournament is finished
      const winners = completedMatches.map(m => m.winnerId);

      if (winners.length === 1) {
        // Tournament complete
        await this.completeTournament(tournament.id, winners[0]);
      } else {
        // Create next round
        await this.createNextRound(tournament, winners, 'winner');
      }
    }
  }

  /**
   * Handle double elimination advancement
   * @param {Tournament} tournament - Tournament instance
   * @param {Match} completedMatch - Completed match
   * @param {string} winnerId - Winner ID
   * @param {string} loserId - Loser ID
   */
  async handleDoubleEliminationAdvancement(tournament, completedMatch, winnerId, loserId) {
    const loserPlayer = await TournamentPlayer.findOne({
      where: {
        tournamentId: tournament.id,
        playerId: loserId
      }
    });

    if (completedMatch.bracketType === 'winner') {
      // Loser drops to loser bracket
      if (loserPlayer.losses === 0) {
        // First loss, move to loser bracket
        await loserPlayer.update({ losses: 1 });
        await this.moveToLoserBracket(tournament, loserId, completedMatch.round);
      } else {
        // Second loss, eliminate
        await loserPlayer.update({ 
          status: 'eliminated',
          eliminatedAt: new Date(),
          losses: 2
        });
      }
    } else {
      // Loser bracket match - eliminate loser
      await loserPlayer.update({ 
        status: 'eliminated',
        eliminatedAt: new Date(),
        losses: 2
      });
    }

    // Check round completion and advance
    await this.checkDoubleEliminationRoundCompletion(tournament);
  }

  /**
   * Move player to loser bracket
   * @param {Tournament} tournament - Tournament instance
   * @param {string} playerId - Player ID to move
   * @param {number} winnerRound - Round they lost in winner bracket
   */
  async moveToLoserBracket(tournament, playerId, winnerRound) {
    // Calculate appropriate loser bracket round
    const loserRound = this.calculateLoserBracketRound(winnerRound, tournament.maxPlayers);
    
    // Find or create loser bracket match for this player
    // This is a simplified implementation - full double elimination bracket logic is complex
    // For now, we'll create placeholder matches that will be properly paired later
    const existingLoserMatch = await Match.findOne({
      where: {
        tournamentId: tournament.id,
        bracketType: 'loser',
        bracketRound: loserRound,
        [Op.or]: [
          { player1Id: null },
          { player2Id: null }
        ]
      }
    });

    if (existingLoserMatch) {
      // Add to existing match
      if (!existingLoserMatch.player1Id) {
        await existingLoserMatch.update({ player1Id: playerId });
      } else if (!existingLoserMatch.player2Id) {
        await existingLoserMatch.update({ player2Id: playerId });
      }
    } else {
      // Create new loser bracket match
      await Match.create({
        tournamentId: tournament.id,
        player1Id: playerId,
        player2Id: null, // Will be filled when another player drops
        bracketRound: loserRound,
        bracketPosition: 1, // Simplified positioning
        bracketType: 'loser',
        status: 'pending',
        matchType: 'tournament',
        bestOfSeries: 1
      });
    }
  }

  /**
   * Check double elimination round completion and advance
   * @param {Tournament} tournament - Tournament instance
   */
  async checkDoubleEliminationRoundCompletion(tournament) {
    // This is a simplified implementation
    // Full double elimination logic requires complex bracket management
    
    const winnerBracketMatches = await Match.findAll({
      where: {
        tournamentId: tournament.id,
        bracketRound: tournament.currentRound,
        bracketType: 'winner'
      }
    });

    const completedWinnerMatches = winnerBracketMatches.filter(m => m.status === 'completed');

    if (completedWinnerMatches.length === winnerBracketMatches.length && winnerBracketMatches.length > 0) {
      const winners = completedWinnerMatches.map(m => m.winnerId);

      if (winners.length === 1) {
        // Check if loser bracket is also complete
        const loserBracketWinner = await this.getLoserBracketWinner(tournament.id);
        
        if (loserBracketWinner) {
          // Create grand final
          await this.createGrandFinal(tournament, winners[0], loserBracketWinner);
        } else {
          // Winner bracket champion wins tournament (no one left in loser bracket)
          await this.completeTournament(tournament.id, winners[0]);
        }
      } else {
        // Create next winner bracket round
        await this.createNextRound(tournament, winners, 'winner');
      }
    }
  }

  /**
   * Get loser bracket winner
   * @param {string} tournamentId - Tournament ID
   * @returns {Promise<string|null>} Loser bracket winner ID or null
   */
  async getLoserBracketWinner(tournamentId) {
    const activePlayers = await TournamentPlayer.findAll({
      where: {
        tournamentId,
        status: 'active',
        losses: 1
      }
    });

    return activePlayers.length === 1 ? activePlayers[0].playerId : null;
  }

  /**
   * Create grand final match for double elimination
   * @param {Tournament} tournament - Tournament instance
   * @param {string} winnerBracketChampion - Winner bracket champion ID
   * @param {string} loserBracketChampion - Loser bracket champion ID
   */
  async createGrandFinal(tournament, winnerBracketChampion, loserBracketChampion) {
    const nextRound = tournament.currentRound + 1;

    await Match.create({
      tournamentId: tournament.id,
      player1Id: winnerBracketChampion,
      player2Id: loserBracketChampion,
      bracketRound: nextRound,
      bracketPosition: 1,
      bracketType: 'winner', // Grand final is considered winner bracket
      status: 'pending',
      matchType: 'tournament',
      bestOfSeries: 1
    });

    await tournament.update({ currentRound: nextRound });
  }

  /**
   * Create next round matches
   * @param {Tournament} tournament - Tournament instance
   * @param {Array} winners - Array of winner IDs
   * @param {string} bracketType - 'winner' or 'loser'
   */
  async createNextRound(tournament, winners, bracketType) {
    const nextRound = tournament.currentRound + 1;
    const nextRoundMatches = winners.length / 2;

    for (let i = 0; i < nextRoundMatches; i++) {
      const player1Id = winners[i * 2];
      const player2Id = winners[i * 2 + 1];

      await Match.create({
        tournamentId: tournament.id,
        player1Id,
        player2Id,
        bracketRound: nextRound,
        bracketPosition: i + 1,
        bracketType,
        status: 'pending',
        matchType: 'tournament',
        bestOfSeries: 1
      });
    }

    await tournament.update({ currentRound: nextRound });
  }

  /**
   * Complete tournament
   * @param {string} tournamentId - Tournament ID
   * @param {string} winnerId - Tournament winner ID
   */
  async completeTournament(tournamentId, winnerId) {
    await Tournament.update(
      {
        status: 'completed',
        winnerId,
        completedAt: new Date()
      },
      { where: { id: tournamentId } }
    );

    // Update winner status
    await TournamentPlayer.update(
      { status: 'winner' },
      { 
        where: { 
          tournamentId,
          playerId: winnerId
        }
      }
    );

    // Calculate final rankings
    await this.calculateFinalRankings(tournamentId);
  }

  /**
   * Calculate final tournament rankings
   * @param {string} tournamentId - Tournament ID
   * @returns {Promise<Array>} Final rankings
   */
  async calculateFinalRankings(tournamentId) {
    const tournament = await Tournament.findByPk(tournamentId);
    const players = await TournamentPlayer.findAll({
      where: { tournamentId },
      include: [{ model: User, as: 'player', attributes: ['id', 'username'] }]
    });

    // Sort players by elimination order and wins
    const rankings = players.sort((a, b) => {
      // Winner first
      if (a.status === 'winner') return -1;
      if (b.status === 'winner') return 1;

      // Then by elimination time (later elimination = higher rank)
      if (a.eliminatedAt && b.eliminatedAt) {
        return new Date(b.eliminatedAt) - new Date(a.eliminatedAt);
      }
      if (a.eliminatedAt) return 1;
      if (b.eliminatedAt) return -1;

      // Then by wins
      return b.wins - a.wins;
    });

    // Update final ranks
    for (let i = 0; i < rankings.length; i++) {
      await rankings[i].update({ finalRank: i + 1 });
    }

    return rankings.map((player, index) => ({
      rank: index + 1,
      player: player.player,
      status: player.status,
      wins: player.wins,
      losses: player.losses,
      eliminatedAt: player.eliminatedAt
    }));
  }

  /**
   * Get tournament brackets
   * @param {string} tournamentId - Tournament ID
   * @returns {Promise<Object>} Tournament brackets
   */
  async getBrackets(tournamentId) {
    const tournament = await Tournament.findByPk(tournamentId);
    if (!tournament) {
      throw new Error('Tournament not found');
    }

    const matches = await Match.findAll({
      where: { tournamentId },
      include: [
        { model: User, as: 'player1', attributes: ['id', 'username'] },
        { model: User, as: 'player2', attributes: ['id', 'username'] },
        { model: User, as: 'winner', attributes: ['id', 'username'] }
      ],
      order: [['bracketRound', 'ASC'], ['bracketPosition', 'ASC']]
    });

    return this.formatBrackets(matches, tournament.format);
  }

  /**
   * Format brackets for client consumption
   * @param {Array} matches - Array of matches
   * @param {string} format - Tournament format
   * @returns {Object} Formatted brackets
   */
  formatBrackets(matches, format) {
    const brackets = {
      winner: {},
      loser: format === 'double-elimination' ? {} : null
    };

    matches.forEach(match => {
      const bracketType = match.bracketType || 'winner';
      if (!brackets[bracketType]) {
        brackets[bracketType] = {};
      }
      if (!brackets[bracketType][match.bracketRound]) {
        brackets[bracketType][match.bracketRound] = [];
      }
      
      brackets[bracketType][match.bracketRound].push({
        id: match.id,
        player1: match.player1,
        player2: match.player2,
        winner: match.winner,
        status: match.status,
        position: match.bracketPosition,
        round: match.bracketRound
      });
    });

    return brackets;
  }

  /**
   * Calculate loser bracket round for double elimination
   * @param {number} winnerRound - Round lost in winner bracket
   * @param {number} totalPlayers - Total number of players
   * @returns {number} Loser bracket round
   */
  calculateLoserBracketRound(winnerRound, totalPlayers) {
    // Simplified calculation - in reality this is more complex
    return winnerRound;
  }

  /**
   * Check if a number is a power of 2
   * @param {number} n - Number to check
   * @returns {boolean} True if power of 2
   */
  isPowerOfTwo(n) {
    return n > 0 && (n & (n - 1)) === 0;
  }

  /**
   * Get tournament status and progress
   * @param {string} tournamentId - Tournament ID
   * @returns {Promise<Object>} Tournament status
   */
  async getTournamentStatus(tournamentId) {
    const tournament = await Tournament.findByPk(tournamentId, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'username'] },
        { model: User, as: 'winner', attributes: ['id', 'username'] },
        { 
          model: TournamentPlayer, 
          include: [{ model: User, as: 'player', attributes: ['id', 'username'] }]
        }
      ]
    });

    if (!tournament) {
      throw new Error('Tournament not found');
    }

    const activePlayers = tournament.TournamentPlayers.filter(tp => tp.status === 'active').length;
    const eliminatedPlayers = tournament.TournamentPlayers.filter(tp => tp.status === 'eliminated').length;

    return {
      id: tournament.id,
      name: tournament.name,
      format: tournament.format,
      status: tournament.status,
      currentRound: tournament.currentRound,
      maxPlayers: tournament.maxPlayers,
      currentPlayers: tournament.currentPlayers,
      activePlayers,
      eliminatedPlayers,
      creator: tournament.creator,
      winner: tournament.winner,
      players: tournament.TournamentPlayers.map(tp => ({
        id: tp.player.id,
        username: tp.player.username,
        status: tp.status,
        seedPosition: tp.seedPosition,
        finalRank: tp.finalRank,
        wins: tp.wins,
        losses: tp.losses,
        joinedAt: tp.joinedAt,
        eliminatedAt: tp.eliminatedAt
      })),
      settings: tournament.settings,
      createdAt: tournament.createdAt,
      startedAt: tournament.startedAt,
      completedAt: tournament.completedAt
    };
  }
}

module.exports = TournamentManager;