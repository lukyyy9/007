# Tactical Card Game

A tactical multiplayer online card game built with React Native and Node.js.

## Project Structure

```
tactical-card-game/
├── client/                 # React Native mobile app
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── screens/        # Screen components
│   │   ├── services/       # API and Socket services
│   │   ├── context/        # React Context providers
│   │   └── utils/          # Utility functions
│   ├── App.js             # Main app component
│   └── package.json       # Client dependencies
├── server/                # Node.js Express server
│   ├── src/
│   │   ├── config/        # Database and app configuration
│   │   ├── models/        # Sequelize database models
│   │   ├── routes/        # Express API routes
│   │   ├── services/      # Business logic services
│   │   ├── middleware/    # Express middleware
│   │   └── index.js       # Server entry point
│   └── package.json       # Server dependencies
└── package.json           # Root package.json for scripts
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- PostgreSQL database
- Expo CLI (for React Native development)

### Installation

1. Clone the repository
2. Install dependencies for all projects:
   ```bash
   npm run install:all
   ```

3. Set up environment variables:
   ```bash
   cp server/.env.example server/.env
   # Edit server/.env with your database credentials
   ```

4. Start the development servers:
   ```bash
   npm run dev
   ```

This will start both the server (port 3000) and the React Native client.

### Development

- **Server**: `npm run server:dev` - Starts the Node.js server with nodemon
- **Client**: `npm run client:dev` - Starts the React Native development server
- **Both**: `npm run dev` - Starts both server and client concurrently

## Technology Stack

### Frontend (Client)
- React Native with Expo
- React Navigation for routing
- Socket.IO client for real-time communication
- AsyncStorage for local data persistence

### Backend (Server)
- Node.js with Express.js
- Socket.IO for WebSocket communication
- Sequelize ORM with PostgreSQL
- JWT for authentication
- Helmet and CORS for security

## Features

- Real-time 1v1 card battles
- Tournament system with brackets
- 12 unique card types with special effects
- Mobile-first responsive design
- Persistent game state and history

## API Documentation

API documentation will be available at `/api` once the server is running.

## Testing

- **Server tests**: `cd server && npm test`
- **Client tests**: `cd client && npm test`

## Contributing

1. Follow the implementation plan in `.kiro/specs/tactical-card-game/tasks.md`
2. Implement one task at a time
3. Write tests for new functionality
4. Update documentation as needed

## License

MIT