import React, { createContext, useContext, useReducer } from 'react';

const TournamentContext = createContext();

const initialState = {
  currentTournament: null,
  tournaments: [],
  brackets: [],
  isInTournament: false,
  tournamentStatus: 'waiting', // 'waiting' | 'active' | 'completed'
  playerRankings: [],
};

const tournamentReducer = (state, action) => {
  switch (action.type) {
    case 'JOIN_TOURNAMENT':
      return {
        ...state,
        currentTournament: action.payload,
        isInTournament: true,
      };
    case 'LEAVE_TOURNAMENT':
      return {
        ...state,
        currentTournament: null,
        isInTournament: false,
        brackets: [],
        playerRankings: [],
      };
    case 'UPDATE_TOURNAMENTS':
      return {
        ...state,
        tournaments: action.payload,
      };
    case 'UPDATE_BRACKETS':
      return {
        ...state,
        brackets: action.payload,
      };
    case 'UPDATE_TOURNAMENT_STATUS':
      return {
        ...state,
        tournamentStatus: action.payload,
      };
    case 'UPDATE_RANKINGS':
      return {
        ...state,
        playerRankings: action.payload,
      };
    default:
      return state;
  }
};

export const TournamentProvider = ({ children }) => {
  const [state, dispatch] = useReducer(tournamentReducer, initialState);

  const joinTournament = (tournamentData) => {
    dispatch({ type: 'JOIN_TOURNAMENT', payload: tournamentData });
  };

  const leaveTournament = () => {
    dispatch({ type: 'LEAVE_TOURNAMENT' });
  };

  const updateTournaments = (tournaments) => {
    dispatch({ type: 'UPDATE_TOURNAMENTS', payload: tournaments });
  };

  const updateBrackets = (brackets) => {
    dispatch({ type: 'UPDATE_BRACKETS', payload: brackets });
  };

  const updateTournamentStatus = (status) => {
    dispatch({ type: 'UPDATE_TOURNAMENT_STATUS', payload: status });
  };

  const updateRankings = (rankings) => {
    dispatch({ type: 'UPDATE_RANKINGS', payload: rankings });
  };

  const value = {
    ...state,
    joinTournament,
    leaveTournament,
    updateTournaments,
    updateBrackets,
    updateTournamentStatus,
    updateRankings,
  };

  return <TournamentContext.Provider value={value}>{children}</TournamentContext.Provider>;
};

export const useTournament = () => {
  const context = useContext(TournamentContext);
  if (context === undefined) {
    throw new Error('useTournament must be used within a TournamentProvider');
  }
  return context;
};