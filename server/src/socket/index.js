const GameHandlers = require('./gameHandlers');
const TournamentHandlers = require('./tournamentHandlers');
const { auth } = require('../middleware');
const jwt = require('jsonwebtoken');

/**
 * Main Socket.IO handler that coordinates all socket events
 */
class SocketHandler {
  constructor(io) {
    this.io = io;
    this.gameHandlers = new GameHandlers(io);
    this.tournamentHandlers = new TournamentHandlers(io);
    this.connectedUsers = new Map(); // socketId -> userId mapping
    
    this.setupSocketAuthentication();
    this.setupConnectionHandling();
    this.gameHandlers.setupTurnTimers();
  }

  /**
   * Setup socket authentication middleware
   */
  setupSocketAuthentication() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.query.token;
        
        if (!token) {
          // Allow connection but mark as unauthenticated
          socket.authenticated = false;
          return next();
        }

        const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // You could verify user exists in database here
        socket.userId = decoded.userId;
        socket.authenticated = true;
        
        next();
      } catch (error) {
        console.error('Socket authentication error:', error);
        socket.authenticated = false;
        next(); // Allow connection but mark as unauthenticated
      }
    });
  }

  /**
   * Setup main connection handling
   */
  setupConnectionHandling() {
    this.io.on('connection', (socket) => {
      console.log(`Socket connected: ${socket.id}, authenticated: ${socket.authenticated}`);

      // Store authenticated user
      if (socket.authenticated && socket.userId) {
        this.connectedUsers.set(socket.id, socket.userId);
      }

      // Register all event handlers
      this.registerEventHandlers(socket);

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        console.log(`Socket disconnected: ${socket.id}, reason: ${reason}`);
        this.handleDisconnection(socket);
      });

      // Send connection confirmation
      socket.emit('connected', {
        socketId: socket.id,
        authenticated: socket.authenticated,
        userId: socket.userId || null,
        timestamp: new Date().toISOString()
      });
    });
  }

  /**
   * Register all event handlers for a socket
   */
  registerEventHandlers(socket) {
    // Authentication events
    this.registerAuthEvents(socket);

    // Game events
    this.gameHandlers.registerHandlers(socket);

    // Tournament events
    this.tournamentHandlers.registerHandlers(socket, this.connectedUsers);

    // General events
    this.registerGeneralEvents(socket);
  }

  /**
   * Register authentication-related events
   */
  registerAuthEvents(socket) {
    socket.on('auth:login', async (data) => {
      try {
        const { token } = data;
        
        if (!token) {
          socket.emit('auth:error', { error: 'Token required' });
          return;
        }

        const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
        const decoded = jwt.verify(token, JWT_SECRET);
        
        socket.userId = decoded.userId;
        socket.authenticated = true;
        this.connectedUsers.set(socket.id, decoded.userId);

        socket.emit('auth:success', { 
          userId: decoded.userId,
          message: 'Authentication successful'
        });

        console.log(`Socket ${socket.id} authenticated as user ${decoded.userId}`);
      } catch (error) {
        console.error('Socket login error:', error);
        socket.emit('auth:error', { error: 'Authentication failed' });
      }
    });

    socket.on('auth:logout', () => {
      socket.authenticated = false;
      socket.userId = null;
      this.connectedUsers.delete(socket.id);
      
      socket.emit('auth:logged-out', { message: 'Logged out successfully' });
      console.log(`Socket ${socket.id} logged out`);
    });
  }

  /**
   * Register general events
   */
  registerGeneralEvents(socket) {
    socket.on('ping', (data) => {
      socket.emit('pong', {
        ...data,
        serverTime: new Date().toISOString()
      });
    });

    socket.on('get-server-time', () => {
      socket.emit('server-time', {
        timestamp: new Date().toISOString(),
        unixTime: Date.now()
      });
    });

    socket.on('join-room', (data) => {
      const { room } = data;
      if (room && typeof room === 'string' && room.length < 100) {
        socket.join(room);
        socket.emit('room-joined', { room });
        console.log(`Socket ${socket.id} joined room: ${room}`);
      } else {
        socket.emit('error', { error: 'Invalid room name' });
      }
    });

    socket.on('leave-room', (data) => {
      const { room } = data;
      if (room && typeof room === 'string') {
        socket.leave(room);
        socket.emit('room-left', { room });
        console.log(`Socket ${socket.id} left room: ${room}`);
      }
    });
  }

  /**
   * Handle socket disconnection cleanup
   */
  handleDisconnection(socket) {
    // Remove from connected users
    this.connectedUsers.delete(socket.id);

    // Clean up tournament rooms
    this.tournamentHandlers.handleSocketDisconnect(socket.id);

    // Game handlers have their own disconnect handling in registerHandlers
  }

  /**
   * Broadcast to all authenticated users
   */
  broadcastToAuthenticated(event, data) {
    for (const [socketId, userId] of this.connectedUsers.entries()) {
      const socket = this.io.sockets.sockets.get(socketId);
      if (socket && socket.authenticated) {
        socket.emit(event, data);
      }
    }
  }

  /**
   * Send message to specific user (all their sockets)
   */
  sendToUser(userId, event, data) {
    for (const [socketId, connectedUserId] of this.connectedUsers.entries()) {
      if (connectedUserId === userId) {
        const socket = this.io.sockets.sockets.get(socketId);
        if (socket) {
          socket.emit(event, data);
        }
      }
    }
  }

  /**
   * Get connection statistics
   */
  getStats() {
    return {
      totalConnections: this.io.sockets.sockets.size,
      authenticatedUsers: this.connectedUsers.size,
      activeGames: this.gameHandlers.gameEngine?.getActiveGames()?.length || 0,
      activeTournaments: this.tournamentHandlers.tournamentRooms.size
    };
  }

  /**
   * Broadcast server announcement
   */
  broadcastAnnouncement(message, type = 'info') {
    this.io.emit('server:announcement', {
      message,
      type,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Handle server shutdown gracefully
   */
  async handleShutdown() {
    console.log('Shutting down socket server...');
    
    // Notify all connected clients
    this.broadcastAnnouncement('Server is shutting down for maintenance', 'warning');
    
    // Give clients time to receive the message
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Close all connections
    this.io.close();
  }
}

module.exports = SocketHandler;