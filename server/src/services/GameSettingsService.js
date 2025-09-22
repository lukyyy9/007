/**
 * Game Settings Service
 * Handles game configuration validation, persistence, and series management
 */

class GameSettingsService {
  constructor() {
    this.defaultSettings = {
      maxHealth: 6,
      turnTimeLimit: 20,
      bestOfSeries: 1,
      gameMode: 'standard'
    };

    this.validationRules = {
      maxHealth: { min: 1, max: 50 },
      turnTimeLimit: { min: 5, max: 120 },
      bestOfSeries: { min: 1, max: 7 },
      gameMode: ['standard', 'blitz', 'endurance']
    };
  }

  /**
   * Validates game configuration
   * @param {Object} config - Game configuration to validate
   * @returns {Object} - Validation result with isValid and errors
   */
  validateGameConfig(config) {
    const errors = [];
    const validatedConfig = { ...this.defaultSettings, ...config };

    // Validate maxHealth
    if (validatedConfig.maxHealth < this.validationRules.maxHealth.min || 
        validatedConfig.maxHealth > this.validationRules.maxHealth.max) {
      errors.push(`Max health must be between ${this.validationRules.maxHealth.min} and ${this.validationRules.maxHealth.max}`);
    }

    // Validate turnTimeLimit
    if (validatedConfig.turnTimeLimit < this.validationRules.turnTimeLimit.min || 
        validatedConfig.turnTimeLimit > this.validationRules.turnTimeLimit.max) {
      errors.push(`Turn time limit must be between ${this.validationRules.turnTimeLimit.min} and ${this.validationRules.turnTimeLimit.max} seconds`);
    }

    // Validate bestOfSeries
    if (validatedConfig.bestOfSeries < this.validationRules.bestOfSeries.min || 
        validatedConfig.bestOfSeries > this.validationRules.bestOfSeries.max) {
      errors.push(`Best of series must be between ${this.validationRules.bestOfSeries.min} and ${this.validationRules.bestOfSeries.max}`);
    }

    // Validate gameMode
    if (!this.validationRules.gameMode.includes(validatedConfig.gameMode)) {
      errors.push(`Game mode must be one of: ${this.validationRules.gameMode.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      config: validatedConfig
    };
  }

  /**
   * Applies game mode modifiers to configuration
   * @param {Object} config - Base game configuration
   * @returns {Object} - Modified configuration
   */
  applyGameModeModifiers(config) {
    const modifiedConfig = { ...config };

    switch (config.gameMode) {
      case 'blitz':
        // Reduce timer by 25% for blitz mode (minimum 5 seconds)
        modifiedConfig.turnTimeLimit = Math.max(5, Math.floor(config.turnTimeLimit * 0.75));
        modifiedConfig.description = 'Fast-paced gameplay with reduced turn timers';
        break;
      
      case 'endurance':
        // Increase health by 50% for endurance mode
        modifiedConfig.maxHealth = Math.floor(config.maxHealth * 1.5);
        modifiedConfig.description = 'Extended matches with increased starting health';
        break;
      
      case 'standard':
      default:
        modifiedConfig.description = 'Classic tactical card game experience';
        break;
    }

    return modifiedConfig;
  }

  /**
   * Calculates series progress and determines if series is complete
   * @param {Object} seriesScore - Current series score { player1: number, player2: number }
   * @param {number} bestOfSeries - Best of X series configuration
   * @returns {Object} - Series status information
   */
  calculateSeriesStatus(seriesScore, bestOfSeries) {
    const winsNeeded = Math.ceil(bestOfSeries / 2);
    const player1Wins = seriesScore.player1 || 0;
    const player2Wins = seriesScore.player2 || 0;
    const totalGamesPlayed = player1Wins + player2Wins;

    const isComplete = player1Wins >= winsNeeded || player2Wins >= winsNeeded;
    const winner = player1Wins >= winsNeeded ? 'player1' : 
                   player2Wins >= winsNeeded ? 'player2' : null;

    return {
      isComplete,
      winner,
      winsNeeded,
      player1Wins,
      player2Wins,
      totalGamesPlayed,
      gamesRemaining: Math.max(0, bestOfSeries - totalGamesPlayed),
      currentGameNumber: totalGamesPlayed + 1
    };
  }

  /**
   * Generates a series summary for display
   * @param {Object} seriesScore - Current series score
   * @param {number} bestOfSeries - Best of X series configuration
   * @returns {string} - Human-readable series summary
   */
  getSeriesSummary(seriesScore, bestOfSeries) {
    if (bestOfSeries === 1) {
      return 'Single Game';
    }

    const status = this.calculateSeriesStatus(seriesScore, bestOfSeries);
    
    if (status.isComplete) {
      const winnerText = status.winner === 'player1' ? 'Player 1' : 'Player 2';
      return `Series Complete - ${winnerText} wins ${status.player1Wins}-${status.player2Wins}`;
    }

    return `Best of ${bestOfSeries} - Game ${status.currentGameNumber} (${status.player1Wins}-${status.player2Wins})`;
  }

  /**
   * Creates a complete game configuration with all settings applied
   * @param {Object} userConfig - User-provided configuration
   * @param {string} gameName - Optional game name
   * @returns {Object} - Complete game configuration
   */
  createGameConfiguration(userConfig = {}, gameName = null) {
    // Validate the configuration
    const validation = this.validateGameConfig(userConfig);
    if (!validation.isValid) {
      throw new Error(`Invalid game configuration: ${validation.errors.join(', ')}`);
    }

    // Apply game mode modifiers
    const finalConfig = this.applyGameModeModifiers(validation.config);

    // Add metadata
    finalConfig.createdAt = new Date();
    finalConfig.name = gameName;
    finalConfig.seriesStatus = this.calculateSeriesStatus({ player1: 0, player2: 0 }, finalConfig.bestOfSeries);

    return finalConfig;
  }

  /**
   * Updates series score and determines next action
   * @param {Object} currentSeriesScore - Current series score
   * @param {string} gameWinner - Winner of the current game ('player1' or 'player2')
   * @param {number} bestOfSeries - Best of X series configuration
   * @returns {Object} - Updated series information
   */
  updateSeriesScore(currentSeriesScore, gameWinner, bestOfSeries) {
    const newScore = { ...currentSeriesScore };
    
    if (gameWinner === 'player1') {
      newScore.player1 = (newScore.player1 || 0) + 1;
    } else if (gameWinner === 'player2') {
      newScore.player2 = (newScore.player2 || 0) + 1;
    }

    const status = this.calculateSeriesStatus(newScore, bestOfSeries);

    return {
      newScore,
      status,
      shouldContinueSeries: !status.isComplete && bestOfSeries > 1,
      seriesWinner: status.winner,
      summary: this.getSeriesSummary(newScore, bestOfSeries)
    };
  }

  /**
   * Gets display information for game configuration
   * @param {Object} config - Game configuration
   * @returns {Object} - Display-friendly configuration info
   */
  getConfigDisplayInfo(config) {
    const modifiedConfig = this.applyGameModeModifiers(config);
    
    return {
      gameMode: {
        value: config.gameMode,
        label: this.getGameModeLabel(config.gameMode),
        description: modifiedConfig.description
      },
      series: {
        value: config.bestOfSeries,
        label: config.bestOfSeries === 1 ? 'Single Game' : `Best of ${config.bestOfSeries}`,
        description: config.bestOfSeries === 1 ? 'Winner takes all' : `First to win ${Math.ceil(config.bestOfSeries / 2)} games`
      },
      timer: {
        value: modifiedConfig.turnTimeLimit,
        label: `${modifiedConfig.turnTimeLimit} seconds`,
        description: this.getTimerDescription(modifiedConfig.turnTimeLimit)
      },
      health: {
        value: modifiedConfig.maxHealth,
        label: `${modifiedConfig.maxHealth} ❤️`,
        description: `Starting health points`
      }
    };
  }

  /**
   * Gets human-readable game mode label
   * @param {string} gameMode - Game mode identifier
   * @returns {string} - Display label
   */
  getGameModeLabel(gameMode) {
    const labels = {
      standard: 'Standard',
      blitz: 'Blitz',
      endurance: 'Endurance'
    };
    return labels[gameMode] || 'Unknown';
  }

  /**
   * Gets description for timer setting
   * @param {number} seconds - Timer duration in seconds
   * @returns {string} - Timer description
   */
  getTimerDescription(seconds) {
    if (seconds <= 10) return 'Lightning fast';
    if (seconds <= 15) return 'Quick decisions';
    if (seconds <= 20) return 'Standard pace';
    if (seconds <= 30) return 'Thoughtful play';
    if (seconds <= 45) return 'Relaxed timing';
    return 'Maximum thinking time';
  }
}

module.exports = GameSettingsService;