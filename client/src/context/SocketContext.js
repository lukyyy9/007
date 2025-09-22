import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import SocketService from '../services/SocketService';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

const initialState = {
  isConnected: false,
  connectionStatus: 'disconnected', // 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error'
  error: null,
  reconnectAttempts: 0,
  lastConnectedAt: null,
  gameState: null,
  tournamentState: null,
};

const socketReducer = (state, action) => {
  switch (action.type) {
    case 'SET_CONNECTION_STATUS':
      return {
        ...state,
        connectionStatus: action.payload,
        isConnected: action.payload === 'connected',
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        connectionStatus: 'error',
      };
    case 'SET_RECONNECT_ATTEMPTS':
      return {
        ...state,
        reconnectAttempts: action.payload,
      };
    case 'SET_LAST_CONNECTED':
      return {
        ...state,
        lastConnectedAt: action.payload,
      };
    case 'UPDATE_GAME_STATE':
      return {
        ...state,
        gameState: action.payload,
      };
    case 'UPDATE_TOURNAMENT_STATE':
      return {
        ...state,
        tournamentState: action.payload,
      };
    case 'CLEAR_STATES':
      return {
        ...state,
        gameState: null,
        tournamentState: null,
      };
    default:
      return state;
  }
};

export const SocketProvider = ({ children }) => {
  const [state, dispatch] = useReducer(socketReducer, initialState);
  const { token, isAuthenticated } = useAuth();

  // Connection management
  const connect = useCallback(async () => {
    if (state.isConnected) return;

    dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'connecting' });
    
    try {
      const socketUrl = process.env.EXPO_PUBLIC_SOCKET_URL || 'http://192.168.1.30:3000';
      await SocketService.connect(socketUrl, token);
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'connected' });
      dispatch({ type: 'SET_LAST_CONNECTED', payload: new Date().toISOString() });
      dispatch({ type: 'SET_ERROR', payload: null });
    } catch (error) {
      console.error('Failed to connect to socket server:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  }, [token, state.isConnected]);

  const disconnect = useCallback(() => {
    SocketService.disconnect();
    dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'disconnected' });
    dispatch({ type: 'CLEAR_STATES' });
  }, []);

  // Setup socket event listeners
  useEffect(() => {
    if (!state.isConnected) return;

    // Connection events
    SocketService.on('connect', () => {
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'connected' });
      dispatch({ type: 'SET_LAST_CONNECTED', payload: new Date().toISOString() });
    });

    SocketService.on('disconnect', () => {
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'disconnected' });
    });

    SocketService.on('reconnect_attempt', (attemptNumber) => {
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'reconnecting' });
      dispatch({ type: 'SET_RECONNECT_ATTEMPTS', payload: attemptNumber });
    });

    SocketService.on('reconnect', () => {
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'connected' });
      dispatch({ type: 'SET_RECONNECT_ATTEMPTS', payload: 0 });
    });

    SocketService.on('connect_error', (error) => {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    });

    // Game events
    SocketService.on('game:state-update', (gameState) => {
      dispatch({ type: 'UPDATE_GAME_STATE', payload: gameState });
    });

    SocketService.on('game:timer-update', (timerData) => {
      // Update game state with timer information
      dispatch({ type: 'UPDATE_GAME_STATE', payload: {
        ...state.gameState,
        turnTimer: timerData.timeRemaining,
        turnTimerServer: timerData.serverTime,
        phase: timerData.phase,
        currentTurn: timerData.currentTurn
      }});
    });

    SocketService.on('game:turn-timeout', (data) => {
      console.log('Turn timeout:', data);
      dispatch({ type: 'UPDATE_GAME_STATE', payload: data.gameState });
    });

    SocketService.on('game:turn-resolved', (data) => {
      console.log('Turn resolved:', data);
      dispatch({ type: 'UPDATE_GAME_STATE', payload: data.gameState });
    });

    SocketService.on('game:player-ready', (data) => {
      console.log('Player ready:', data);
      dispatch({ type: 'UPDATE_GAME_STATE', payload: data.gameState });
    });

    SocketService.on('game:joined', (gameData) => {
      console.log('Joined game:', gameData);
      if (gameData.gameState) {
        dispatch({ type: 'UPDATE_GAME_STATE', payload: gameData.gameState });
      }
    });

    SocketService.on('game:left', (gameData) => {
      console.log('Left game:', gameData);
      dispatch({ type: 'UPDATE_GAME_STATE', payload: null });
    });

    SocketService.on('game:turn-result', (result) => {
      console.log('Turn result:', result);
    });

    SocketService.on('game:ended', (result) => {
      console.log('Game ended:', result);
    });

    // Tournament events
    SocketService.on('tournament:state-update', (tournamentState) => {
      dispatch({ type: 'UPDATE_TOURNAMENT_STATE', payload: tournamentState });
    });

    SocketService.on('tournament:joined', (tournamentData) => {
      console.log('Joined tournament:', tournamentData);
    });

    SocketService.on('tournament:bracket-update', (brackets) => {
      console.log('Tournament brackets updated:', brackets);
    });

    SocketService.on('tournament:match-start', (matchInfo) => {
      console.log('Tournament match starting:', matchInfo);
    });

    // Error handling
    SocketService.on('error', (error) => {
      console.error('Socket error:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
    });

    // Cleanup function
    return () => {
      SocketService.cleanup();
    };
  }, [state.isConnected]);

  // Auto-connect when authenticated
  useEffect(() => {
    if (isAuthenticated && !state.isConnected && state.connectionStatus === 'disconnected') {
      connect();
    } else if (!isAuthenticated && state.isConnected) {
      disconnect();
    }
  }, [isAuthenticated, state.isConnected, state.connectionStatus, connect, disconnect]);

  // Game methods
  const joinGame = useCallback((gameId) => {
    return SocketService.joinGame(gameId);
  }, []);

  const leaveGame = useCallback((gameId) => {
    return SocketService.leaveGame(gameId);
  }, []);

  const selectCards = useCallback((gameId, cards) => {
    return SocketService.selectCards(gameId, cards);
  }, []);

  const createGame = useCallback((gameConfig) => {
    return SocketService.createGame(gameConfig);
  }, []);

  // Tournament methods
  const joinTournament = useCallback((tournamentId) => {
    return SocketService.joinTournament(tournamentId);
  }, []);

  const leaveTournament = useCallback((tournamentId) => {
    return SocketService.leaveTournament(tournamentId);
  }, []);

  const createTournament = useCallback((tournamentConfig) => {
    return SocketService.createTournament(tournamentConfig);
  }, []);

  // Utility methods
  const getConnectionInfo = useCallback(() => {
    return {
      ...state,
      socketStatus: SocketService.getConnectionStatus(),
    };
  }, [state]);

  const value = {
    ...state,
    connect,
    disconnect,
    joinGame,
    leaveGame,
    selectCards,
    createGame,
    joinTournament,
    leaveTournament,
    createTournament,
    getConnectionInfo,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};