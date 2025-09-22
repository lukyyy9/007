const GameSettingsService = require('../services/GameSettingsService');

describe('GameSettingsService', () => {
  let gameSettingsService;

  beforeEach(() => {
    gameSettingsService = new GameSettingsService();
  });

  describe('validateGameConfig', () => {
    test('should validate valid configuration', () => {
      const config = {
        maxHealth: 6,
        turnTimeLimit: 20,
        bestOfSeries: 3,
        gameMode: 'standard'
      };

      const result = gameSettingsService.validateGameConfig(config);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.config).toEqual(config);
    });

    test('should reject invalid maxHealth', () => {
      const config = { maxHealth: 100 };

      const result = gameSettingsService.validateGameConfig(config);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Max health must be between 1 and 50');
    });

    test('should reject invalid turnTimeLimit', () => {
      const config = { turnTimeLimit: 200 };

      const result = gameSettingsService.validateGameConfig(config);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Turn time limit must be between 5 and 120 seconds');
    });

    test('should reject invalid bestOfSeries', () => {
      const config = { bestOfSeries: 10 };

      const result = gameSettingsService.validateGameConfig(config);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Best of series must be between 1 and 7');
    });

    test('should reject invalid gameMode', () => {
      const config = { gameMode: 'invalid' };

      const result = gameSettingsService.validateGameConfig(config);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Game mode must be one of: standard, blitz, endurance');
    });

    test('should use default values for missing properties', () => {
      const config = { maxHealth: 10 };

      const result = gameSettingsService.validateGameConfig(config);

      expect(result.isValid).toBe(true);
      expect(result.config.turnTimeLimit).toBe(20);
      expect(result.config.bestOfSeries).toBe(1);
      expect(result.config.gameMode).toBe('standard');
    });
  });

  describe('applyGameModeModifiers', () => {
    test('should not modify standard mode', () => {
      const config = {
        maxHealth: 6,
        turnTimeLimit: 20,
        gameMode: 'standard'
      };

      const result = gameSettingsService.applyGameModeModifiers(config);

      expect(result.maxHealth).toBe(6);
      expect(result.turnTimeLimit).toBe(20);
      expect(result.description).toBe('Classic tactical card game experience');
    });

    test('should reduce timer for blitz mode', () => {
      const config = {
        maxHealth: 6,
        turnTimeLimit: 20,
        gameMode: 'blitz'
      };

      const result = gameSettingsService.applyGameModeModifiers(config);

      expect(result.maxHealth).toBe(6);
      expect(result.turnTimeLimit).toBe(15); // 20 * 0.75 = 15
      expect(result.description).toBe('Fast-paced gameplay with reduced turn timers');
    });

    test('should enforce minimum timer for blitz mode', () => {
      const config = {
        maxHealth: 6,
        turnTimeLimit: 6,
        gameMode: 'blitz'
      };

      const result = gameSettingsService.applyGameModeModifiers(config);

      expect(result.turnTimeLimit).toBe(5); // Minimum enforced
    });

    test('should increase health for endurance mode', () => {
      const config = {
        maxHealth: 6,
        turnTimeLimit: 20,
        gameMode: 'endurance'
      };

      const result = gameSettingsService.applyGameModeModifiers(config);

      expect(result.maxHealth).toBe(9); // 6 * 1.5 = 9
      expect(result.turnTimeLimit).toBe(20);
      expect(result.description).toBe('Extended matches with increased starting health');
    });
  });

  describe('calculateSeriesStatus', () => {
    test('should calculate status for single game', () => {
      const seriesScore = { player1: 0, player2: 0 };
      const bestOfSeries = 1;

      const result = gameSettingsService.calculateSeriesStatus(seriesScore, bestOfSeries);

      expect(result.isComplete).toBe(false);
      expect(result.winner).toBe(null);
      expect(result.winsNeeded).toBe(1);
      expect(result.currentGameNumber).toBe(1);
    });

    test('should calculate status for best of 3', () => {
      const seriesScore = { player1: 1, player2: 0 };
      const bestOfSeries = 3;

      const result = gameSettingsService.calculateSeriesStatus(seriesScore, bestOfSeries);

      expect(result.isComplete).toBe(false);
      expect(result.winner).toBe(null);
      expect(result.winsNeeded).toBe(2);
      expect(result.currentGameNumber).toBe(2);
      expect(result.gamesRemaining).toBe(2);
    });

    test('should detect series completion', () => {
      const seriesScore = { player1: 2, player2: 0 };
      const bestOfSeries = 3;

      const result = gameSettingsService.calculateSeriesStatus(seriesScore, bestOfSeries);

      expect(result.isComplete).toBe(true);
      expect(result.winner).toBe('player1');
      expect(result.winsNeeded).toBe(2);
    });

    test('should handle player2 winning', () => {
      const seriesScore = { player1: 1, player2: 3 };
      const bestOfSeries = 5;

      const result = gameSettingsService.calculateSeriesStatus(seriesScore, bestOfSeries);

      expect(result.isComplete).toBe(true);
      expect(result.winner).toBe('player2');
      expect(result.winsNeeded).toBe(3);
    });
  });

  describe('updateSeriesScore', () => {
    test('should update score for player1 win', () => {
      const currentScore = { player1: 0, player2: 1 };
      const gameWinner = 'player1';
      const bestOfSeries = 3;

      const result = gameSettingsService.updateSeriesScore(currentScore, gameWinner, bestOfSeries);

      expect(result.newScore).toEqual({ player1: 1, player2: 1 });
      expect(result.shouldContinueSeries).toBe(true);
      expect(result.seriesWinner).toBe(null);
    });

    test('should detect series completion', () => {
      const currentScore = { player1: 1, player2: 0 };
      const gameWinner = 'player1';
      const bestOfSeries = 3;

      const result = gameSettingsService.updateSeriesScore(currentScore, gameWinner, bestOfSeries);

      expect(result.newScore).toEqual({ player1: 2, player2: 0 });
      expect(result.shouldContinueSeries).toBe(false);
      expect(result.seriesWinner).toBe('player1');
    });

    test('should handle single game series', () => {
      const currentScore = { player1: 0, player2: 0 };
      const gameWinner = 'player2';
      const bestOfSeries = 1;

      const result = gameSettingsService.updateSeriesScore(currentScore, gameWinner, bestOfSeries);

      expect(result.newScore).toEqual({ player1: 0, player2: 1 });
      expect(result.shouldContinueSeries).toBe(false);
      expect(result.seriesWinner).toBe('player2');
    });
  });

  describe('createGameConfiguration', () => {
    test('should create valid configuration', () => {
      const userConfig = {
        maxHealth: 10,
        turnTimeLimit: 30,
        bestOfSeries: 3,
        gameMode: 'endurance'
      };
      const gameName = 'Test Game';

      const result = gameSettingsService.createGameConfiguration(userConfig, gameName);

      expect(result.name).toBe(gameName);
      expect(result.maxHealth).toBe(15); // Modified by endurance mode
      expect(result.turnTimeLimit).toBe(30);
      expect(result.bestOfSeries).toBe(3);
      expect(result.gameMode).toBe('endurance');
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.seriesStatus).toBeDefined();
    });

    test('should throw error for invalid configuration', () => {
      const userConfig = { maxHealth: 100 };

      expect(() => {
        gameSettingsService.createGameConfiguration(userConfig);
      }).toThrow('Invalid game configuration');
    });
  });

  describe('getSeriesSummary', () => {
    test('should return single game summary', () => {
      const seriesScore = { player1: 0, player2: 0 };
      const bestOfSeries = 1;

      const result = gameSettingsService.getSeriesSummary(seriesScore, bestOfSeries);

      expect(result).toBe('Single Game');
    });

    test('should return ongoing series summary', () => {
      const seriesScore = { player1: 1, player2: 0 };
      const bestOfSeries = 3;

      const result = gameSettingsService.getSeriesSummary(seriesScore, bestOfSeries);

      expect(result).toBe('Best of 3 - Game 2 (1-0)');
    });

    test('should return completed series summary', () => {
      const seriesScore = { player1: 2, player2: 1 };
      const bestOfSeries = 3;

      const result = gameSettingsService.getSeriesSummary(seriesScore, bestOfSeries);

      expect(result).toBe('Series Complete - Player 1 wins 2-1');
    });
  });

  describe('getConfigDisplayInfo', () => {
    test('should return display information', () => {
      const config = {
        maxHealth: 6,
        turnTimeLimit: 20,
        bestOfSeries: 3,
        gameMode: 'blitz'
      };

      const result = gameSettingsService.getConfigDisplayInfo(config);

      expect(result.gameMode.label).toBe('Blitz');
      expect(result.series.label).toBe('Best of 3');
      expect(result.timer.value).toBe(15); // Modified by blitz mode
      expect(result.health.value).toBe(6);
    });
  });
});