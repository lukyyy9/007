const GameEngine = require('../services/GameEngine');
const GameSettingsService = require('../services/GameSettingsService');

describe('Series Management', () => {
  let gameEngine;
  let gameSettingsService;

  beforeEach(() => {
    gameEngine = new GameEngine();
    gameSettingsService = new GameSettingsService();
  });

  describe('Single Game Series', () => {
    test('should handle single game completion', () => {
      const gameConfig = {
        maxHealth: 6,
        turnTimeLimit: 20,
        bestOfSeries: 1,
        gameMode: 'standard'
      };

      const game = gameEngine.createGame(gameConfig);
      
      // Add players
      gameEngine.addPlayer(game.id, { id: 'player1', username: 'Player1' });
      gameEngine.addPlayer(game.id, { id: 'player2', username: 'Player2' });

      // Simulate game end
      const gameObj = gameEngine.activeGames.get(game.id);
      gameObj.players[1].health = 0; // Player 2 loses

      const result = gameEngine.checkWinCondition(gameObj);
      expect(result.winner.id).toBe('player1');

      gameEngine.endGame(gameObj, result);

      expect(gameObj.phase).toBe('ended');
      expect(gameObj.winner.id).toBe('player1');
      expect(gameObj.seriesComplete).toBeUndefined(); // Single games don't set this
    });
  });

  describe('Best of 3 Series', () => {
    test('should handle series progression', () => {
      const gameConfig = {
        maxHealth: 6,
        turnTimeLimit: 20,
        bestOfSeries: 3,
        gameMode: 'standard'
      };

      const game = gameEngine.createGame(gameConfig);
      
      // Add players
      gameEngine.addPlayer(game.id, { id: 'player1', username: 'Player1' });
      gameEngine.addPlayer(game.id, { id: 'player2', username: 'Player2' });

      const gameObj = gameEngine.activeGames.get(game.id);

      // Game 1: Player 1 wins
      gameObj.players[1].health = 0;
      let result = gameEngine.checkWinCondition(gameObj);
      gameEngine.endGame(gameObj, result);

      expect(gameObj.seriesScore.player1).toBe(1);
      expect(gameObj.seriesScore.player2).toBe(0);
      expect(gameObj.seriesComplete).toBeFalsy();
      expect(gameObj.phase).toBe('selection'); // Next game started

      // Game 2: Player 2 wins
      gameObj.players[0].health = 0;
      gameObj.players[1].health = 6; // Reset for test
      result = gameEngine.checkWinCondition(gameObj);
      gameEngine.endGame(gameObj, result);

      expect(gameObj.seriesScore.player1).toBe(1);
      expect(gameObj.seriesScore.player2).toBe(1);
      expect(gameObj.seriesComplete).toBeFalsy();

      // Game 3: Player 1 wins series
      gameObj.players[1].health = 0;
      gameObj.players[0].health = 6; // Reset for test
      result = gameEngine.checkWinCondition(gameObj);
      gameEngine.endGame(gameObj, result);

      expect(gameObj.seriesScore.player1).toBe(2);
      expect(gameObj.seriesScore.player2).toBe(1);
      expect(gameObj.seriesComplete).toBe(true);
      expect(gameObj.seriesWinner.id).toBe('player1');
    });

    test('should handle early series completion', () => {
      const gameConfig = {
        maxHealth: 6,
        turnTimeLimit: 20,
        bestOfSeries: 3,
        gameMode: 'standard'
      };

      const game = gameEngine.createGame(gameConfig);
      
      // Add players
      gameEngine.addPlayer(game.id, { id: 'player1', username: 'Player1' });
      gameEngine.addPlayer(game.id, { id: 'player2', username: 'Player2' });

      const gameObj = gameEngine.activeGames.get(game.id);

      // Game 1: Player 1 wins
      gameObj.players[1].health = 0;
      let result = gameEngine.checkWinCondition(gameObj);
      gameEngine.endGame(gameObj, result);

      expect(gameObj.seriesScore.player1).toBe(1);
      expect(gameObj.seriesComplete).toBeFalsy();

      // Game 2: Player 1 wins series (2-0)
      gameObj.players[1].health = 0;
      gameObj.players[0].health = 6; // Reset for test
      result = gameEngine.checkWinCondition(gameObj);
      gameEngine.endGame(gameObj, result);

      expect(gameObj.seriesScore.player1).toBe(2);
      expect(gameObj.seriesScore.player2).toBe(0);
      expect(gameObj.seriesComplete).toBe(true);
      expect(gameObj.seriesWinner.id).toBe('player1');
    });
  });

  describe('Best of 5 Series', () => {
    test('should require 3 wins to complete', () => {
      const gameConfig = {
        maxHealth: 6,
        turnTimeLimit: 20,
        bestOfSeries: 5,
        gameMode: 'standard'
      };

      const game = gameEngine.createGame(gameConfig);
      
      // Add players
      gameEngine.addPlayer(game.id, { id: 'player1', username: 'Player1' });
      gameEngine.addPlayer(game.id, { id: 'player2', username: 'Player2' });

      const gameObj = gameEngine.activeGames.get(game.id);

      // Simulate alternating wins until one player gets 3
      const wins = [
        'player1', // 1-0
        'player2', // 1-1
        'player1', // 2-1
        'player2', // 2-2
        'player1'  // 3-2 - series complete
      ];

      wins.forEach((winner, index) => {
        if (winner === 'player1') {
          gameObj.players[1].health = 0;
          gameObj.players[0].health = 6;
        } else {
          gameObj.players[0].health = 0;
          gameObj.players[1].health = 6;
        }

        const result = gameEngine.checkWinCondition(gameObj);
        gameEngine.endGame(gameObj, result);

        if (index < 4) {
          expect(gameObj.seriesComplete).toBeFalsy();
        } else {
          expect(gameObj.seriesComplete).toBe(true);
          expect(gameObj.seriesWinner.id).toBe('player1');
          expect(gameObj.seriesScore.player1).toBe(3);
          expect(gameObj.seriesScore.player2).toBe(2);
        }
      });
    });
  });

  describe('Series Status Calculation', () => {
    test('should calculate correct series status', () => {
      const gameConfig = {
        maxHealth: 6,
        turnTimeLimit: 20,
        bestOfSeries: 3,
        gameMode: 'standard'
      };

      const game = gameEngine.createGame(gameConfig);
      
      // Add players
      gameEngine.addPlayer(game.id, { id: 'player1', username: 'Player1' });
      gameEngine.addPlayer(game.id, { id: 'player2', username: 'Player2' });

      const gameObj = gameEngine.activeGames.get(game.id);

      // Initial status
      let status = gameEngine.getSeriesStatus(gameObj);
      expect(status.bestOfSeries).toBe(3);
      expect(status.winsNeeded).toBe(2);
      expect(status.currentGameNumber).toBe(1);
      expect(status.isComplete).toBe(false);
      expect(status.summary).toBe('Best of 3 - Game 1 (0-0)');

      // After first game
      gameObj.seriesScore.player1 = 1;
      status = gameEngine.getSeriesStatus(gameObj);
      expect(status.currentGameNumber).toBe(2);
      expect(status.summary).toBe('Best of 3 - Game 2 (1-0)');

      // Series complete
      gameObj.seriesScore.player1 = 2;
      status = gameEngine.getSeriesStatus(gameObj);
      expect(status.isComplete).toBe(true);
      expect(status.winner).toBe('player1');
      expect(status.summary).toBe('Series Complete - Player 1 wins 2-0');
    });
  });

  describe('Game State with Series Info', () => {
    test('should include series information in game state', () => {
      const gameConfig = {
        maxHealth: 6,
        turnTimeLimit: 20,
        bestOfSeries: 3,
        gameMode: 'standard'
      };

      const game = gameEngine.createGame(gameConfig);
      
      // Add players
      gameEngine.addPlayer(game.id, { id: 'player1', username: 'Player1' });
      gameEngine.addPlayer(game.id, { id: 'player2', username: 'Player2' });

      const gameState = gameEngine.getGameState(game.id);

      expect(gameState.seriesScore).toEqual({ player1: 0, player2: 0 });
      expect(gameState.seriesStatus).toBeDefined();
      expect(gameState.seriesStatus.bestOfSeries).toBe(3);
      expect(gameState.seriesStatus.winsNeeded).toBe(2);
      expect(gameState.seriesComplete).toBe(false);
      expect(gameState.seriesWinner).toBe(null);
    });
  });

  describe('GameSettingsService Integration', () => {
    test('should calculate series status correctly', () => {
      // Test various series configurations
      const testCases = [
        { bestOf: 1, score: { player1: 0, player2: 0 }, expectedWinsNeeded: 1 },
        { bestOf: 3, score: { player1: 1, player2: 0 }, expectedWinsNeeded: 2 },
        { bestOf: 5, score: { player1: 2, player2: 1 }, expectedWinsNeeded: 3 },
        { bestOf: 7, score: { player1: 3, player2: 2 }, expectedWinsNeeded: 4 },
      ];

      testCases.forEach(({ bestOf, score, expectedWinsNeeded }) => {
        const status = gameSettingsService.calculateSeriesStatus(score, bestOf);
        expect(status.winsNeeded).toBe(expectedWinsNeeded);
        expect(status.player1Wins).toBe(score.player1);
        expect(status.player2Wins).toBe(score.player2);
      });
    });

    test('should update series score correctly', () => {
      const currentScore = { player1: 1, player2: 1 };
      const bestOfSeries = 3;

      // Player 1 wins
      const result = gameSettingsService.updateSeriesScore(currentScore, 'player1', bestOfSeries);
      
      expect(result.newScore).toEqual({ player1: 2, player2: 1 });
      expect(result.shouldContinueSeries).toBe(false); // Series complete
      expect(result.seriesWinner).toBe('player1');
      expect(result.summary).toBe('Series Complete - Player 1 wins 2-1');
    });

    test('should handle series continuation', () => {
      const currentScore = { player1: 1, player2: 0 };
      const bestOfSeries = 5;

      const result = gameSettingsService.updateSeriesScore(currentScore, 'player2', bestOfSeries);
      
      expect(result.newScore).toEqual({ player1: 1, player2: 1 });
      expect(result.shouldContinueSeries).toBe(true);
      expect(result.seriesWinner).toBe(null);
      expect(result.summary).toBe('Best of 5 - Game 3 (1-1)');
    });
  });

  describe('Series History Tracking', () => {
    test('should track series events in game history', () => {
      const gameConfig = {
        maxHealth: 6,
        turnTimeLimit: 20,
        bestOfSeries: 3,
        gameMode: 'standard'
      };

      const game = gameEngine.createGame(gameConfig);
      
      // Add players
      gameEngine.addPlayer(game.id, { id: 'player1', username: 'Player1' });
      gameEngine.addPlayer(game.id, { id: 'player2', username: 'Player2' });

      const gameObj = gameEngine.activeGames.get(game.id);

      // Win first game
      gameObj.players[1].health = 0;
      const result = gameEngine.checkWinCondition(gameObj);
      gameEngine.endGame(gameObj, result);

      // Check history contains series events
      const seriesEvents = gameObj.history.filter(event => 
        event.type === 'game_ended_in_series' || 
        event.type === 'next_game_started' ||
        event.type === 'series_ended'
      );

      expect(seriesEvents.length).toBeGreaterThan(0);
      
      const gameEndedEvent = gameObj.history.find(event => event.type === 'game_ended_in_series');
      expect(gameEndedEvent).toBeDefined();
      expect(gameEndedEvent.currentScore).toEqual({ player1: 1, player2: 0 });
      expect(gameEndedEvent.nextGameNumber).toBe(2);
    });
  });
});