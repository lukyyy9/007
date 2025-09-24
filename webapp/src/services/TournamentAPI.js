import API_CONFIG from '../config/api';

class TournamentAPI {
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
   * Create a new tournament
   */
  async createTournament(tournamentConfig = {}) {
    try {
      const response = await this.request(API_CONFIG.ENDPOINTS.TOURNAMENT.CREATE, {
        method: 'POST',
        body: JSON.stringify(tournamentConfig),
      });

      return response;
    } catch (error) {
      console.error('Create tournament error:', error);
      throw new Error(error.message || 'Failed to create tournament');
    }
  }

  /**
   * Join a tournament
   */
  async joinTournament(tournamentId) {
    if (!tournamentId) {
      throw new Error('Tournament ID is required');
    }

    try {
      const response = await this.request(API_CONFIG.ENDPOINTS.TOURNAMENT.JOIN, {
        method: 'POST',
        body: JSON.stringify({ tournamentId }),
      });

      return response;
    } catch (error) {
      console.error('Join tournament error:', error);
      throw new Error(error.message || 'Failed to join tournament');
    }
  }

  /**
   * Get tournament brackets
   */
  async getTournamentBrackets(tournamentId) {
    if (!tournamentId) {
      throw new Error('Tournament ID is required');
    }

    try {
      const response = await this.request(`${API_CONFIG.ENDPOINTS.TOURNAMENT.BRACKETS}/${tournamentId}`, {
        method: 'GET',
      });

      return response;
    } catch (error) {
      console.error('Get tournament brackets error:', error);
      throw new Error(error.message || 'Failed to get tournament brackets');
    }
  }

  /**
   * Get list of available tournaments
   */
  async getAvailableTournaments() {
    try {
      const response = await this.request('/api/tournament/available', {
        method: 'GET',
      });

      return response;
    } catch (error) {
      console.error('Get available tournaments error:', error);
      throw new Error(error.message || 'Failed to get available tournaments');
    }
  }

  /**
   * Leave tournament
   */
  async leaveTournament(tournamentId) {
    if (!tournamentId) {
      throw new Error('Tournament ID is required');
    }

    try {
      const response = await this.request(`/api/tournament/${tournamentId}/leave`, {
        method: 'POST',
      });

      return response;
    } catch (error) {
      console.error('Leave tournament error:', error);
      throw new Error(error.message || 'Failed to leave tournament');
    }
  }

  /**
   * Get tournament rankings
   */
  async getTournamentRankings(tournamentId) {
    if (!tournamentId) {
      throw new Error('Tournament ID is required');
    }

    try {
      const response = await this.request(`/api/tournament/${tournamentId}/rankings`, {
        method: 'GET',
      });

      return response;
    } catch (error) {
      console.error('Get tournament rankings error:', error);
      throw new Error(error.message || 'Failed to get tournament rankings');
    }
  }
}

export default TournamentAPI;