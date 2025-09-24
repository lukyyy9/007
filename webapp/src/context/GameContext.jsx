import React, { createContext, useContext, useReducer } from 'react';

const GameContext = createContext();

const initialState = {
  currentGame: null,
  gameState: null,
  isInGame: false,
  gameHistory: [],
  selectedCards: [],
  turnTimer: 0,
  gameConfig: {
    maxHealth: 6,
    turnTimeLimit: 20,
    bestOfSeries: 1,
    currentGame: 1,
  },
};

const gameReducer = (state, action) => {
  switch (action.type) {
    case 'JOIN_GAME':
      return {
        ...state,
        currentGame: action.payload,
        isInGame: true,
      };
    case 'LEAVE_GAME':
      return {
        ...state,
        currentGame: null,
        gameState: null,
        isInGame: false,
        selectedCards: [],
        turnTimer: 0,
      };
    case 'UPDATE_GAME_STATE':
      return {
        ...state,
        gameState: action.payload,
      };
    case 'SELECT_CARDS':
      return {
        ...state,
        selectedCards: action.payload,
      };
    case 'UPDATE_TIMER':
      return {
        ...state,
        turnTimer: action.payload,
      };
    case 'ADD_TO_HISTORY':
      return {
        ...state,
        gameHistory: [...state.gameHistory, action.payload],
      };
    case 'UPDATE_CONFIG':
      return {
        ...state,
        gameConfig: { ...state.gameConfig, ...action.payload },
      };
    case 'CLEAR_HISTORY':
      return {
        ...state,
        gameHistory: [],
      };
    default:
      return state;
  }
};

export const GameProvider = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  const joinGame = (gameData) => {
    dispatch({ type: 'JOIN_GAME', payload: gameData });
  };

  const leaveGame = () => {
    dispatch({ type: 'LEAVE_GAME' });
  };

  const updateGameState = (newState) => {
    dispatch({ type: 'UPDATE_GAME_STATE', payload: newState });
  };

  const selectCards = (cards) => {
    dispatch({ type: 'SELECT_CARDS', payload: cards });
  };

  const updateTimer = (timeLeft) => {
    dispatch({ type: 'UPDATE_TIMER', payload: timeLeft });
  };

  const addToHistory = (historyItem) => {
    dispatch({ type: 'ADD_TO_HISTORY', payload: historyItem });
  };

  const updateConfig = (configUpdate) => {
    dispatch({ type: 'UPDATE_CONFIG', payload: configUpdate });
  };

  const clearHistory = () => {
    dispatch({ type: 'CLEAR_HISTORY' });
  };

  const value = {
    ...state,
    joinGame,
    leaveGame,
    updateGameState,
    selectCards,
    updateTimer,
    addToHistory,
    updateConfig,
    clearHistory,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};