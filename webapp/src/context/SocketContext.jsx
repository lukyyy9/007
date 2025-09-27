import React, { createContext, useReducer, useEffect, useCallback } from 'react';
import SocketService from '../services/SocketService';
import { useAuth } from './AuthContext';

export const SocketContext = createContext();

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
    if (state.isConnected || state.connectionStatus === 'connecting') return;

    dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'connecting' });
    
    try {
      const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';
      await SocketService.connect(socketUrl, token);
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'connected' });
      dispatch({ type: 'SET_LAST_CONNECTED', payload: new Date().toISOString() });
      dispatch({ type: 'SET_ERROR', payload: null });
    } catch (error) {
      console.error('Failed to connect to socket server:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  }, [token, state.isConnected, state.connectionStatus]);

  const disconnect = useCallback(() => {
    SocketService.disconnect();
    dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'disconnected' });
    dispatch({ type: 'CLEAR_STATES' });
  }, []);

  // Auto-connect when authenticated
  useEffect(() => {
    if (isAuthenticated && token) {
      connect();
    } else if (!isAuthenticated) {
      disconnect();
    }

    return () => {
      if (!isAuthenticated) {
        SocketService.cleanup();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, token]); // Connect/disconnect omis intentionnellement pour éviter les cycles

  // Socket event listeners - Setup once when authentication changes
  useEffect(() => {
    if (!isAuthenticated || !token) return;

    // Setup socket event listeners for the session
    let listenersSetUp = false;

    const setupSocketListeners = () => {
      if (listenersSetUp || !SocketService.socket) return;

      // Game events
      const handleGameStateUpdate = (gameState) => {
        dispatch({ type: 'UPDATE_GAME_STATE', payload: gameState });
      };

      const handleGameJoined = (gameData) => {
        dispatch({ type: 'UPDATE_GAME_STATE', payload: gameData });
      };

      const handleGameLeft = () => {
        dispatch({ type: 'UPDATE_GAME_STATE', payload: null });
      };

      // Tournament events
      const handleTournamentStateUpdate = (tournamentState) => {
        dispatch({ type: 'UPDATE_TOURNAMENT_STATE', payload: tournamentState });
      };

      const handleTournamentJoined = (tournamentData) => {
        dispatch({ type: 'UPDATE_TOURNAMENT_STATE', payload: tournamentData });
      };

      const handleTournamentLeft = () => {
        dispatch({ type: 'UPDATE_TOURNAMENT_STATE', payload: null });
      };

      // Connection events
      const handleDisconnect = (reason) => {
        console.log('Socket disconnected:', reason);
        dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'disconnected' });
        dispatch({ type: 'CLEAR_STATES' });
      };

      const handleReconnect = () => {
        console.log('Socket reconnected');
        dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'connected' });
        dispatch({ type: 'SET_LAST_CONNECTED', payload: new Date().toISOString() });
      };

      const handleReconnectAttempt = (attemptNumber) => {
        console.log('Socket reconnect attempt:', attemptNumber);
        dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'reconnecting' });
        dispatch({ type: 'SET_RECONNECT_ATTEMPTS', payload: attemptNumber });
      };

      // Register listeners only once per session
      SocketService.on('gameStateUpdate', handleGameStateUpdate);
      SocketService.on('gameJoined', handleGameJoined);
      SocketService.on('gameLeft', handleGameLeft);
      SocketService.on('tournamentStateUpdate', handleTournamentStateUpdate);
      SocketService.on('tournamentJoined', handleTournamentJoined);
      SocketService.on('tournamentLeft', handleTournamentLeft);
      SocketService.on('disconnect', handleDisconnect);
      SocketService.on('reconnect', handleReconnect);
      SocketService.on('reconnect_attempt', handleReconnectAttempt);

      listenersSetUp = true;
    };

    // Wait a bit for socket to be ready, then setup listeners
    const timeoutId = setTimeout(setupSocketListeners, 100);

    return () => {
      clearTimeout(timeoutId);
      listenersSetUp = false;
      // SocketService cleanup will handle removing listeners
    };
  }, [isAuthenticated, token]);

  // Game actions
  const joinGame = useCallback((gameId) => {
    SocketService.emit('joinGame', { gameId });
  }, []);

  const leaveGame = useCallback(() => {
    SocketService.emit('leaveGame');
  }, []);

  const makeGameMove = useCallback((moveData) => {
    SocketService.emit('gameMove', moveData);
  }, []);

  // Tournament actions
  const joinTournament = useCallback((tournamentId) => {
    SocketService.emit('joinTournament', { tournamentId });
  }, []);

  const leaveTournament = useCallback(() => {
    SocketService.emit('leaveTournament');
  }, []);

  const value = {
    ...state,
    connect,
    disconnect,
    joinGame,
    leaveGame,
    makeGameMove,
    joinTournament,
    leaveTournament,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};