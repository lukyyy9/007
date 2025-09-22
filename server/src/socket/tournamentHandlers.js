const { Tournament, TournamentPlayer, Match, User } = require('../models');

/**
 * Tournament-related Socket.IO event handlers
 */
class TournamentHandlers {
  constructor(io) {
    this.io = io;
    this.tournamentRooms = new Map(); // tournamentId -> Set of socketIds
  }

  /**
   * Register all tournament-related socket event handlers
   * @param {Socket} socket - Socket.IO socket instance
   * @param {Map} connectedUsers - Map of socketId -> userId
   */
  registerHandlers(socket, connectedUsers) {
    this.connectedUsers = connectedUsers;

    // Tournament events
    socket.on('tournament:join', (data) => this.handleTournamentJoin(socket, data));
    socket.on('tournament:leave', (data) => this.handleTournamentLeave(socket, data));
    socket.on('tournament:get-brackets', (data) => this.handleGetBrackets(socket, data));
    socket.on('tournament:get-status', (data) => this.handleGetStatus(socket, data));
    socket.on('tournament:start', (data) => this.handleTournamentStart(socket, data));
  }

  /**
   * Handle joining a tournament room for real-time updates
   */
  async handleTournamentJoin(socket, data) {
    try {
      const { tournamentId } = data;
      const userId = this.connectedUsers.get(socket.id);

      if (!userId) {
        socket.emit('tournament:error', { error: 'Not authenticated' });
        return;
      }

      // Check if tournament exists
      const tournament = await Tournament.findByPk(tournamentId, {
        include: [
          { model: User, as: 'creator', attributes: ['id', 'username'] },
          { 
            model: TournamentPlayer, 
            include: [{ model: User, as: 'player', attributes: ['id', 'username'] }]
          }
        ]
      });

      if (!tournament) {
        socket.emit('tournament:error', { error: 'Tournament not found' });
        return;
      }

      // Join socket room
      socket.join(`tournament:${tournamentId}`);
      
      // Track tournament room
      if (!this.tournamentRooms.has(tournamentId)) {
        this.tournamentRooms.set(tournamentId, new Set());
      }
      this.tournamentRooms.get(tournamentId).add(socket.id);

      // Send current tournament state
      socket.emit('tournament:joined', { 
        tournamentId, 
        tournament: this.formatTournamentData(tournament)
      });
      
      // Notify other participants
      this.broadcastToTournament(tournamentId, 'tournament:player-connected', { userId }, socket.id);

      console.log(`User ${userId} joined tournament room ${tournamentId}`);
    } catch (error) {
      console.error('Tournament join error:', error);
      socket.emit('tournament:error', { error: 'Failed to join tournament' });
    }
  }

  /**
   * Handle leaving a tournament room
   */
  async handleTournamentLeave(socket, data) {
    try {
      const { tournamentId } = data;
      const userId = this.connectedUsers.get(socket.id);

      if (!userId) {
        socket.emit('tournament:error', { error: 'Not authenticated' });
        return;
      }

      // Leave socket room
      socket.leave(`tournament:${tournamentId}`);
      
      // Remove from tournament room tracking
      const tournamentRoom = this.tournamentRooms.get(tournamentId);
      if (tournamentRoom) {
        tournamentRoom.delete(socket.id);
        if (tournamentRoom.size === 0) {
          this.tournamentRooms.delete(tournamentId);
        }
      }

      socket.emit('tournament:left', { tournamentId });
      
      // Notify other participants
      this.broadcastToTournament(tournamentId, 'tournament:player-disconnected', { userId }, socket.id);

      console.log(`User ${userId} left tournament room ${tournamentId}`);
    } catch (error) {
      console.error('Tournament leave error:', error);
      socket.emit('tournament:error', { error: 'Failed to leave tournament' });
    }
  }

  /**
   * Handle getting tournament brackets
   */
  async handleGetBrackets(socket, data) {
    try {
      const { tournamentId } = data;
      const userId = this.connectedUsers.get(socket.id);

      if (!userId) {
        socket.emit('tournament:error', { error: 'Not authenticated' });
        return;
      }

      const tournament = await Tournament.findByPk(tournamentId);
      if (!tournament) {
        socket.emit('tournament:error', { error: 'Tournament not found' });
        return;
      }

      const matches = await Match.findAll({
        where: { tournamentId },
        include: [
          { model: User, as: 'player1', attributes: ['id', 'username'] },
          { model: User, as: 'player2', attributes: ['id', 'username'] },
          { model: User, as: 'winner', attributes: ['id', 'username'] }
        ],
        order: [['round', 'ASC'], ['position', 'ASC']]
      });

      const brackets = this.formatBrackets(matches, tournament.format);

      socket.emit('tournament:brackets-update', {
        tournamentId,
        brackets,
        currentRound: tournament.currentRound,
        status: tournament.status
      });
    } catch (error) {
      console.error('Get brackets error:', error);
      socket.emit('tournament:error', { error: 'Failed to get brackets' });
    }
  }

  /**
   * Handle getting tournament status
   */
  async handleGetStatus(socket, data) {
    try {
      const { tournamentId } = data;
      const userId = this.connectedUsers.get(socket.id);

      if (!userId) {
        socket.emit('tournament:error', { error: 'Not authenticated' });
        return;
      }

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
        socket.emit('tournament:error', { error: 'Tournament not found' });
        return;
      }

      socket.emit('tournament:status-update', {
        tournament: this.formatTournamentData(tournament)
      });
    } catch (error) {
      console.error('Get tournament status error:', error);
      socket.emit('tournament:error', { error: 'Failed to get tournament status' });
    }
  }

  /**
   * Handle tournament start (only creator can start)
   */
  async handleTournamentStart(socket, data) {
    try {
      const { tournamentId } = data;
      const userId = this.connectedUsers.get(socket.id);

      if (!userId) {
        socket.emit('tournament:error', { error: 'Not authenticated' });
        return;
      }

      const tournament = await Tournament.findByPk(tournamentId, {
        include: [
          { 
            model: TournamentPlayer, 
            include: [{ model: User, as: 'player', attributes: ['id', 'username'] }]
          }
        ]
      });

      if (!tournament) {
        socket.emit('tournament:error', { error: 'Tournament not found' });
        return;
      }

      if (tournament.creatorId !== userId) {
        socket.emit('tournament:error', { error: 'Only tournament creator can start the tournament' });
        return;
      }

      if (tournament.status !== 'waiting') {
        socket.emit('tournament:error', { error: 'Tournament cannot be started' });
        return;
      }

      const playerCount = tournament.TournamentPlayers.length;
      if (playerCount < 4) {
        socket.emit('tournament:error', { error: 'Tournament needs at least 4 players to start' });
        return;
      }

      // Check if player count is a power of 2
      if ((playerCount & (playerCount - 1)) !== 0) {
        socket.emit('tournament:error', { error: 'Tournament requires a power of 2 number of players' });
        return;
      }

      // Start tournament
      await tournament.update({
        status: 'active',
        startedAt: new Date(),
        currentRound: 1
      });

      // Generate initial brackets
      const brackets = await this.generateInitialBrackets(tournamentId, tournament.TournamentPlayers, tournament.format);

      // Broadcast tournament start to all participants
      this.broadcastToTournament(tournamentId, 'tournament:started', {
        tournamentId,
        brackets,
        playerCount
      });

      console.log(`Tournament ${tournamentId} started by user ${userId}`);
    } catch (error) {
      console.error('Tournament start error:', error);
      socket.emit('tournament:error', { error: 'Failed to start tournament' });
    }
  }

  /**
   * Handle match completion and bracket advancement
   */
  async handleMatchComplete(matchId, winnerId) {
    try {
      const match = await Match.findByPk(matchId, {
        include: [{ model: Tournament }]
      });

      if (!match) {
        console.error('Match not found:', matchId);
        return;
      }

      const tournamentId = match.tournamentId;
      
      // Update match with winner
      await match.update({
        winnerId,
        status: 'completed',
        completedAt: new Date()
      });

      // Check if this completes a round
      const tournament = await Tournament.findByPk(tournamentId);
      const roundMatches = await Match.findAll({
        where: {
          tournamentId,
          round: tournament.currentRound,
          bracketType: 'winner'
        }
      });

      const completedMatches = roundMatches.filter(m => m.status === 'completed');
      
      if (completedMatches.length === roundMatches.length) {
        // Round completed, advance to next round or end tournament
        await this.advanceToNextRound(tournamentId);
      }

      // Broadcast match result
      this.broadcastToTournament(tournamentId, 'tournament:match-completed', {
        matchId,
        winnerId,
        tournamentId
      });

      // Get updated brackets
      const matches = await Match.findAll({
        where: { tournamentId },
        include: [
          { model: User, as: 'player1', attributes: ['id', 'username'] },
          { model: User, as: 'player2', attributes: ['id', 'username'] },
          { model: User, as: 'winner', attributes: ['id', 'username'] }
        ],
        order: [['round', 'ASC'], ['position', 'ASC']]
      });

      const brackets = this.formatBrackets(matches, tournament.format);

      this.broadcastToTournament(tournamentId, 'tournament:brackets-update', {
        tournamentId,
        brackets,
        currentRound: tournament.currentRound
      });

    } catch (error) {
      console.error('Match completion error:', error);
    }
  }

  /**
   * Generate initial tournament brackets
   */
  async generateInitialBrackets(tournamentId, players, format) {
    const playerList = [...players];
    
    // Shuffle players for random seeding
    for (let i = playerList.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [playerList[i], playerList[j]] = [playerList[j], playerList[i]];
    }

    const matches = [];
    const firstRoundMatches = playerList.length / 2;

    // Create first round matches
    for (let i = 0; i < firstRoundMatches; i++) {
      const player1 = playerList[i * 2];
      const player2 = playerList[i * 2 + 1];

      const match = await Match.create({
        tournamentId,
        player1Id: player1.playerId,
        player2Id: player2.playerId,
        round: 1,
        position: i + 1,
        bracketType: 'winner',
        status: 'pending'
      });

      matches.push(match);
    }

    return this.formatBrackets(matches, format);
  }

  /**
   * Advance tournament to next round
   */
  async advanceToNextRound(tournamentId) {
    const tournament = await Tournament.findByPk(tournamentId);
    const currentRound = tournament.currentRound;

    // Get winners from current round
    const currentRoundMatches = await Match.findAll({
      where: {
        tournamentId,
        round: currentRound,
        bracketType: 'winner',
        status: 'completed'
      }
    });

    const winners = currentRoundMatches.map(match => match.winnerId);

    if (winners.length === 1) {
      // Tournament complete
      await tournament.update({
        status: 'completed',
        winnerId: winners[0],
        completedAt: new Date()
      });

      this.broadcastToTournament(tournamentId, 'tournament:completed', {
        tournamentId,
        winnerId: winners[0]
      });

      return;
    }

    // Create next round matches
    const nextRound = currentRound + 1;
    const nextRoundMatches = winners.length / 2;

    for (let i = 0; i < nextRoundMatches; i++) {
      const player1Id = winners[i * 2];
      const player2Id = winners[i * 2 + 1];

      await Match.create({
        tournamentId,
        player1Id,
        player2Id,
        round: nextRound,
        position: i + 1,
        bracketType: 'winner',
        status: 'pending'
      });
    }

    // Update tournament round
    await tournament.update({ currentRound: nextRound });

    this.broadcastToTournament(tournamentId, 'tournament:round-advanced', {
      tournamentId,
      newRound: nextRound
    });
  }

  /**
   * Format brackets for client consumption
   */
  formatBrackets(matches, format) {
    const brackets = {
      winner: {},
      loser: format === 'double-elimination' ? {} : null
    };

    matches.forEach(match => {
      const bracketType = match.bracketType || 'winner';
      if (!brackets[bracketType][match.round]) {
        brackets[bracketType][match.round] = [];
      }
      brackets[bracketType][match.round].push({
        id: match.id,
        player1: match.player1,
        player2: match.player2,
        winner: match.winner,
        status: match.status,
        position: match.position
      });
    });

    return brackets;
  }

  /**
   * Format tournament data for client
   */
  formatTournamentData(tournament) {
    return {
      id: tournament.id,
      name: tournament.name,
      format: tournament.format,
      maxPlayers: tournament.maxPlayers,
      status: tournament.status,
      currentRound: tournament.currentRound,
      gameConfig: tournament.gameConfig,
      creator: tournament.creator,
      winner: tournament.winner,
      players: tournament.TournamentPlayers?.map(tp => ({
        id: tp.player.id,
        username: tp.player.username,
        status: tp.status,
        joinedAt: tp.joinedAt
      })) || [],
      createdAt: tournament.createdAt,
      startedAt: tournament.startedAt,
      completedAt: tournament.completedAt
    };
  }

  /**
   * Broadcast message to all participants in a tournament
   */
  broadcastToTournament(tournamentId, event, data, excludeSocketId = null) {
    const tournamentRoom = this.tournamentRooms.get(tournamentId);
    if (!tournamentRoom) return;

    for (const socketId of tournamentRoom) {
      if (socketId !== excludeSocketId) {
        const socket = this.io.sockets.sockets.get(socketId);
        if (socket) {
          socket.emit(event, data);
        }
      }
    }
  }

  /**
   * Clean up tournament room when socket disconnects
   */
  handleSocketDisconnect(socketId) {
    for (const [tournamentId, socketSet] of this.tournamentRooms.entries()) {
      if (socketSet.has(socketId)) {
        socketSet.delete(socketId);
        if (socketSet.size === 0) {
          this.tournamentRooms.delete(tournamentId);
        }
      }
    }
  }
}

module.exports = TournamentHandlers;