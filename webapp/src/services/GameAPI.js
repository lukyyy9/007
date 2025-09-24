import API_CONFIG from '../config/api';

class GameAPI {
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
  }

  /**
   * Make authenticated HTTP request
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    // Get token from localStorage
    const token = localStorage.getItem('authToken');
    
    const config = {
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }

  /**
   * Create a new game
   */
  async createGame(gameConfig = {}) {
    try {
      const response = await this.request(API_CONFIG.ENDPOINTS.GAME.CREATE, {
        method: 'POST',
        body: JSON.stringify(gameConfig),
      });

      return response;
    } catch (error) {
      console.error('Create game error:', error);
      throw new Error(error.message || 'Failed to create game');
    }
  }

  /**
   * Join an existing game
   */
  async joinGame(gameId) {
    if (!gameId) {
      throw new Error('Game ID is required');
    }

    try {
      const response = await this.request(API_CONFIG.ENDPOINTS.GAME.JOIN, {
        method: 'POST',
        body: JSON.stringify({ gameId }),
      });

      return response;
    } catch (error) {
      console.error('Join game error:', error);
      throw new Error(error.message || 'Failed to join game');
    }
  }

  /**
   * Get game status
   */
  async getGameStatus(gameId) {
    if (!gameId) {
      throw new Error('Game ID is required');
    }

    try {
      const response = await this.request(`${API_CONFIG.ENDPOINTS.GAME.STATUS}/${gameId}`, {
        method: 'GET',
      });

      return response;
    } catch (error) {
      console.error('Get game status error:', error);
      throw new Error(error.message || 'Failed to get game status');
    }
  }

  /**
   * Leave current game
   */
  async leaveGame(gameId) {
    if (!gameId) {
      throw new Error('Game ID is required');
    }

    try {
      const response = await this.request(`${API_CONFIG.ENDPOINTS.GAME.LEAVE}/${gameId}/leave`, {
        method: 'POST',
      });

      return response;
    } catch (error) {
      console.error('Leave game error:', error);
      throw new Error(error.message || 'Failed to leave game');
    }
  }

  /**
   * Get list of available games
   */
  async getAvailableGames() {
    try {
      const response = await this.request(API_CONFIG.ENDPOINTS.GAME.LIST, {
        method: 'GET',
      });

      return response;
    } catch (error) {
      console.error('Get available games error:', error);
      throw new Error(error.message || 'Failed to get available games');
    }
  }

  /**
   * Get player's game history
   */
  async getGameHistory() {
    try {
      const response = await this.request(API_CONFIG.ENDPOINTS.GAME.HISTORY, {
        method: 'GET',
      });

      return response;
    } catch (error) {
      console.error('Get game history error:', error);
      throw new Error(error.message || 'Failed to get game history');
    }
  }
}

export default GameAPI;