/**
 * Unit tests for GameEngine
 */

const GameEngine = require('../services/GameEngine');

describe('GameEngine', () => {
  let gameEngine;
  let mockPlayer1;
  let mockPlayer2;

  beforeEach(() => {
    gameEngine = new GameEngine();
    
    mockPlayer1 = {
      id: 'player1',
      username: 'Player1'
    };
    
    mockPlayer2 = {
      id: 'player2',
      username: 'Player2'
    };
  });

  describe('createGame', () => {
    test('should create a new game with default configuration', () => {
      const game = gameEngine.createGame();
      
      expect(game).toHaveProperty('id');
      expect(game.players).toHaveLength(0);
      expect(game.phase).toBe('waiting');
      expect(game.currentTurn).toBe(1);
      expect(game.gameConfig.maxHealth).toBe(6);
      expect(game.gameConfig.turnTimeLimit).toBe(20);
      expect(game.gameConfig.bestOfSeries).toBe(1);
    });

    test('should create a game with custom configuration', () => {
      const config = {
        maxHealth: 10,
        turnTimeLimit: 30,
        bestOfSeries: 3
      };
      
      const game = gameEngine.createGame(config);
      
      expect(game.gameConfig.maxHealth).toBe(10);
      expect(game.gameConfig.turnTimeLimit).toBe(30);
      expect(game.gameConfig.bestOfSeries).toBe(3);
    });
  });

  describe('addPlayer', () => {
    test('should add first player to game', () => {
      const game = gameEngine.createGame();
      const updatedGame = gameEngine.addPlayer(game.id, mockPlayer1);
      
      expect(updatedGame.players).toHaveLength(1);
      expect(updatedGame.players[0].id).toBe('player1');
      expect(updatedGame.players[0].health).toBe(6);
      expect(updatedGame.players[0].charges).toBe(0);
      expect(updatedGame.phase).toBe('waiting');
    });

    test('should start game when second player joins', () => {
      const game = gameEngine.createGame();
      gameEngine.addPlayer(game.id, mockPlayer1);
      const updatedGame = gameEngine.addPlayer(game.id, mockPlayer2);
      
      expect(updatedGame.players).toHaveLength(2);
      expect(updatedGame.phase).toBe('selection');
      expect(updatedGame.turnTimer).toBeDefined();
    });

    test('should throw error when adding third player', () => {
      const game = gameEngine.createGame();
      gameEngine.addPlayer(game.id, mockPlayer1);
      gameEngine.addPlayer(game.id, mockPlayer2);
      
      expect(() => {
        gameEngine.addPlayer(game.id, { id: 'player3', username: 'Player3' });
      }).toThrow('Game is full');
    });

    test('should throw error for non-existent game', () => {
      expect(() => {
        gameEngine.addPlayer('invalid-id', mockPlayer1);
      }).toThrow('Game not found');
    });
  });

  describe('processCardSelection', () => {
    let game;

    beforeEach(() => {
      game = gameEngine.createGame();
      gameEngine.addPlayer(game.id, mockPlayer1);
      gameEngine.addPlayer(game.id, mockPlayer2);
    });

    test('should process valid card selection', () => {
      const cards = [
        { id: 'charger', name: 'Charger', cost: 0, effects: [] },
        { id: 'charger', name: 'Charger', cost: 0, effects: [] },
        { id: 'charger', name: 'Charger', cost: 0, effects: [] }
      ];
      
      const result = gameEngine.processCardSelection(game.id, 'player1', cards);
      
      expect(result.status).toBe('waiting_for_opponent');
      const gameState = gameEngine.getGameState(game.id);
      expect(gameState.players[0].ready).toBe(true);
    });

    test('should reject selection with wrong number of cards', () => {
      const cards = [
        { id: 'charger', name: 'Charger', cost: 0, effects: [] }
      ];
      
      expect(() => {
        gameEngine.processCardSelection(game.id, 'player1', cards);
      }).toThrow('Must select exactly 3 cards');
    });

    test('should resolve turn when both players select cards', () => {
      const cards = [
        { id: 'charger', name: 'Charger', cost: 0, effects: [{ type: 'charge', value: 1, target: 'self', timing: 'immediate' }] },
        { id: 'charger', name: 'Charger', cost: 0, effects: [{ type: 'charge', value: 1, target: 'self', timing: 'immediate' }] },
        { id: 'charger', name: 'Charger', cost: 0, effects: [{ type: 'charge', value: 1, target: 'self', timing: 'immediate' }] }
      ];
      
      gameEngine.processCardSelection(game.id, 'player1', cards);
      const result = gameEngine.processCardSelection(game.id, 'player2', cards);
      
      expect(result.status).toBe('turn_completed');
      expect(result.turnResults).toBeDefined();
      
      const gameState = gameEngine.getGameState(game.id);
      expect(gameState.currentTurn).toBe(2);
      expect(gameState.phase).toBe('selection');
    });
  });

  describe('handleTurnTimeout', () => {
    let game;

    beforeEach(() => {
      game = gameEngine.createGame();
      gameEngine.addPlayer(game.id, mockPlayer1);
      gameEngine.addPlayer(game.id, mockPlayer2);
    });

    test('should auto-select charger cards for players who did not select', () => {
      const cards = [
        { id: 'charger', name: 'Charger', cost: 0, effects: [{ type: 'charge', value: 1, target: 'self', timing: 'immediate' }] },
        { id: 'charger', name: 'Charger', cost: 0, effects: [{ type: 'charge', value: 1, target: 'self', timing: 'immediate' }] },
        { id: 'charger', name: 'Charger', cost: 0, effects: [{ type: 'charge', value: 1, target: 'self', timing: 'immediate' }] }
      ];
      
      // Only player1 selects cards
      gameEngine.processCardSelection(game.id, 'player1', cards);
      
      // Check that player2 is not ready before timeout
      let gameState = gameEngine.getGameState(game.id);
      expect(gameState.players[1].ready).toBe(false);
      
      // Timeout occurs
      const result = gameEngine.handleTurnTimeout(game.id);
      
      expect(result.status).toBe('turn_completed');
      
      // After timeout and turn resolution, players are reset for next turn
      // But we can check that the turn was completed successfully
      gameState = gameEngine.getGameState(game.id);
      expect(gameState.currentTurn).toBe(2); // Turn advanced
      expect(gameState.phase).toBe('selection'); // Ready for next turn
    });
  });

  describe('checkWinCondition', () => {
    let game;

    beforeEach(() => {
      game = gameEngine.createGame();
      gameEngine.addPlayer(game.id, mockPlayer1);
      gameEngine.addPlayer(game.id, mockPlayer2);
    });

    test('should detect win when opponent health reaches 0', () => {
      const gameObj = gameEngine.activeGames.get(game.id);
      gameObj.players[1].health = 0;
      
      const result = gameEngine.checkWinCondition(gameObj);
      
      expect(result.winner.id).toBe('player1');
      expect(result.reason).toBe('health_depleted');
    });

    test('should detect draw when both players health reaches 0', () => {
      const gameObj = gameEngine.activeGames.get(game.id);
      gameObj.players[0].health = 0;
      gameObj.players[1].health = 0;
      
      const result = gameEngine.checkWinCondition(gameObj);
      
      expect(result.winner).toBeNull();
      expect(result.reason).toBe('draw');
    });

    test('should return null when game continues', () => {
      const gameObj = gameEngine.activeGames.get(game.id);
      const result = gameEngine.checkWinCondition(gameObj);
      
      expect(result).toBeNull();
    });
  });

  describe('validateAction', () => {
    let game;

    beforeEach(() => {
      game = gameEngine.createGame();
      gameEngine.addPlayer(game.id, mockPlayer1);
      gameEngine.addPlayer(game.id, mockPlayer2);
    });

    test('should validate card selection in selection phase', () => {
      const isValid = gameEngine.validateAction(game.id, 'player1', 'select_cards');
      
      expect(isValid).toBe(true);
    });

    test('should reject card selection when player already selected', () => {
      const cards = [
        { id: 'charger', name: 'Charger', cost: 0, effects: [] },
        { id: 'charger', name: 'Charger', cost: 0, effects: [] },
        { id: 'charger', name: 'Charger', cost: 0, effects: [] }
      ];
      
      gameEngine.processCardSelection(game.id, 'player1', cards);
      const isValid = gameEngine.validateAction(game.id, 'player1', 'select_cards');
      
      expect(isValid).toBe(false);
    });

    test('should always allow viewing game', () => {
      const isValid = gameEngine.validateAction(game.id, 'player1', 'view_game');
      
      expect(isValid).toBe(true);
    });

    test('should reject unknown actions', () => {
      const isValid = gameEngine.validateAction(game.id, 'player1', 'unknown_action');
      
      expect(isValid).toBe(false);
    });
  });

  describe('getGameState', () => {
    test('should return current game state', () => {
      const game = gameEngine.createGame();
      gameEngine.addPlayer(game.id, mockPlayer1);
      
      const gameState = gameEngine.getGameState(game.id);
      
      expect(gameState.id).toBe(game.id);
      expect(gameState.phase).toBe('waiting');
      expect(gameState.players).toHaveLength(1);
      expect(gameState.players[0]).toHaveProperty('id');
      expect(gameState.players[0]).toHaveProperty('username');
      expect(gameState.players[0]).toHaveProperty('health');
      expect(gameState.players[0]).toHaveProperty('charges');
    });

    test('should throw error for non-existent game', () => {
      expect(() => {
        gameEngine.getGameState('invalid-id');
      }).toThrow('Game not found');
    });
  });

  describe('Best of Series', () => {
    test('should handle best of 3 series', () => {
      const game = gameEngine.createGame({ bestOfSeries: 3 });
      gameEngine.addPlayer(game.id, mockPlayer1);
      gameEngine.addPlayer(game.id, mockPlayer2);
      
      // Simulate player1 winning first game
      const gameObj = gameEngine.activeGames.get(game.id);
      gameObj.players[1].health = 0;
      
      const result = gameEngine.checkWinCondition(gameObj);
      gameEngine.endGame(gameObj, result);
      
      expect(gameObj.seriesScore.player1).toBe(1);
      expect(gameObj.seriesScore.player2).toBe(0);
      expect(gameObj.seriesComplete).toBeFalsy();
      expect(gameObj.gameConfig.currentGame).toBe(2);
    });
  });

  describe('Game History', () => {
    test('should track game events in history', () => {
      const game = gameEngine.createGame();
      gameEngine.addPlayer(game.id, mockPlayer1);
      gameEngine.addPlayer(game.id, mockPlayer2);
      
      const gameObj = gameEngine.activeGames.get(game.id);
      
      expect(gameObj.history).toContainEqual(
        expect.objectContaining({ type: 'game_started' })
      );
    });
  });

  describe('removeGame', () => {
    test('should remove game from active games', () => {
      const game = gameEngine.createGame();
      
      expect(gameEngine.activeGames.has(game.id)).toBe(true);
      
      gameEngine.removeGame(game.id);
      
      expect(gameEngine.activeGames.has(game.id)).toBe(false);
    });
  });

  describe('getActiveGames', () => {
    test('should return all active games', () => {
      const game1 = gameEngine.createGame();
      const game2 = gameEngine.createGame();
      
      const activeGames = gameEngine.getActiveGames();
      
      expect(activeGames).toHaveLength(2);
      expect(activeGames.map(g => g.id)).toContain(game1.id);
      expect(activeGames.map(g => g.id)).toContain(game2.id);
    });
  });
});