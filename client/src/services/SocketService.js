import io from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.listeners = new Map();
  }

  connect(serverUrl = process.env.EXPO_PUBLIC_SOCKET_URL || 'http://192.168.1.30:3000', token = null) {
    if (this.socket && this.isConnected) {
      console.log('Socket already connected');
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      try {
        const options = {
          transports: ['websocket'],
          timeout: 5000,
          forceNew: true,
        };

        // Add authentication token if provided
        if (token) {
          options.auth = { token };
        }

        this.socket = io(serverUrl, options);

        // Connection successful
        this.socket.on('connect', () => {
          console.log('Socket connected:', this.socket.id);
          this.isConnected = true;
          this.reconnectAttempts = 0;
          resolve();
        });

        // Connection error
        this.socket.on('connect_error', (error) => {
          console.error('Socket connection error:', error);
          this.isConnected = false;

          if (this.reconnectAttempts === 0) {
            reject(error);
          }
        });

        // Disconnection
        this.socket.on('disconnect', (reason) => {
          console.log('Socket disconnected:', reason);
          this.isConnected = false;

          // Attempt reconnection for certain disconnect reasons
          if (reason === 'io server disconnect') {
            // Server initiated disconnect, don't reconnect
            return;
          }

          this.attemptReconnection();
        });

        // Reconnection attempt
        this.socket.on('reconnect_attempt', (attemptNumber) => {
          console.log(`Reconnection attempt ${attemptNumber}`);
          this.reconnectAttempts = attemptNumber;
        });

        // Reconnection successful
        this.socket.on('reconnect', (attemptNumber) => {
          console.log(`Reconnected after ${attemptNumber} attempts`);
          this.isConnected = true;
          this.reconnectAttempts = 0;
        });

        // Reconnection failed
        this.socket.on('reconnect_failed', () => {
          console.error('Failed to reconnect after maximum attempts');
          this.isConnected = false;
        });

      } catch (error) {
        console.error('Error creating socket connection:', error);
        reject(error);
      }
    });
  }

  disconnect() {
    if (this.socket) {
      console.log('Disconnecting socket');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.reconnectAttempts = 0;
    }
  }

  attemptReconnection() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Maximum reconnection attempts reached');
      return;
    }

    setTimeout(() => {
      if (!this.isConnected && this.socket) {
        console.log(`Attempting to reconnect... (${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
        this.socket.connect();
      }
    }, this.reconnectDelay * Math.pow(2, this.reconnectAttempts)); // Exponential backoff
  }

  // Event listeners
  on(event, callback) {
    if (!this.socket) {
      console.warn('Socket not connected. Event listener not added.');
      return;
    }

    this.socket.on(event, callback);

    // Store listener for cleanup
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (!this.socket) return;

    this.socket.off(event, callback);

    // Remove from stored listeners
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (!this.socket || !this.isConnected) {
      console.warn('Socket not connected. Cannot emit event:', event);
      return false;
    }

    this.socket.emit(event, data);
    return true;
  }

  // Game-specific methods
  joinGame(gameId) {
    return this.emit('game:join', { gameId });
  }

  leaveGame(gameId) {
    return this.emit('game:leave', { gameId });
  }

  selectCards(gameId, cards) {
    return this.emit('game:select-cards', { gameId, cards });
  }

  createGame(gameConfig) {
    return this.emit('game:create', gameConfig);
  }

  // Game room methods
  setPlayerReady(gameId, ready) {
    return this.emit('game:player-ready', { gameId, ready });
  }

  startGame(gameId, gameConfig) {
    return this.emit('game:start', { gameId, gameConfig });
  }

  updateGameSettings(gameId, settings) {
    return this.emit('game:update-settings', { gameId, settings });
  }

  getGameState(gameId) {
    return this.emit('game:get-state', { gameId });
  }

  // Tournament-specific methods
  joinTournament(tournamentId) {
    return this.emit('tournament:join', { tournamentId });
  }

  leaveTournament(tournamentId) {
    return this.emit('tournament:leave', { tournamentId });
  }

  createTournament(tournamentConfig) {
    return this.emit('tournament:create', tournamentConfig);
  }

  // Connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      socketId: this.socket?.id || null,
      reconnectAttempts: this.reconnectAttempts,
    };
  }

  // Cleanup method
  cleanup() {
    // Remove all stored listeners
    this.listeners.forEach((callbacks, event) => {
      callbacks.forEach(callback => {
        if (this.socket) {
          this.socket.off(event, callback);
        }
      });
    });
    this.listeners.clear();

    this.disconnect();
  }
}

// Export singleton instance
export default new SocketService();