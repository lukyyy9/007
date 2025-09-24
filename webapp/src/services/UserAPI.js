import API_CONFIG from '../config/api';

class UserAPI {
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
   * Get user profile
   */
  async getProfile() {
    try {
      const response = await this.request(API_CONFIG.ENDPOINTS.USER.PROFILE, {
        method: 'GET',
      });

      return response;
    } catch (error) {
      console.error('Get profile error:', error);
      throw new Error(error.message || 'Failed to get user profile');
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(profileData) {
    try {
      const response = await this.request(API_CONFIG.ENDPOINTS.USER.PROFILE, {
        method: 'PUT',
        body: JSON.stringify(profileData),
      });

      return response;
    } catch (error) {
      console.error('Update profile error:', error);
      throw new Error(error.message || 'Failed to update profile');
    }
  }

  /**
   * Get user stats
   */
  async getStats() {
    try {
      const response = await this.request(API_CONFIG.ENDPOINTS.USER.STATS, {
        method: 'GET',
      });

      return response;
    } catch (error) {
      console.error('Get stats error:', error);
      throw new Error(error.message || 'Failed to get user stats');
    }
  }
}

export default UserAPI;