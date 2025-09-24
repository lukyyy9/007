import API_CONFIG from '../config/api';

class AuthAPI {
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
  }

  /**
   * Make HTTP request without authentication (for login/register)
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
   * Login user with credentials
   */
  async login(credentials) {
    const { email, password } = credentials;

    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    try {
      const response = await this.request(API_CONFIG.ENDPOINTS.AUTH.LOGIN, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (!response.token || !response.user) {
        throw new Error('Invalid response format');
      }

      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Login failed');
    }
  }

  /**
   * Register new user
   */
  async register(userData) {
    const { username, email, password } = userData;

    if (!username || !email || !password) {
      throw new Error('Username, email, and password are required');
    }

    try {
      const response = await this.request(API_CONFIG.ENDPOINTS.AUTH.REGISTER, {
        method: 'POST',
        body: JSON.stringify({ username, email, password }),
      });

      if (!response.token || !response.user) {
        throw new Error('Invalid response format');
      }

      return response;
    } catch (error) {
      console.error('Registration error:', error);
      throw new Error(error.message || 'Registration failed');
    }
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(refreshToken) {
    try {
      const response = await this.request(API_CONFIG.ENDPOINTS.AUTH.REFRESH, {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });

      return response;
    } catch (error) {
      console.error('Token refresh error:', error);
      throw new Error(error.message || 'Token refresh failed');
    }
  }

  /**
   * Validate token by making a test request
   */
  async validateToken(token) {
    try {
      const response = await this.request('/api/auth/validate', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response;
    } catch {
      return null;
    }
  }
}

export default AuthAPI;