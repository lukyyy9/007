// API configuration for webapp
const API_CONFIG = {
  // Server URL - update this based on your development setup
  BASE_URL: import.meta.env.DEV
    ? (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000')
    : 'https://your-production-server.com',

  // Socket.IO configuration
  SOCKET_URL: import.meta.env.DEV
    ? (import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000')
    : 'https://your-production-server.com',

  // API endpoints
  ENDPOINTS: {
    HEALTH: '/health',
    API_BASE: '/api',
    AUTH: {
      LOGIN: '/api/auth/login',
      REGISTER: '/api/auth/register',
      REFRESH: '/api/auth/refresh'
    },
    GAME: {
      CREATE: '/api/game/create',
      JOIN: '/api/game/join',
      STATUS: '/api/game/status'
    },
    TOURNAMENT: {
      CREATE: '/api/tournament/create',
      JOIN: '/api/tournament/join',
      BRACKETS: '/api/tournament/brackets'
    },
    USER: {
      PROFILE: '/api/user/profile',
      STATS: '/api/user/stats'
    }
  },

  // Request timeout in milliseconds
  TIMEOUT: 10000,
};

export default API_CONFIG;