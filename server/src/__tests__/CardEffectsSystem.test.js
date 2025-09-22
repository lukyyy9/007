/**
 * Unit tests for CardEffectsSystem
 */

const CardEffectsSystem = require('../services/CardEffectsSystem');

describe('CardEffectsSystem', () => {
  let cardEffectsSystem;
  let mockPlayer;
  let mockOpponent;

  beforeEach(() => {
    cardEffectsSystem = new CardEffectsSystem();
    
    mockPlayer = {
      id: 'player1',
      health: 6,
      charges: 3,
      statusEffects: [],
      blockValue: 0
    };
    
    mockOpponent = {
      id: 'player2',
      health: 6,
      charges: 2,
      statusEffects: [],
      blockValue: 0
    };
  });

  describe('validateCardPlay', () => {
    test('should validate card with sufficient charges', () => {
      const card = { id: 'tirer', cost: 1 };
      const result = cardEffectsSystem.validateCardPlay(card, mockPlayer, {}, 1);
      
      expect(result.valid).toBe(true);
    });

    test('should reject card with insufficient charges', () => {
      const card = { id: 'big-blast', cost: 5 };
      const result = cardEffectsSystem.validateCardPlay(card, mockPlayer, {}, 1);
      
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Insufficient charges');
    });

    test('should validate step requirements for Tourmente', () => {
      const tourmenteCard = {
        id: 'tourmente',
        cost: 0,
        conditions: [{ type: 'step_requirement', value: 1 }]
      };
      
      // Should be valid in step 1
      let result = cardEffectsSystem.validateCardPlay(tourmenteCard, mockPlayer, {}, 1);
      expect(result.valid).toBe(true);
      
      // Should be invalid in step 2
      result = cardEffectsSystem.validateCardPlay(tourmenteCard, mockPlayer, {}, 2);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('step 1');
    });
  });

  describe('Card Effects - Charger', () => {
    test('should increase player charges by 1', () => {
      const chargerCard = {
        id: 'charger',
        effects: [{ type: 'charge', value: 1, target: 'self', timing: 'immediate' }]
      };
      
      const results = cardEffectsSystem.applyCardEffects(chargerCard, mockPlayer, mockOpponent);
      
      expect(mockPlayer.charges).toBe(4);
      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        type: 'charge',
        target: 'self',
        value: 1
      });
    });
  });

  describe('Card Effects - Tirer', () => {
    test('should deal 1 damage to opponent', () => {
      const tirerCard = {
        id: 'tirer',
        effects: [{ type: 'damage', value: 1, target: 'opponent', timing: 'immediate' }]
      };
      
      const results = cardEffectsSystem.applyCardEffects(tirerCard, mockPlayer, mockOpponent);
      
      expect(mockOpponent.health).toBe(5);
      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        type: 'damage',
        target: 'opponent',
        value: 1,
        originalValue: 1,
        blocked: false
      });
    });

    test('should be blocked by Bloquer', () => {
      const tirerCard = {
        id: 'tirer',
        effects: [{ type: 'damage', value: 1, target: 'opponent', timing: 'immediate' }]
      };
      
      const context = { opponentBlocked: true, blockValue: 1 };
      const results = cardEffectsSystem.applyCardEffects(tirerCard, mockPlayer, mockOpponent, context);
      
      expect(mockOpponent.health).toBe(6); // No damage
      expect(results[0].value).toBe(0);
      expect(results[0].blocked).toBe(true);
    });
  });

  describe('Card Effects - Big Blast', () => {
    test('should deal 5 damage to opponent', () => {
      const bigBlastCard = {
        id: 'big-blast',
        effects: [{ type: 'damage', value: 5, target: 'opponent', timing: 'immediate' }]
      };
      
      const results = cardEffectsSystem.applyCardEffects(bigBlastCard, mockPlayer, mockOpponent);
      
      expect(mockOpponent.health).toBe(1);
      expect(results[0].value).toBe(5);
    });

    test('should be partially blocked by Bloquer', () => {
      const bigBlastCard = {
        id: 'big-blast',
        effects: [{ type: 'damage', value: 5, target: 'opponent', timing: 'immediate' }]
      };
      
      const context = { opponentBlocked: true, blockValue: 1 };
      const results = cardEffectsSystem.applyCardEffects(bigBlastCard, mockPlayer, mockOpponent, context);
      
      expect(mockOpponent.health).toBe(2); // 6 - 4 = 2 (5 damage - 1 block)
      expect(results[0].value).toBe(4);
      expect(results[0].blocked).toBe(true);
    });
  });

  describe('Card Effects - Bloquer', () => {
    test('should set block value', () => {
      const bloquerCard = {
        id: 'bloquer',
        effects: [{ type: 'block', value: 1, target: 'self', timing: 'immediate' }]
      };
      
      const results = cardEffectsSystem.applyCardEffects(bloquerCard, mockPlayer, mockOpponent);
      
      expect(mockPlayer.blockValue).toBe(1);
      expect(results[0]).toEqual({
        type: 'block',
        target: 'self',
        value: 1
      });
    });
  });

  describe('Card Effects - Brûler', () => {
    test('should deal damage and apply burn status', () => {
      const brulerCard = {
        id: 'bruler',
        effects: [
          { type: 'damage', value: 1, target: 'opponent', timing: 'immediate' },
          { type: 'status', value: 2, target: 'opponent', timing: 'immediate', statusType: 'burn' }
        ]
      };
      
      const results = cardEffectsSystem.applyCardEffects(brulerCard, mockPlayer, mockOpponent);
      
      expect(mockOpponent.health).toBe(5);
      expect(mockOpponent.statusEffects).toHaveLength(1);
      expect(mockOpponent.statusEffects[0]).toEqual({
        type: 'burn',
        duration: 2,
        value: 1
      });
      expect(results).toHaveLength(2);
    });
  });

  describe('Card Effects - Riposte', () => {
    test('should block and deal counter damage when blocking', () => {
      const riposteCard = {
        id: 'riposte',
        effects: [
          { type: 'block', value: 1, target: 'self', timing: 'immediate' },
          { type: 'damage', value: 2, target: 'opponent', timing: 'conditional', condition: 'blocked_damage' }
        ]
      };
      
      const context = { blockedDamage: 1 };
      const results = cardEffectsSystem.applyCardEffects(riposteCard, mockPlayer, mockOpponent, context);
      
      expect(mockPlayer.blockValue).toBe(1);
      expect(mockOpponent.health).toBe(4); // Counter damage
      expect(results).toHaveLength(2);
    });

    test('should only block when not blocking damage', () => {
      const riposteCard = {
        id: 'riposte',
        effects: [
          { type: 'block', value: 1, target: 'self', timing: 'immediate' },
          { type: 'damage', value: 2, target: 'opponent', timing: 'conditional', condition: 'blocked_damage' }
        ]
      };
      
      const context = { blockedDamage: 0 };
      const results = cardEffectsSystem.applyCardEffects(riposteCard, mockPlayer, mockOpponent, context);
      
      expect(mockPlayer.blockValue).toBe(1);
      expect(mockOpponent.health).toBe(6); // No counter damage
      expect(results).toHaveLength(1); // Only block effect
    });
  });

  describe('Card Effects - Furie', () => {
    test('should deal damage to opponent and self', () => {
      const furieCard = {
        id: 'furie',
        effects: [
          { type: 'damage', value: 3, target: 'opponent', timing: 'immediate' },
          { type: 'damage', value: 2, target: 'self', timing: 'immediate' }
        ]
      };
      
      const results = cardEffectsSystem.applyCardEffects(furieCard, mockPlayer, mockOpponent);
      
      expect(mockOpponent.health).toBe(3);
      expect(mockPlayer.health).toBe(4);
      expect(results).toHaveLength(2);
    });
  });

  describe('Card Effects - Armure magique', () => {
    test('should block all damage', () => {
      const armureMagiqueCard = {
        id: 'armure-magique',
        effects: [{ type: 'block', value: 999, target: 'self', timing: 'immediate' }]
      };
      
      const results = cardEffectsSystem.applyCardEffects(armureMagiqueCard, mockPlayer, mockOpponent);
      
      expect(mockPlayer.blockValue).toBe(999);
    });
  });

  describe('Card Effects - Court circuit', () => {
    test('should gain 2 charges when opponent blocked', () => {
      const courtCircuitCard = {
        id: 'court-circuit',
        effects: [
          { type: 'charge', value: 2, target: 'self', timing: 'conditional', condition: 'opponent_blocked' },
          { type: 'charge', value: 1, target: 'self', timing: 'conditional', condition: 'opponent_not_blocked' },
          { type: 'damage', value: 2, target: 'self', timing: 'conditional', condition: 'opponent_not_blocked' }
        ]
      };
      
      const context = { opponentBlocked: true };
      const results = cardEffectsSystem.applyCardEffects(courtCircuitCard, mockPlayer, mockOpponent, context);
      
      expect(mockPlayer.charges).toBe(5); // 3 + 2
      expect(mockPlayer.health).toBe(6); // No self damage
      expect(results).toHaveLength(1);
    });

    test('should gain 1 charge and take damage when opponent did not block', () => {
      const courtCircuitCard = {
        id: 'court-circuit',
        effects: [
          { type: 'charge', value: 2, target: 'self', timing: 'conditional', condition: 'opponent_blocked' },
          { type: 'charge', value: 1, target: 'self', timing: 'conditional', condition: 'opponent_not_blocked' },
          { type: 'damage', value: 2, target: 'self', timing: 'conditional', condition: 'opponent_not_blocked' }
        ]
      };
      
      const context = { opponentBlocked: false };
      const results = cardEffectsSystem.applyCardEffects(courtCircuitCard, mockPlayer, mockOpponent, context);
      
      expect(mockPlayer.charges).toBe(4); // 3 + 1
      expect(mockPlayer.health).toBe(4); // 6 - 2
      expect(results).toHaveLength(2);
    });
  });

  describe('Card Effects - Vampirisme', () => {
    test('should heal when opponent blocked', () => {
      mockPlayer.health = 4; // Reduce health to test healing
      
      const vampirismeCard = {
        id: 'vampirisme',
        effects: [
          { type: 'heal', value: 1, target: 'self', timing: 'conditional', condition: 'opponent_blocked' }
        ]
      };
      
      const context = { opponentBlocked: true };
      const results = cardEffectsSystem.applyCardEffects(vampirismeCard, mockPlayer, mockOpponent, context);
      
      expect(mockPlayer.health).toBe(5);
      expect(results).toHaveLength(1);
    });

    test('should not heal when opponent did not block', () => {
      mockPlayer.health = 4;
      
      const vampirismeCard = {
        id: 'vampirisme',
        effects: [
          { type: 'heal', value: 1, target: 'self', timing: 'conditional', condition: 'opponent_blocked' }
        ]
      };
      
      const context = { opponentBlocked: false };
      const results = cardEffectsSystem.applyCardEffects(vampirismeCard, mockPlayer, mockOpponent, context);
      
      expect(mockPlayer.health).toBe(4); // No healing
      expect(results).toHaveLength(0);
    });

    test('should not heal above maximum health', () => {
      mockPlayer.health = 6; // Already at max
      
      const vampirismeCard = {
        id: 'vampirisme',
        effects: [
          { type: 'heal', value: 1, target: 'self', timing: 'conditional', condition: 'opponent_blocked' }
        ]
      };
      
      const context = { opponentBlocked: true };
      const results = cardEffectsSystem.applyCardEffects(vampirismeCard, mockPlayer, mockOpponent, context);
      
      expect(mockPlayer.health).toBe(6);
      expect(results[0].value).toBe(0); // No actual healing
    });
  });

  describe('Card Effects - Tourmente', () => {
    test('should deal damage based on repeated cards at end of turn', () => {
      const tourmenteCard = {
        id: 'tourmente',
        effects: [
          { type: 'damage', value: 1, target: 'opponent', timing: 'end-of-turn', condition: 'repeated_cards' }
        ]
      };
      
      const context = { isEndOfTurn: true, repeatedCards: 2 };
      const results = cardEffectsSystem.applyCardEffects(tourmenteCard, mockPlayer, mockOpponent, context);
      
      expect(mockOpponent.health).toBe(4); // 6 - 2 damage
      expect(results).toHaveLength(1);
    });
  });

  describe('processStatusEffects', () => {
    test('should apply burn damage and decrease duration', () => {
      mockPlayer.statusEffects = [
        { type: 'burn', duration: 2, value: 1 }
      ];
      
      const results = cardEffectsSystem.processStatusEffects(mockPlayer);
      
      expect(mockPlayer.health).toBe(5); // 6 - 1 burn damage
      expect(mockPlayer.statusEffects[0].duration).toBe(1);
      expect(results).toHaveLength(1);
      expect(results[0].type).toBe('burn_damage');
    });

    test('should remove expired status effects', () => {
      mockPlayer.statusEffects = [
        { type: 'burn', duration: 1, value: 1 }
      ];
      
      const results = cardEffectsSystem.processStatusEffects(mockPlayer);
      
      expect(mockPlayer.health).toBe(5);
      expect(mockPlayer.statusEffects).toHaveLength(0);
      expect(results).toHaveLength(2); // burn_damage and status_expired
      expect(results[1].type).toBe('status_expired');
    });
  });

  describe('calculateRepeatedCards', () => {
    test('should count repeated cards correctly', () => {
      const playerCards = [
        { id: 'charger' },
        { id: 'charger' },
        { id: 'tirer' },
        { id: 'charger' },
        { id: 'bloquer' }
      ];
      
      const repeatedCount = cardEffectsSystem.calculateRepeatedCards(playerCards);
      
      expect(repeatedCount).toBe(2); // 3 chargers = 2 extra copies
    });

    test('should return 0 for no repeated cards', () => {
      const playerCards = [
        { id: 'charger' },
        { id: 'tirer' },
        { id: 'bloquer' }
      ];
      
      const repeatedCount = cardEffectsSystem.calculateRepeatedCards(playerCards);
      
      expect(repeatedCount).toBe(0);
    });
  });
});