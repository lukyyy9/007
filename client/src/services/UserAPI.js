import API_CONFIG from '../config/api';

class UserAPI {
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
   * Get user statistics
   */
  async getUserStats(userId = null) {
    const endpoint = userId ? `/api/user/${userId}/stats` : '/api/user/stats';
    return this.request(endpoint);
  }

  /**
   * Get user's recent matches
   */
  async getRecentMatches(options = {}) {
    const { limit = 10, offset = 0 } = options;
    const params = new URLSearchParams({ limit, offset });
    
    return this.request(`/api/game/user/my-games?${params}`);
  }

  /**
   * Get user's tournament history
   */
  async getTournamentHistory(options = {}) {
    const { limit = 10, offset = 0 } = options;
    const params = new URLSearchParams({ limit, offset, status: 'all' });
    
    return this.request(`/api/tournament?${params}`);
  }
}

export default new UserAPI();