import API_CONFIG from '../config/api';

class GameAPI {
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
  }

  /**
   * Make HTTP request with authentication
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const config = {
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add auth token if available
    const token = await this.getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  /**
   * Get authentication token from storage
   */
  async getAuthToken() {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      return await AsyncStorage.getItem('auth_token');
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  /**
   * Create a new game
   */
  async createGame(gameConfig = {}) {
    return this.request(API_CONFIG.ENDPOINTS.GAME.CREATE, {
      method: 'POST',
      body: JSON.stringify({ gameConfig }),
    });
  }

  /**
   * Join an existing game
   */
  async joinGame(gameId) {
    return this.request(`/api/game/join/${gameId}`, {
      method: 'POST',
    });
  }

  /**
   * Get game status
   */
  async getGameStatus(gameId) {
    return this.request(`/api/game/${gameId}`);
  }

  /**
   * Get list of available games
   */
  async getAvailableGames(options = {}) {
    const { status = 'waiting', limit = 20, offset = 0 } = options;
    const params = new URLSearchParams({ status, limit, offset });
    
    return this.request(`/api/game?${params}`);
  }

  /**
   * Get user's games
   */
  async getUserGames(options = {}) {
    const { status, limit = 20, offset = 0 } = options;
    const params = new URLSearchParams({ limit, offset });
    if (status) params.append('status', status);
    
    return this.request(`/api/game/user/my-games?${params}`);
  }

  /**
   * Forfeit a game
   */
  async forfeitGame(gameId) {
    return this.request(`/api/game/${gameId}/forfeit`, {
      method: 'POST',
    });
  }

  /**
   * Get game configuration options
   */
  async getConfigOptions() {
    return this.request('/api/game/config/options');
  }

  /**
   * Validate game configuration
   */
  async validateConfig(gameConfig) {
    return this.request('/api/game/config/validate', {
      method: 'POST',
      body: JSON.stringify({ gameConfig }),
    });
  }
}

export default new GameAPI();