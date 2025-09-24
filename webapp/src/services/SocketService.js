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

  connect(serverUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000', token = null) {
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

          this.handleReconnection();
        });

        // Reconnection attempt
        this.socket.on('reconnect_attempt', (attemptNumber) => {
          console.log('Socket reconnection attempt:', attemptNumber);
          this.reconnectAttempts = attemptNumber;
        });

        // Reconnection success
        this.socket.on('reconnect', () => {
          console.log('Socket reconnected');
          this.isConnected = true;
          this.reconnectAttempts = 0;
        });

        // Reconnection failed
        this.socket.on('reconnect_failed', () => {
          console.error('Socket reconnection failed after max attempts');
          this.isConnected = false;
        });

      } catch (error) {
        console.error('Socket connection setup error:', error);
        reject(error);
      }
    });
  }

  disconnect() {
    if (this.socket) {
      console.log('Disconnecting socket...');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.reconnectAttempts = 0;
    }
  }

  handleReconnection() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    setTimeout(() => {
      if (!this.isConnected && this.socket) {
        console.log('Attempting socket reconnection...');
        this.socket.connect();
      }
    }, this.reconnectDelay * Math.pow(2, this.reconnectAttempts));
  }

  // Event listeners
  on(event, callback) {
    if (!this.socket) {
      console.warn('Socket not connected when trying to register listener for:', event);
      return;
    }

    // Store listener reference for cleanup
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);

    this.socket.on(event, callback);
  }

  off(event, callback) {
    if (!this.socket) return;

    this.socket.off(event, callback);

    // Remove from our tracking
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
      if (this.listeners.get(event).size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  emit(event, data) {
    if (!this.socket || !this.isConnected) {
      console.warn('Socket not connected when trying to emit:', event);
      return false;
    }

    this.socket.emit(event, data);
    return true;
  }

  // Game-specific methods
  joinGame(gameId) {
    return this.emit('joinGame', { gameId });
  }

  leaveGame() {
    return this.emit('leaveGame');
  }

  makeMove(moveData) {
    return this.emit('gameMove', moveData);
  }

  // Tournament-specific methods
  joinTournament(tournamentId) {
    return this.emit('joinTournament', { tournamentId });
  }

  leaveTournament() {
    return this.emit('leaveTournament');
  }

  // Chat methods
  sendMessage(message) {
    return this.emit('chatMessage', message);
  }

  // Utility methods
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      socketId: this.socket?.id || null,
    };
  }

  // Cleanup method
  cleanup() {
    // Remove all listeners
    this.listeners.forEach((callbacks, event) => {
      callbacks.forEach(callback => {
        this.socket?.off(event, callback);
      });
    });
    this.listeners.clear();

    this.disconnect();
  }
}

// Export singleton instance
const socketService = new SocketService();
export default socketService;