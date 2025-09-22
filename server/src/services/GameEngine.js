/**
 * Core Game Engine
 * Handles game logic, turn resolution, and player state management
 */

const CardEffectsSystem = require('./CardEffectsSystem');
const { v4: uuidv4 } = require('uuid');

class GameEngine {
  constructor() {
    this.cardEffectsSystem = new CardEffectsSystem();
    this.activeGames = new Map(); // In-memory game storage
  }

  /**
   * Creates a new game instance
   * @param {Object} gameConfig - Game configuration
   * @returns {Object} - Game object
   */
  createGame(gameConfig = {}) {
    const gameId = uuidv4();
    
    const game = {
      id: gameId,
      players: [],
      currentTurn: 1,
      phase: 'waiting', // 'waiting', 'selection', 'resolution', 'ended'
      turnTimer: null,
      gameConfig: {
        maxHealth: gameConfig.maxHealth || 6,
        turnTimeLimit: gameConfig.turnTimeLimit || 20,
        bestOfSeries: gameConfig.bestOfSeries || 1,
        currentGame: 1
      },
      history: [],
      createdAt: new Date(),
      winner: null,
      seriesScore: { player1: 0, player2: 0 }
    };

    this.activeGames.set(gameId, game);
    return game;
  }

  /**
   * Adds a player to the game
   * @param {string} gameId - Game ID
   * @param {Object} playerData - Player information
   * @returns {Object} - Updated game object
   */
  addPlayer(gameId, playerData) {
    const game = this.activeGames.get(gameId);
    if (!game) {
      throw new Error('Game not found');
    }

    if (game.players.length >= 2) {
      throw new Error('Game is full');
    }

    if (game.phase !== 'waiting') {
      throw new Error('Cannot join game in progress');
    }

    const player = {
      id: playerData.id,
      username: playerData.username,
      health: game.gameConfig.maxHealth,
      charges: 0,
      statusEffects: [],
      blockValue: 0,
      selectedCards: [],
      ready: false
    };

    game.players.push(player);

    // Start game if we have 2 players
    if (game.players.length === 2) {
      this.startGame(gameId);
    }

    return game;
  }

  /**
   * Starts the game and begins first turn
   * @param {string} gameId - Game ID
   */
  startGame(gameId) {
    const game = this.activeGames.get(gameId);
    if (!game) {
      throw new Error('Game not found');
    }

    game.phase = 'selection';
    game.turnTimer = Date.now() + (game.gameConfig.turnTimeLimit * 1000);
    
    this.addToHistory(game, {
      type: 'game_started',
      turn: game.currentTurn,
      timestamp: new Date()
    });
  }

  /**
   * Processes card selection from a player
   * @param {string} gameId - Game ID
   * @param {string} playerId - Player ID
   * @param {Array} cards - Array of selected card IDs
   * @returns {Object} - Selection result
   */
  processCardSelection(gameId, playerId, cards) {
    const game = this.activeGames.get(gameId);
    if (!game) {
      throw new Error('Game not found');
    }

    if (game.phase !== 'selection') {
      throw new Error('Not in selection phase');
    }

    const player = game.players.find(p => p.id === playerId);
    if (!player) {
      throw new Error('Player not found');
    }

    if (player.ready) {
      throw new Error('Player already selected cards');
    }

    // Validate card selection
    if (cards.length !== 3) {
      throw new Error('Must select exactly 3 cards');
    }

    // Validate each card can be played
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      const validation = this.cardEffectsSystem.validateCardPlay(
        card, 
        player, 
        game, 
        i + 1 // Step number (1, 2, 3)
      );
      
      if (!validation.valid) {
        throw new Error(`Card ${card.name} cannot be played in step ${i + 1}: ${validation.reason}`);
      }
    }

    player.selectedCards = cards;
    player.ready = true;

    this.addToHistory(game, {
      type: 'cards_selected',
      playerId: playerId,
      turn: game.currentTurn,
      timestamp: new Date()
    });

    // Check if both players are ready
    if (game.players.every(p => p.ready)) {
      return this.resolveTurn(gameId);
    }

    return { status: 'waiting_for_opponent' };
  }

  /**
   * Handles turn timeout - auto-selects cards for players who haven't selected
   * @param {string} gameId - Game ID
   */
  handleTurnTimeout(gameId) {
    const game = this.activeGames.get(gameId);
    if (!game || game.phase !== 'selection') {
      return;
    }

    // Auto-select 3 Charger cards for players who haven't selected
    const chargerCard = {
      id: 'charger',
      name: 'Charger',
      emoji: '⚡',
      cost: 0,
      effects: [{ type: 'charge', value: 1, target: 'self', timing: 'immediate' }]
    };

    for (const player of game.players) {
      if (!player.ready) {
        player.selectedCards = [chargerCard, chargerCard, chargerCard];
        player.ready = true;
        
        this.addToHistory(game, {
          type: 'auto_selected',
          playerId: player.id,
          turn: game.currentTurn,
          timestamp: new Date()
        });
      }
    }

    return this.resolveTurn(gameId);
  }

  /**
   * Resolves the current turn by processing all card effects
   * @param {string} gameId - Game ID
   * @returns {Object} - Turn resolution result
   */
  resolveTurn(gameId) {
    const game = this.activeGames.get(gameId);
    if (!game) {
      throw new Error('Game not found');
    }

    game.phase = 'resolution';
    const [player1, player2] = game.players;
    const turnResults = [];

    // Process status effects at beginning of turn (burn damage)
    const player1StatusResults = this.cardEffectsSystem.processStatusEffects(player1);
    const player2StatusResults = this.cardEffectsSystem.processStatusEffects(player2);
    
    if (player1StatusResults.length > 0) {
      turnResults.push({ playerId: player1.id, effects: player1StatusResults });
    }
    if (player2StatusResults.length > 0) {
      turnResults.push({ playerId: player2.id, effects: player2StatusResults });
    }

    // Reset block values for this turn
    player1.blockValue = 0;
    player2.blockValue = 0;

    // Process each step (1, 2, 3)
    for (let step = 1; step <= 3; step++) {
      const stepResults = this.resolveStep(game, step);
      turnResults.push(...stepResults);

      // Check for game end after each step
      if (this.checkWinCondition(game)) {
        break;
      }
    }

    // Process end-of-turn effects (like Tourmente)
    const endOfTurnResults = this.processEndOfTurnEffects(game);
    turnResults.push(...endOfTurnResults);

    // Check win condition
    const gameResult = this.checkWinCondition(game);
    if (gameResult) {
      this.endGame(game, gameResult);
      return {
        status: 'game_ended',
        winner: gameResult.winner,
        reason: gameResult.reason,
        turnResults: turnResults
      };
    }

    // Prepare for next turn
    this.prepareNextTurn(game);

    return {
      status: 'turn_completed',
      turnResults: turnResults,
      nextTurn: game.currentTurn
    };
  }

  /**
   * Resolves a single step of the turn
   * @param {Object} game - Game object
   * @param {number} step - Step number (1, 2, or 3)
   * @returns {Array} - Step results
   */
  resolveStep(game, step) {
    const [player1, player2] = game.players;
    const stepResults = [];

    const card1 = player1.selectedCards[step - 1];
    const card2 = player2.selectedCards[step - 1];

    // Deduct charges for cards
    player1.charges = Math.max(0, player1.charges - card1.cost);
    player2.charges = Math.max(0, player2.charges - card2.cost);

    // Apply card effects
    const context1 = this.buildEffectContext(game, player1, player2, step);
    const context2 = this.buildEffectContext(game, player2, player1, step);

    const effects1 = this.cardEffectsSystem.applyCardEffects(card1, player1, player2, context1);
    const effects2 = this.cardEffectsSystem.applyCardEffects(card2, player2, player1, context2);

    stepResults.push({
      step: step,
      player1: { playerId: player1.id, card: card1, effects: effects1 },
      player2: { playerId: player2.id, card: card2, effects: effects2 }
    });

    this.addToHistory(game, {
      type: 'step_resolved',
      step: step,
      turn: game.currentTurn,
      player1Card: card1.name,
      player2Card: card2.name,
      timestamp: new Date()
    });

    return stepResults;
  }

  /**
   * Builds context for card effect application
   * @param {Object} game - Game object
   * @param {Object} player - Current player
   * @param {Object} opponent - Opponent player
   * @param {number} step - Current step
   * @returns {Object} - Effect context
   */
  buildEffectContext(game, player, opponent, step) {
    return {
      step: step,
      opponentBlocked: opponent.blockValue > 0,
      blockValue: opponent.blockValue,
      blockedDamage: 0, // This would be calculated during damage resolution
      repeatedCards: 0, // This would be calculated for Tourmente
      isEndOfTurn: false
    };
  }

  /**
   * Processes end-of-turn effects like Tourmente
   * @param {Object} game - Game object
   * @returns {Array} - End-of-turn results
   */
  processEndOfTurnEffects(game) {
    const [player1, player2] = game.players;
    const results = [];

    // Check for Tourmente effects
    for (const player of [player1, player2]) {
      const opponent = player === player1 ? player2 : player1;
      
      // Check if player played Tourmente in step 1
      const tourmenteCard = player.selectedCards[0];
      if (tourmenteCard && tourmenteCard.id === 'tourmente') {
        const repeatedCards = this.cardEffectsSystem.calculateRepeatedCards(opponent.selectedCards);
        
        if (repeatedCards > 0) {
          const context = {
            isEndOfTurn: true,
            repeatedCards: repeatedCards
          };
          
          const effects = this.cardEffectsSystem.applyCardEffects(tourmenteCard, player, opponent, context);
          results.push({
            playerId: player.id,
            effects: effects,
            type: 'end_of_turn'
          });
        }
      }
    }

    return results;
  }

  /**
   * Checks if the game has ended
   * @param {Object} game - Game object
   * @returns {Object|null} - Game result or null if game continues
   */
  checkWinCondition(game) {
    const [player1, player2] = game.players;

    if (player1.health <= 0 && player2.health <= 0) {
      return { winner: null, reason: 'draw' };
    }

    if (player1.health <= 0) {
      return { winner: player2, reason: 'health_depleted' };
    }

    if (player2.health <= 0) {
      return { winner: player1, reason: 'health_depleted' };
    }

    return null;
  }

  /**
   * Ends the current game
   * @param {Object} game - Game object
   * @param {Object} result - Game result
   */
  endGame(game, result) {
    game.phase = 'ended';
    game.winner = result.winner;
    
    // Update series score if it's a best-of series
    if (game.gameConfig.bestOfSeries > 1 && result.winner) {
      const gameWinner = result.winner.id === game.players[0].id ? 'player1' : 'player2';
      
      // Update series score
      if (gameWinner === 'player1') {
        game.seriesScore.player1++;
      } else {
        game.seriesScore.player2++;
      }

      // Check if series is complete
      const winsNeeded = Math.ceil(game.gameConfig.bestOfSeries / 2);
      const seriesComplete = game.seriesScore.player1 >= winsNeeded || game.seriesScore.player2 >= winsNeeded;
      
      if (seriesComplete) {
        game.seriesComplete = true;
        game.seriesWinner = game.seriesScore.player1 >= winsNeeded ? game.players[0] : game.players[1];
        
        this.addToHistory(game, {
          type: 'series_ended',
          seriesWinner: game.seriesWinner.id,
          finalScore: game.seriesScore,
          totalGames: game.seriesScore.player1 + game.seriesScore.player2,
          timestamp: new Date()
        });
      } else {
        // Prepare for next game in series
        this.addToHistory(game, {
          type: 'game_ended_in_series',
          gameWinner: result.winner?.id || null,
          reason: result.reason,
          currentScore: game.seriesScore,
          nextGameNumber: game.seriesScore.player1 + game.seriesScore.player2 + 1,
          timestamp: new Date()
        });
        
        // Start next game in series
        this.startNextGameInSeries(game);
        return;
      }
    }

    this.addToHistory(game, {
      type: 'game_ended',
      winner: result.winner?.id || null,
      reason: result.reason,
      timestamp: new Date()
    });
  }

  /**
   * Starts the next game in a best-of series
   * @param {Object} game - Game object
   */
  startNextGameInSeries(game) {
    // Reset player states for next game
    for (const player of game.players) {
      player.health = game.gameConfig.maxHealth;
      player.charges = 0;
      player.statusEffects = [];
      player.blockValue = 0;
      player.selectedCards = [];
      player.ready = false;
    }

    // Update game state for next game
    const nextGameNumber = game.seriesScore.player1 + game.seriesScore.player2 + 1;
    game.gameConfig.currentGame = nextGameNumber;
    game.currentTurn = 1;
    game.phase = 'selection';
    game.turnTimer = Date.now() + (game.gameConfig.turnTimeLimit * 1000);
    game.winner = null;

    this.addToHistory(game, {
      type: 'next_game_started',
      gameNumber: nextGameNumber,
      seriesScore: { ...game.seriesScore },
      winsNeeded: Math.ceil(game.gameConfig.bestOfSeries / 2),
      timestamp: new Date()
    });
  }

  /**
   * Prepares the game for the next turn
   * @param {Object} game - Game object
   */
  prepareNextTurn(game) {
    // Reset player ready states and selected cards
    for (const player of game.players) {
      player.ready = false;
      player.selectedCards = [];
      player.blockValue = 0;
    }

    game.currentTurn++;
    game.phase = 'selection';
    game.turnTimer = Date.now() + (game.gameConfig.turnTimeLimit * 1000);
  }

  /**
   * Gets the current game state
   * @param {string} gameId - Game ID
   * @returns {Object} - Game state
   */
  getGameState(gameId) {
    const game = this.activeGames.get(gameId);
    if (!game) {
      throw new Error('Game not found');
    }

    const seriesStatus = this.getSeriesStatus(game);

    return {
      id: game.id,
      phase: game.phase,
      currentTurn: game.currentTurn,
      turnTimer: game.turnTimer,
      players: game.players.map(p => ({
        id: p.id,
        username: p.username,
        health: p.health,
        charges: p.charges,
        statusEffects: p.statusEffects,
        ready: p.ready
      })),
      gameConfig: game.gameConfig,
      seriesScore: game.seriesScore,
      seriesStatus: seriesStatus,
      winner: game.winner,
      seriesWinner: game.seriesWinner || null,
      seriesComplete: game.seriesComplete || false
    };
  }

  /**
   * Gets series status information
   * @param {Object} game - Game object
   * @returns {Object} - Series status
   */
  getSeriesStatus(game) {
    const { bestOfSeries } = game.gameConfig;
    const { player1, player2 } = game.seriesScore;
    const winsNeeded = Math.ceil(bestOfSeries / 2);
    const totalGamesPlayed = player1 + player2;
    const currentGameNumber = totalGamesPlayed + 1;
    
    const isComplete = player1 >= winsNeeded || player2 >= winsNeeded;
    const winner = player1 >= winsNeeded ? 'player1' : 
                   player2 >= winsNeeded ? 'player2' : null;

    let summary;
    if (bestOfSeries === 1) {
      summary = 'Single Game';
    } else if (isComplete) {
      const winnerName = winner === 'player1' ? 'Player 1' : 'Player 2';
      summary = `Series Complete - ${winnerName} wins ${player1}-${player2}`;
    } else {
      summary = `Best of ${bestOfSeries} - Game ${currentGameNumber} (${player1}-${player2})`;
    }

    return {
      bestOfSeries,
      winsNeeded,
      player1Wins: player1,
      player2Wins: player2,
      totalGamesPlayed,
      currentGameNumber,
      isComplete,
      winner,
      summary,
      gamesRemaining: Math.max(0, bestOfSeries - totalGamesPlayed)
    };
  }

  /**
   * Validates if an action is allowed
   * @param {string} gameId - Game ID
   * @param {string} playerId - Player ID
   * @param {string} action - Action type
   * @returns {boolean} - Whether action is valid
   */
  validateAction(gameId, playerId, action) {
    const game = this.activeGames.get(gameId);
    if (!game) {
      return false;
    }

    const player = game.players.find(p => p.id === playerId);
    if (!player) {
      return false;
    }

    switch (action) {
      case 'select_cards':
        return game.phase === 'selection' && !player.ready;
      case 'view_game':
        return true;
      default:
        return false;
    }
  }

  /**
   * Adds an entry to the game history
   * @param {Object} game - Game object
   * @param {Object} entry - History entry
   */
  addToHistory(game, entry) {
    game.history.push(entry);
  }

  /**
   * Removes a game from active games
   * @param {string} gameId - Game ID
   */
  removeGame(gameId) {
    this.activeGames.delete(gameId);
  }

  /**
   * Gets all active games (for debugging/admin purposes)
   * @returns {Array} - Array of active games
   */
  getActiveGames() {
    return Array.from(this.activeGames.values());
  }
}

module.exports = GameEngine;