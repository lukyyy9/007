const { Game, User, GameAction } = require('../models');
const GameEngine = require('../services/GameEngine');

// Create a single instance of GameEngine to manage all games
const gameEngine = new GameEngine();

/**
 * Game-related Socket.IO event handlers
 */
class GameHandlers {
  constructor(io) {
    this.io = io;
    this.connectedUsers = new Map(); // socketId -> userId mapping
    this.userSockets = new Map(); // userId -> Set of socketIds
    this.gameRooms = new Map(); // gameId -> Set of socketIds
  }

  /**
   * Register all game-related socket event handlers
   * @param {Socket} socket - Socket.IO socket instance
   */
  registerHandlers(socket) {
    // Connection management
    socket.on('disconnect', () => this.handleDisconnect(socket));

    // Game events
    socket.on('game:join', (data) => this.handleGameJoin(socket, data));
    socket.on('game:leave', (data) => this.handleGameLeave(socket, data));
    socket.on('game:select-cards', (data) => this.handleCardSelection(socket, data));
    socket.on('game:get-state', (data) => this.handleGetGameState(socket, data));
    socket.on('game:forfeit', (data) => this.handleGameForfeit(socket, data));
    socket.on('game:start', (data) => this.handleGameStart(socket, data));
    socket.on('game:update-settings', (data) => this.handleUpdateSettings(socket, data));
    socket.on('game:player-ready', (data) => this.handlePlayerReady(socket, data));

    // Real-time game updates
    socket.on('game:request-sync', (data) => this.handleRequestSync(socket, data));
  }



  /**
   * Handle socket disconnection
   */
  handleDisconnect(socket) {
    const userId = socket.userId || this.connectedUsers.get(socket.id);
    
    if (userId) {
      // Remove from user sockets
      const userSocketSet = this.userSockets.get(userId);
      if (userSocketSet) {
        userSocketSet.delete(socket.id);
        if (userSocketSet.size === 0) {
          this.userSockets.delete(userId);
        }
      }

      // Remove from game rooms
      for (const [gameId, socketSet] of this.gameRooms.entries()) {
        if (socketSet.has(socket.id)) {
          socketSet.delete(socket.id);
          if (socketSet.size === 0) {
            this.gameRooms.delete(gameId);
          }
          
          // Notify other players in the game about disconnection
          this.broadcastToGame(gameId, 'game:player-disconnected', { userId }, socket.id);
        }
      }

      this.connectedUsers.delete(socket.id);
      console.log(`User ${userId} disconnected from socket ${socket.id}`);
    }
  }

  /**
   * Handle joining a game room
   */
  async handleGameJoin(socket, data) {
    try {
      const { gameId } = data;
      const userId = socket.userId || this.connectedUsers.get(socket.id);

      if (!userId || !socket.authenticated) {
        socket.emit('game:error', { error: 'Not authenticated' });
        return;
      }

      // Check if game exists in database
      const dbGame = await Game.findByPk(gameId, {
        include: [
          { model: User, as: 'player1', attributes: ['id', 'username'] },
          { model: User, as: 'player2', attributes: ['id', 'username'] }
        ]
      });

      if (!dbGame) {
        socket.emit('game:error', { error: 'Game not found' });
        return;
      }

      // Check if user is part of this game
      if (dbGame.player1Id !== userId && dbGame.player2Id !== userId) {
        socket.emit('game:error', { error: 'Access denied' });
        return;
      }

      // Join socket room
      socket.join(`game:${gameId}`);
      
      // Track game room
      if (!this.gameRooms.has(gameId)) {
        this.gameRooms.set(gameId, new Set());
      }
      this.gameRooms.get(gameId).add(socket.id);

      // Initialize game in engine if not exists and game is active
      if (dbGame.status === 'active' && !gameEngine.activeGames.has(gameId)) {
        const gameConfig = dbGame.gameConfig || {};
        const engineGame = gameEngine.createGame(gameConfig);
        engineGame.id = gameId;
        
        // Add players to engine
        if (dbGame.player1) {
          gameEngine.addPlayer(gameId, {
            id: dbGame.player1.id,
            username: dbGame.player1.username
          });
        }
        if (dbGame.player2) {
          gameEngine.addPlayer(gameId, {
            id: dbGame.player2.id,
            username: dbGame.player2.username
          });
        }

        // Sync state from database
        this.syncGameStateFromDB(gameId, dbGame);
      }

      // Send current game state
      const gameState = dbGame.status === 'active' && gameEngine.activeGames.has(gameId) 
        ? gameEngine.getGameState(gameId)
        : this.convertDBGameToState(dbGame);

      socket.emit('game:joined', { gameId, gameState });
      
      // Notify other players
      this.broadcastToGame(gameId, 'game:player-joined', { userId }, socket.id);

      console.log(`User ${userId} joined game ${gameId}`);
    } catch (error) {
      console.error('Game join error:', error);
      socket.emit('game:error', { error: 'Failed to join game' });
    }
  }

  /**
   * Handle leaving a game room
   */
  async handleGameLeave(socket, data) {
    try {
      const { gameId } = data;
      const userId = socket.userId || this.connectedUsers.get(socket.id);

      if (!userId || !socket.authenticated) {
        socket.emit('game:error', { error: 'Not authenticated' });
        return;
      }

      // Leave socket room
      socket.leave(`game:${gameId}`);
      
      // Remove from game room tracking
      const gameRoom = this.gameRooms.get(gameId);
      if (gameRoom) {
        gameRoom.delete(socket.id);
        if (gameRoom.size === 0) {
          this.gameRooms.delete(gameId);
        }
      }

      socket.emit('game:left', { gameId });
      
      // Notify other players
      this.broadcastToGame(gameId, 'game:player-left', { userId }, socket.id);

      console.log(`User ${userId} left game ${gameId}`);
    } catch (error) {
      console.error('Game leave error:', error);
      socket.emit('game:error', { error: 'Failed to leave game' });
    }
  }

  /**
   * Handle card selection
   */
  async handleCardSelection(socket, data) {
    try {
      const { gameId, cards } = data;
      const userId = socket.userId || this.connectedUsers.get(socket.id);

      if (!userId || !socket.authenticated) {
        socket.emit('game:error', { error: 'Not authenticated' });
        return;
      }

      if (!gameEngine.activeGames.has(gameId)) {
        socket.emit('game:error', { error: 'Game not active' });
        return;
      }

      // Validate action
      if (!gameEngine.validateAction(gameId, userId, 'select_cards')) {
        socket.emit('game:error', { error: 'Invalid action' });
        return;
      }

      // Process card selection
      const result = gameEngine.processCardSelection(gameId, userId, cards);

      // Save action to database
      await GameAction.create({
        gameId,
        playerId: userId,
        actionType: 'select_cards',
        actionData: { cards },
        turn: gameEngine.getGameState(gameId).currentTurn
      });

      // Emit result to player
      socket.emit('game:cards-selected', { result });

      // If turn is resolved, broadcast results to all players
      if (result.status === 'turn_completed' || result.status === 'game_ended') {
        const gameState = gameEngine.getGameState(gameId);
        
        this.broadcastToGame(gameId, 'game:turn-resolved', {
          result,
          gameState
        });

        // Update database with new game state
        await this.updateGameInDB(gameId, gameState, result);

        // If game ended, clean up
        if (result.status === 'game_ended') {
          setTimeout(() => {
            gameEngine.removeGame(gameId);
          }, 30000); // Keep game in memory for 30 seconds for final state queries
        }
      } else {
        // Just notify about card selection
        this.broadcastToGame(gameId, 'game:player-ready', { 
          userId,
          gameState: gameEngine.getGameState(gameId)
        }, socket.id);
      }

      console.log(`User ${userId} selected cards in game ${gameId}`);
    } catch (error) {
      console.error('Card selection error:', error);
      socket.emit('game:error', { error: error.message || 'Failed to select cards' });
    }
  }

  /**
   * Handle game state request
   */
  async handleGetGameState(socket, data) {
    try {
      const { gameId } = data;
      const userId = socket.userId || this.connectedUsers.get(socket.id);

      if (!userId || !socket.authenticated) {
        socket.emit('game:error', { error: 'Not authenticated' });
        return;
      }

      let gameState;
      
      if (gameEngine.activeGames.has(gameId)) {
        gameState = gameEngine.getGameState(gameId);
      } else {
        // Get from database
        const dbGame = await Game.findByPk(gameId, {
          include: [
            { model: User, as: 'player1', attributes: ['id', 'username'] },
            { model: User, as: 'player2', attributes: ['id', 'username'] },
            { model: User, as: 'winner', attributes: ['id', 'username'] }
          ]
        });

        if (!dbGame) {
          socket.emit('game:error', { error: 'Game not found' });
          return;
        }

        gameState = this.convertDBGameToState(dbGame);
      }

      socket.emit('game:state-update', { gameState });
    } catch (error) {
      console.error('Get game state error:', error);
      socket.emit('game:error', { error: 'Failed to get game state' });
    }
  }

  /**
   * Handle game forfeit
   */
  async handleGameForfeit(socket, data) {
    try {
      const { gameId } = data;
      const userId = socket.userId || this.connectedUsers.get(socket.id);

      if (!userId || !socket.authenticated) {
        socket.emit('game:error', { error: 'Not authenticated' });
        return;
      }

      // Update database
      const dbGame = await Game.findByPk(gameId);
      if (!dbGame) {
        socket.emit('game:error', { error: 'Game not found' });
        return;
      }

      const winnerId = dbGame.player1Id === userId ? dbGame.player2Id : dbGame.player1Id;
      
      await dbGame.update({
        status: 'completed',
        winnerId,
        endedAt: new Date()
      });

      // Remove from engine if active
      if (gameEngine.activeGames.has(gameId)) {
        gameEngine.removeGame(gameId);
      }

      // Notify all players
      this.broadcastToGame(gameId, 'game:forfeited', {
        forfeitedBy: userId,
        winnerId
      });

      console.log(`User ${userId} forfeited game ${gameId}`);
    } catch (error) {
      console.error('Game forfeit error:', error);
      socket.emit('game:error', { error: 'Failed to forfeit game' });
    }
  }

  /**
   * Handle sync request
   */
  async handleRequestSync(socket, data) {
    try {
      const { gameId } = data;
      const userId = socket.userId || this.connectedUsers.get(socket.id);

      if (!userId || !socket.authenticated) {
        socket.emit('game:error', { error: 'Not authenticated' });
        return;
      }

      await this.handleGetGameState(socket, { gameId });
    } catch (error) {
      console.error('Sync request error:', error);
      socket.emit('game:error', { error: 'Failed to sync game state' });
    }
  }

  /**
   * Handle game start request
   */
  async handleGameStart(socket, data) {
    try {
      const { gameId, gameConfig } = data;
      const userId = socket.userId || this.connectedUsers.get(socket.id);

      if (!userId || !socket.authenticated) {
        socket.emit('game:error', { error: 'Not authenticated' });
        return;
      }

      // Check if game exists in database
      const dbGame = await Game.findByPk(gameId);
      if (!dbGame) {
        socket.emit('game:error', { error: 'Game not found' });
        return;
      }

      // Check if user is the host/creator
      if (dbGame.player1Id !== userId) {
        socket.emit('game:error', { error: 'Only the host can start the game' });
        return;
      }

      // Check if game is in waiting status
      if (dbGame.status !== 'waiting') {
        socket.emit('game:error', { error: 'Game cannot be started' });
        return;
      }

      // Update game status to active
      await dbGame.update({
        status: 'active',
        gameConfig: gameConfig,
        startedAt: new Date()
      });

      // Initialize game in engine if not exists
      if (!gameEngine.activeGames.has(gameId)) {
        const engineGame = gameEngine.createGame(gameConfig);
        engineGame.id = gameId;
        
        // Add players to engine
        if (dbGame.player1Id) {
          const player1 = await User.findByPk(dbGame.player1Id);
          gameEngine.addPlayer(gameId, {
            id: player1.id,
            username: player1.username
          });
        }
        if (dbGame.player2Id) {
          const player2 = await User.findByPk(dbGame.player2Id);
          gameEngine.addPlayer(gameId, {
            id: player2.id,
            username: player2.username
          });
        }
      }

      // Broadcast game started to all players
      this.broadcastToGame(gameId, 'game:started', {
        gameId,
        gameState: gameEngine.getGameState(gameId)
      });

      console.log(`Game ${gameId} started by user ${userId}`);
    } catch (error) {
      console.error('Game start error:', error);
      socket.emit('game:error', { error: 'Failed to start game' });
    }
  }

  /**
   * Handle game settings update
   */
  async handleUpdateSettings(socket, data) {
    try {
      const { gameId, settings } = data;
      const userId = socket.userId || this.connectedUsers.get(socket.id);

      if (!userId || !socket.authenticated) {
        socket.emit('game:error', { error: 'Not authenticated' });
        return;
      }

      // Check if game exists in database
      const dbGame = await Game.findByPk(gameId);
      if (!dbGame) {
        socket.emit('game:error', { error: 'Game not found' });
        return;
      }

      // Check if user is the host/creator
      if (dbGame.player1Id !== userId) {
        socket.emit('game:error', { error: 'Only the host can update settings' });
        return;
      }

      // Check if game is still in waiting status
      if (dbGame.status !== 'waiting') {
        socket.emit('game:error', { error: 'Cannot update settings after game has started' });
        return;
      }

      // Update game config
      const updatedConfig = { ...dbGame.gameConfig, ...settings };
      await dbGame.update({ gameConfig: updatedConfig });

      // Broadcast settings update to all players
      this.broadcastToGame(gameId, 'game:settings-updated', {
        gameId,
        settings: updatedConfig
      });

      console.log(`Game ${gameId} settings updated by user ${userId}`);
    } catch (error) {
      console.error('Update settings error:', error);
      socket.emit('game:error', { error: 'Failed to update settings' });
    }
  }

  /**
   * Handle player ready status change
   */
  async handlePlayerReady(socket, data) {
    try {
      const { gameId, ready } = data;
      const userId = socket.userId || this.connectedUsers.get(socket.id);

      if (!userId || !socket.authenticated) {
        socket.emit('game:error', { error: 'Not authenticated' });
        return;
      }

      // For now, just broadcast the ready status change
      // In a full implementation, you might want to store this in the database
      this.broadcastToGame(gameId, 'game:player-ready', {
        userId,
        ready,
        gameId
      });

      console.log(`User ${userId} ready status changed to ${ready} in game ${gameId}`);
    } catch (error) {
      console.error('Player ready error:', error);
      socket.emit('game:error', { error: 'Failed to update ready status' });
    }
  }

  /**
   * Broadcast message to all players in a game
   */
  broadcastToGame(gameId, event, data, excludeSocketId = null) {
    const gameRoom = this.gameRooms.get(gameId);
    if (!gameRoom) return;

    for (const socketId of gameRoom) {
      if (socketId !== excludeSocketId) {
        const socket = this.io.sockets.sockets.get(socketId);
        if (socket) {
          socket.emit(event, data);
        }
      }
    }
  }

  /**
   * Convert database game to engine game state format
   */
  convertDBGameToState(dbGame) {
    return {
      id: dbGame.id,
      phase: dbGame.phase,
      currentTurn: dbGame.currentTurn,
      turnTimer: null,
      players: [
        dbGame.player1 ? {
          id: dbGame.player1.id,
          username: dbGame.player1.username,
          health: dbGame.player1Health,
          charges: dbGame.player1Charges,
          statusEffects: dbGame.player1StatusEffects || [],
          ready: false
        } : null,
        dbGame.player2 ? {
          id: dbGame.player2.id,
          username: dbGame.player2.username,
          health: dbGame.player2Health,
          charges: dbGame.player2Charges,
          statusEffects: dbGame.player2StatusEffects || [],
          ready: false
        } : null
      ].filter(Boolean),
      gameConfig: dbGame.gameConfig,
      winner: dbGame.winner
    };
  }

  /**
   * Sync game state from database to engine
   */
  syncGameStateFromDB(gameId, dbGame) {
    const engineGame = gameEngine.activeGames.get(gameId);
    if (!engineGame) return;

    // Update player states
    if (engineGame.players[0] && dbGame.player1) {
      engineGame.players[0].health = dbGame.player1Health;
      engineGame.players[0].charges = dbGame.player1Charges;
      engineGame.players[0].statusEffects = dbGame.player1StatusEffects || [];
    }
    
    if (engineGame.players[1] && dbGame.player2) {
      engineGame.players[1].health = dbGame.player2Health;
      engineGame.players[1].charges = dbGame.player2Charges;
      engineGame.players[1].statusEffects = dbGame.player2StatusEffects || [];
    }

    engineGame.currentTurn = dbGame.currentTurn;
    engineGame.phase = dbGame.phase;
  }

  /**
   * Update game state in database
   */
  async updateGameInDB(gameId, gameState, result) {
    try {
      const updateData = {
        currentTurn: gameState.currentTurn,
        phase: gameState.phase,
        player1Health: gameState.players[0]?.health || 0,
        player1Charges: gameState.players[0]?.charges || 0,
        player1StatusEffects: gameState.players[0]?.statusEffects || [],
        player2Health: gameState.players[1]?.health || 0,
        player2Charges: gameState.players[1]?.charges || 0,
        player2StatusEffects: gameState.players[1]?.statusEffects || []
      };

      if (result.status === 'game_ended') {
        updateData.status = 'completed';
        updateData.winnerId = result.winner?.id || null;
        updateData.endedAt = new Date();
      }

      await Game.update(updateData, { where: { id: gameId } });
    } catch (error) {
      console.error('Failed to update game in DB:', error);
    }
  }

  /**
   * Setup turn timers for active games
   */
  setupTurnTimers() {
    this.turnTimerInterval = setInterval(() => {
      for (const [gameId, game] of gameEngine.activeGames.entries()) {
        if (game.phase === 'selection' && game.turnTimer) {
          const now = Date.now();
          const timeRemaining = Math.max(0, Math.floor((game.turnTimer - now) / 1000));
          
          // Broadcast timer updates every second
          this.broadcastToGame(gameId, 'game:timer-update', {
            timeRemaining,
            serverTime: game.turnTimer,
            phase: game.phase,
            currentTurn: game.currentTurn
          });
          
          // Handle timeout
          if (now >= game.turnTimer) {
            console.log(`Turn timeout for game ${gameId}`);
            
            try {
              const result = gameEngine.handleTurnTimeout(gameId);
              if (result) {
                const gameState = gameEngine.getGameState(gameId);
                
                this.broadcastToGame(gameId, 'game:turn-timeout', {
                  result,
                  gameState
                });

                // Update database
                this.updateGameInDB(gameId, gameState, result);
              }
            } catch (error) {
              console.error(`Error handling timeout for game ${gameId}:`, error);
            }
          }
        }
      }
    }, 1000); // Check every second
  }

  /**
   * Cleanup timers and resources
   */
  cleanup() {
    if (this.turnTimerInterval) {
      clearInterval(this.turnTimerInterval);
      this.turnTimerInterval = null;
    }
  }
}

module.exports = GameHandlers;