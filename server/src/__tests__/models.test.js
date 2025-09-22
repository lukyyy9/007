// Model tests
const db = require('../models');
const { User, Game, Tournament, Match, GameAction, TournamentPlayer, CardDefinition } = db;

describe('Database Models', () => {
  beforeAll(async () => {
    // Sync database for testing
    await db.sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  describe('User Model', () => {
    test('should create a user with hashed password', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      };

      const user = await User.create(userData);
      
      expect(user.username).toBe('testuser');
      expect(user.email).toBe('test@example.com');
      expect(user.password).not.toBe('password123'); // Should be hashed
      expect(user.isActive).toBe(true);
    });

    test('should validate password correctly', async () => {
      const user = await User.findOne({ where: { username: 'testuser' } });
      
      const isValid = await user.validatePassword('password123');
      expect(isValid).toBe(true);
      
      const isInvalid = await user.validatePassword('wrongpassword');
      expect(isInvalid).toBe(false);
    });

    test('should not include password in JSON output', async () => {
      const user = await User.findOne({ where: { username: 'testuser' } });
      const userJSON = user.toJSON();
      
      expect(userJSON.password).toBeUndefined();
      expect(userJSON.username).toBe('testuser');
    });
  });

  describe('CardDefinition Model', () => {
    test('should create card definitions', async () => {
      const cardData = {
        id: 'test-card',
        name: 'Test Card',
        emoji: '🧪',
        cost: 1,
        description: 'A test card',
        effects: [
          { type: 'damage', value: 1, target: 'opponent', timing: 'immediate' }
        ],
        category: 'attack',
        rarity: 'common'
      };

      const card = await CardDefinition.create(cardData);
      
      expect(card.id).toBe('test-card');
      expect(card.name).toBe('Test Card');
      expect(card.cost).toBe(1);
      expect(card.effects).toHaveLength(1);
      expect(card.isActive).toBe(true);
    });
  });

  describe('Game Model', () => {
    let user1, user2;

    beforeEach(async () => {
      user1 = await User.create({
        username: 'player1',
        email: 'player1@example.com',
        password: 'password123'
      });
      
      user2 = await User.create({
        username: 'player2',
        email: 'player2@example.com',
        password: 'password123'
      });
    });

    test('should create a game with default values', async () => {
      const game = await Game.create({
        player1Id: user1.id,
        player2Id: user2.id
      });

      expect(game.status).toBe('waiting');
      expect(game.phase).toBe('selection');
      expect(game.currentTurn).toBe(1);
      expect(game.player1Health).toBe(6);
      expect(game.player2Health).toBe(6);
      expect(game.player1Charges).toBe(0);
      expect(game.player2Charges).toBe(0);
    });

    test('should establish associations with users', async () => {
      const game = await Game.create({
        player1Id: user1.id,
        player2Id: user2.id
      });

      const gameWithPlayers = await Game.findByPk(game.id, {
        include: [
          { model: User, as: 'player1' },
          { model: User, as: 'player2' }
        ]
      });

      expect(gameWithPlayers.player1.username).toBe('player1');
      expect(gameWithPlayers.player2.username).toBe('player2');
    });
  });

  describe('Tournament Model', () => {
    let creator;

    beforeEach(async () => {
      creator = await User.create({
        username: 'tournament_creator',
        email: 'creator@example.com',
        password: 'password123'
      });
    });

    test('should create a tournament with default values', async () => {
      const tournament = await Tournament.create({
        name: 'Test Tournament',
        maxPlayers: 8,
        creatorId: creator.id
      });

      expect(tournament.name).toBe('Test Tournament');
      expect(tournament.format).toBe('single-elimination');
      expect(tournament.status).toBe('waiting');
      expect(tournament.maxPlayers).toBe(8);
      expect(tournament.currentPlayers).toBe(0);
      expect(tournament.currentRound).toBe(1);
    });
  });

  describe('GameAction Model', () => {
    let user, game;

    beforeEach(async () => {
      user = await User.create({
        username: 'action_player',
        email: 'action@example.com',
        password: 'password123'
      });

      const user2 = await User.create({
        username: 'action_player2',
        email: 'action2@example.com',
        password: 'password123'
      });

      game = await Game.create({
        player1Id: user.id,
        player2Id: user2.id
      });
    });

    test('should create game actions', async () => {
      const action = await GameAction.create({
        gameId: game.id,
        playerId: user.id,
        turn: 1,
        step: 1,
        actionType: 'card_play',
        cardPlayed: 'tirer',
        actionData: { damage: 1 }
      });

      expect(action.gameId).toBe(game.id);
      expect(action.playerId).toBe(user.id);
      expect(action.turn).toBe(1);
      expect(action.step).toBe(1);
      expect(action.actionType).toBe('card_play');
      expect(action.cardPlayed).toBe('tirer');
    });
  });
});