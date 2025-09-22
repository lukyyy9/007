/**
 * API utility functions for error handling and response processing
 */

/**
 * Handle API errors and return user-friendly messages
 */
export const handleApiError = (error) => {
  console.error('API Error:', error);
  
  if (error.message) {
    // Check for common error patterns
    if (error.message.includes('Network request failed')) {
      return 'Network connection error. Please check your internet connection.';
    }
    
    if (error.message.includes('timeout')) {
      return 'Request timed out. Please try again.';
    }
    
    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      return 'Authentication failed. Please log in again.';
    }
    
    if (error.message.includes('403') || error.message.includes('Forbidden')) {
      return 'Access denied. You do not have permission for this action.';
    }
    
    if (error.message.includes('404') || error.message.includes('Not Found')) {
      return 'Resource not found.';
    }
    
    if (error.message.includes('409') || error.message.includes('Conflict')) {
      return 'Conflict detected. The resource may already exist.';
    }
    
    if (error.message.includes('500') || error.message.includes('Internal Server Error')) {
      return 'Server error. Please try again later.';
    }
    
    // Return the original error message if it's user-friendly
    return error.message;
  }
  
  return 'An unexpected error occurred. Please try again.';
};

/**
 * Transform server game data to client format
 */
export const transformGameData = (serverGame) => {
  if (!serverGame) return null;
  
  return {
    id: serverGame.id,
    name: serverGame.name || `${serverGame.player1?.username}'s Game`,
    config: serverGame.gameConfig || {},
    players: [serverGame.player1, serverGame.player2].filter(Boolean),
    status: serverGame.status,
    creator: serverGame.player1?.username,
    createdAt: serverGame.createdAt,
    updatedAt: serverGame.updatedAt,
  };
};

/**
 * Transform server tournament data to client format
 */
export const transformTournamentData = (serverTournament) => {
  if (!serverTournament) return null;
  
  return {
    id: serverTournament.id,
    name: serverTournament.name,
    players: serverTournament.TournamentPlayers?.length || 0,
    maxPlayers: serverTournament.maxPlayers,
    status: serverTournament.status,
    creator: serverTournament.creator?.username,
    format: serverTournament.format,
    createdAt: serverTournament.createdAt,
    updatedAt: serverTournament.updatedAt,
  };
};

/**
 * Transform server match data to client format
 */
export const transformMatchData = (serverMatch, currentUserId) => {
  if (!serverMatch) return null;
  
  const isPlayer1 = serverMatch.player1Id === currentUserId;
  const opponent = isPlayer1 ? serverMatch.player2 : serverMatch.player1;
  const isWin = serverMatch.winnerId === currentUserId;
  
  return {
    id: serverMatch.id,
    opponent: opponent?.username || 'Unknown Player',
    result: isWin ? 'win' : 'loss',
    date: new Date(serverMatch.updatedAt).toLocaleDateString(),
    type: serverMatch.tournamentId ? 'Tournament' : '1v1',
    duration: calculateGameDuration(serverMatch.createdAt, serverMatch.updatedAt),
  };
};

/**
 * Calculate game duration from start and end times
 */
export const calculateGameDuration = (startTime, endTime) => {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const durationMs = end - start;
  const minutes = Math.floor(durationMs / 60000);
  const seconds = Math.floor((durationMs % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Validate API response structure
 */
export const validateApiResponse = (response, expectedFields = []) => {
  if (!response || typeof response !== 'object') {
    throw new Error('Invalid response format');
  }
  
  for (const field of expectedFields) {
    if (!(field in response)) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
  
  return true;
};