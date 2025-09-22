/**
 * Card Effects System
 * Handles validation and application of card effects in the tactical card game
 */

class CardEffectsSystem {
  constructor() {
    this.effectHandlers = {
      damage: this.handleDamageEffect.bind(this),
      heal: this.handleHealEffect.bind(this),
      charge: this.handleChargeEffect.bind(this),
      block: this.handleBlockEffect.bind(this),
      status: this.handleStatusEffect.bind(this)
    };
  }

  /**
   * Validates if a card can be played given current game state
   * @param {Object} card - Card definition
   * @param {Object} player - Player state
   * @param {Object} gameState - Current game state
   * @param {number} step - Current step (1, 2, or 3)
   * @returns {Object} - { valid: boolean, reason?: string }
   */
  validateCardPlay(card, player, gameState, step) {
    // Check charge cost
    if (card.cost > player.charges) {
      return {
        valid: false,
        reason: `Insufficient charges. Need ${card.cost}, have ${player.charges}`
      };
    }

    // Check step requirements (e.g., Tourmente must be played in step 1)
    if (card.conditions) {
      for (const condition of card.conditions) {
        if (condition.type === 'step_requirement' && condition.value !== step) {
          return {
            valid: false,
            reason: `${card.name} can only be played in step ${condition.value}`
          };
        }
      }
    }

    return { valid: true };
  }

  /**
   * Applies card effects to game state
   * @param {Object} card - Card definition
   * @param {Object} player - Player who played the card
   * @param {Object} opponent - Opponent player
   * @param {Object} context - Additional context (blocked damage, etc.)
   * @returns {Array} - Array of effect results
   */
  applyCardEffects(card, player, opponent, context = {}) {
    const results = [];

    for (const effect of card.effects) {
      // Check if effect should be applied based on timing and conditions
      if (this.shouldApplyEffect(effect, context)) {
        const result = this.applyEffect(effect, player, opponent, context);
        results.push(result);
      }
    }

    return results;
  }

  /**
   * Determines if an effect should be applied based on timing and conditions
   */
  shouldApplyEffect(effect, context) {
    // Handle conditional effects
    if (effect.timing === 'conditional') {
      switch (effect.condition) {
        case 'blocked_damage':
          return context.blockedDamage > 0;
        case 'opponent_blocked':
          return context.opponentBlocked === true;
        case 'opponent_not_blocked':
          return context.opponentBlocked === false;
        case 'repeated_cards':
          return context.repeatedCards > 0;
        default:
          return false;
      }
    }

    // Handle immediate effects (most common)
    if (effect.timing === 'immediate') {
      return true;
    }

    // End-of-turn effects are handled separately
    if (effect.timing === 'end-of-turn') {
      return context.isEndOfTurn === true;
    }

    return false;
  }

  /**
   * Applies a single effect
   */
  applyEffect(effect, player, opponent, context) {
    const handler = this.effectHandlers[effect.type];
    if (!handler) {
      throw new Error(`Unknown effect type: ${effect.type}`);
    }

    return handler(effect, player, opponent, context);
  }

  /**
   * Handle damage effects
   */
  handleDamageEffect(effect, player, opponent, context) {
    const target = effect.target === 'self' ? player : opponent;
    let damage = effect.value;

    // For repeated cards condition, multiply damage by repeated count
    if (effect.condition === 'repeated_cards' && context.repeatedCards) {
      damage = effect.value * context.repeatedCards;
    }

    // Apply damage considering blocks
    let actualDamage = damage;
    if (effect.target === 'opponent' && context.opponentBlocked) {
      actualDamage = Math.max(0, damage - context.blockValue);
    }

    target.health = Math.max(0, target.health - actualDamage);

    return {
      type: 'damage',
      target: effect.target,
      value: actualDamage,
      originalValue: damage,
      blocked: actualDamage < damage
    };
  }

  /**
   * Handle heal effects
   */
  handleHealEffect(effect, player, opponent, context) {
    const target = effect.target === 'self' ? player : opponent;
    const healAmount = effect.value;
    
    const oldHealth = target.health;
    target.health = Math.min(6, target.health + healAmount); // Max health is 6
    const actualHeal = target.health - oldHealth;

    return {
      type: 'heal',
      target: effect.target,
      value: actualHeal,
      originalValue: healAmount
    };
  }

  /**
   * Handle charge effects
   */
  handleChargeEffect(effect, player, opponent, context) {
    const target = effect.target === 'self' ? player : opponent;
    const chargeAmount = effect.value;
    
    target.charges += chargeAmount;

    return {
      type: 'charge',
      target: effect.target,
      value: chargeAmount
    };
  }

  /**
   * Handle block effects
   */
  handleBlockEffect(effect, player, opponent, context) {
    const target = effect.target === 'self' ? player : opponent;
    
    // Set block value for this step
    target.blockValue = effect.value;

    return {
      type: 'block',
      target: effect.target,
      value: effect.value
    };
  }

  /**
   * Handle status effects (burn, etc.)
   */
  handleStatusEffect(effect, player, opponent, context) {
    const target = effect.target === 'self' ? player : opponent;
    
    if (!target.statusEffects) {
      target.statusEffects = [];
    }

    // Add or update status effect
    const existingEffect = target.statusEffects.find(se => se.type === effect.statusType);
    if (existingEffect) {
      existingEffect.duration = Math.max(existingEffect.duration, effect.value);
    } else {
      target.statusEffects.push({
        type: effect.statusType,
        duration: effect.value,
        value: 1 // Default damage for burn
      });
    }

    return {
      type: 'status',
      target: effect.target,
      statusType: effect.statusType,
      duration: effect.value
    };
  }

  /**
   * Process status effects at the beginning of a turn (e.g., burn damage)
   */
  processStatusEffects(player) {
    const results = [];
    
    if (!player.statusEffects) {
      return results;
    }

    // Process each status effect
    for (let i = player.statusEffects.length - 1; i >= 0; i--) {
      const statusEffect = player.statusEffects[i];
      
      if (statusEffect.type === 'burn') {
        // Apply burn damage
        player.health = Math.max(0, player.health - statusEffect.value);
        results.push({
          type: 'burn_damage',
          target: 'self',
          value: statusEffect.value
        });
      }

      // Decrease duration
      statusEffect.duration--;
      
      // Remove expired effects
      if (statusEffect.duration <= 0) {
        player.statusEffects.splice(i, 1);
        results.push({
          type: 'status_expired',
          statusType: statusEffect.type
        });
      }
    }

    return results;
  }

  /**
   * Calculate repeated cards for Tourmente effect
   */
  calculateRepeatedCards(playerCards) {
    const cardCounts = {};
    let repeatedCount = 0;

    for (const card of playerCards) {
      cardCounts[card.id] = (cardCounts[card.id] || 0) + 1;
    }

    for (const [cardId, count] of Object.entries(cardCounts)) {
      if (count > 1) {
        repeatedCount += count - 1; // Count extra copies
      }
    }

    return repeatedCount;
  }
}

module.exports = CardEffectsSystem;