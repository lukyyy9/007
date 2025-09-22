// API configuration
const API_CONFIG = {
  // Server URL - update this based on your development setup
  BASE_URL: __DEV__
    ? (process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000')
    : 'https://your-production-server.com',

  // Socket.IO configuration
  SOCKET_URL: __DEV__
    ? (process.env.EXPO_PUBLIC_SOCKET_URL || 'http://localhost:3000')
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
    }
  },

  // Request timeout
  TIMEOUT: 10000,

  // Socket.IO options
  SOCKET_OPTIONS: {
    transports: ['websocket'],
    timeout: 5000,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
  }
};

export default API_CONFIG;