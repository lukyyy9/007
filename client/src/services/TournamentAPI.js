import API_CONFIG from '../config/api';

class TournamentAPI {
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
   * Create a new tournament
   */
  async createTournament(tournamentData) {
    return this.request('/api/tournament/create', {
      method: 'POST',
      body: JSON.stringify(tournamentData),
    });
  }

  /**
   * Join a tournament
   */
  async joinTournament(tournamentId) {
    return this.request(`/api/tournament/join/${tournamentId}`, {
      method: 'POST',
    });
  }

  /**
   * Get tournament details
   */
  async getTournament(tournamentId) {
    return this.request(`/api/tournament/${tournamentId}`);
  }

  /**
   * Get tournament brackets
   */
  async getTournamentBrackets(tournamentId) {
    return this.request(`/api/tournament/${tournamentId}/brackets`);
  }

  /**
   * Get list of tournaments
   */
  async getTournaments(options = {}) {
    const { status = 'waiting', limit = 20, offset = 0 } = options;
    const params = new URLSearchParams({ status, limit, offset });
    
    return this.request(`/api/tournament?${params}`);
  }

  /**
   * Start tournament (creator only)
   */
  async startTournament(tournamentId) {
    return this.request(`/api/tournament/${tournamentId}/start`, {
      method: 'POST',
    });
  }

  /**
   * Leave tournament
   */
  async leaveTournament(tournamentId) {
    return this.request(`/api/tournament/${tournamentId}/leave`, {
      method: 'POST',
    });
  }
}

export default new TournamentAPI();