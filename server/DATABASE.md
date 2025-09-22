# Database Setup Guide

This document explains how to set up and manage the PostgreSQL database for the Tactical Card Game.

## Prerequisites

- PostgreSQL 12+ installed and running
- Node.js and npm installed
- Environment variables configured (see `.env.example`)

## Database Models

The application uses the following Sequelize models:

### Core Models
- **User**: Player accounts with authentication
- **Game**: Individual game instances with player states
- **Tournament**: Tournament management and brackets
- **Match**: Match instances (can be part of tournaments)
- **GameAction**: Detailed game action logging
- **TournamentPlayer**: Tournament participation tracking
- **CardDefinition**: Card definitions and effects

### Model Relationships
- Users can have multiple games, tournaments, and matches
- Games belong to matches and track player states
- Tournaments contain multiple matches and players
- GameActions log all game events for replay/analysis

## Available Scripts

### Database Management
```bash
# Validate model structure (no DB connection required)
npm run db:validate

# Test database connection
npm run db:test

# Run all migrations to create tables
npm run db:migrate

# Rollback all migrations (drops all tables)
npm run db:rollback

# Seed card definitions
npm run db:seed

# Complete database initialization (migrate + seed)
npm run db:init
```

### Development
```bash
# Run tests
npm test

# Run tests in watch mode
npm test:watch

# Start development server
npm run dev
```

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

3. **Create Database**
   ```sql
   -- Connect to PostgreSQL as superuser
   CREATE DATABASE tactical_card_game;
   CREATE USER your_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE tactical_card_game TO your_user;
   ```

4. **Initialize Database**
   ```bash
   npm run db:init
   ```

5. **Verify Setup**
   ```bash
   npm run db:test
   ```

## Migration Files

Migrations are located in `src/scripts/migrations/` and run in order:

1. `001-create-users.js` - User accounts table
2. `002-create-tournaments.js` - Tournament management
3. `003-create-matches.js` - Match instances
4. `004-create-games.js` - Game states
5. `005-create-game-actions.js` - Action logging
6. `006-create-tournament-players.js` - Tournament participation
7. `007-create-card-definitions.js` - Card definitions

## Card Definitions

The system includes 12 predefined card types:

- **Charger** ⚡ - Gain 1 charge (0 cost)
- **Tirer** 🏹 - Deal 1 damage (1 charge)
- **Big Blast** 💥 - Deal 5 damage (3 charges)
- **Bloquer** 🛡️ - Block damage (0 cost)
- **Brûler** 🔥 - Damage + burn status (2 charges)
- **Riposte** ⚔️ - Block + counter damage (0 cost)
- **Furie** 😡 - Damage opponent and self (2 charges)
- **Armure magique** ✨ - Perfect block (3 charges)
- **Court circuit** ⚡ - Conditional charge gain (0 cost)
- **Vampirisme** 🧛 - Conditional healing (0 cost)
- **Tourmente** 🌪️ - Punish repeated cards (0 cost, step 1 only)

## Environment Variables

Required environment variables:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tactical_card_game
DB_USER=postgres
DB_PASSWORD=password

# Server
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h
```

## Troubleshooting

### Connection Issues
- Ensure PostgreSQL is running
- Verify database credentials in `.env`
- Check if database exists

### Migration Issues
- Run `npm run db:rollback` to reset
- Check PostgreSQL logs for detailed errors
- Ensure user has proper permissions

### Model Issues
- Run `npm run db:validate` to check structure
- Verify all model files are present
- Check for syntax errors in model definitions

## Production Considerations

- Use connection pooling (already configured)
- Set up proper database backups
- Use environment-specific configurations
- Monitor database performance
- Implement proper logging and error handling