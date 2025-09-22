const TournamentManager = require('../services/TournamentManager');

describe('TournamentManager Basic Tests', () => {
  let tournamentManager;

  beforeAll(() => {
    tournamentManager = new TournamentManager();
  });

  describe('Utility Functions', () => {
    test('should correctly identify powers of 2', () => {
      expect(tournamentManager.isPowerOfTwo(1)).toBe(true);
      expect(tournamentManager.isPowerOfTwo(2)).toBe(true);
      expect(tournamentManager.isPowerOfTwo(4)).toBe(true);
      expect(tournamentManager.isPowerOfTwo(8)).toBe(true);
      expect(tournamentManager.isPowerOfTwo(16)).toBe(true);
      expect(tournamentManager.isPowerOfTwo(32)).toBe(true);
      expect(tournamentManager.isPowerOfTwo(64)).toBe(true);

      expect(tournamentManager.isPowerOfTwo(0)).toBe(false);
      expect(tournamentManager.isPowerOfTwo(3)).toBe(false);
      expect(tournamentManager.isPowerOfTwo(5)).toBe(false);
      expect(tournamentManager.isPowerOfTwo(6)).toBe(false);
      expect(tournamentManager.isPowerOfTwo(7)).toBe(false);
      expect(tournamentManager.isPowerOfTwo(9)).toBe(false);
      expect(tournamentManager.isPowerOfTwo(15)).toBe(false);
    });

    test('should calculate loser bracket rounds', () => {
      // This is a simplified test - real double elimination is more complex
      const round = tournamentManager.calculateLoserBracketRound(1, 8);
      expect(typeof round).toBe('number');
      expect(round).toBeGreaterThan(0);
    });

    test('should format brackets correctly', () => {
      const mockMatches = [
        {
          id: '1',
          player1: { id: 'p1', username: 'player1' },
          player2: { id: 'p2', username: 'player2' },
          winner: null,
          status: 'pending',
          bracketRound: 1,
          bracketPosition: 1,
          bracketType: 'winner'
        },
        {
          id: '2',
          player1: { id: 'p3', username: 'player3' },
          player2: { id: 'p4', username: 'player4' },
          winner: null,
          status: 'pending',
          bracketRound: 1,
          bracketPosition: 2,
          bracketType: 'winner'
        }
      ];

      const brackets = tournamentManager.formatBrackets(mockMatches, 'single-elimination');

      expect(brackets.winner).toBeDefined();
      expect(brackets.winner[1]).toHaveLength(2);
      expect(brackets.loser).toBeNull();

      const firstRoundMatches = brackets.winner[1];
      expect(firstRoundMatches[0].id).toBe('1');
      expect(firstRoundMatches[0].player1.username).toBe('player1');
      expect(firstRoundMatches[0].round).toBe(1);
      expect(firstRoundMatches[0].position).toBe(1);
    });

    test('should format double elimination brackets', () => {
      const mockMatches = [
        {
          id: '1',
          player1: { id: 'p1', username: 'player1' },
          player2: { id: 'p2', username: 'player2' },
          winner: { id: 'p1', username: 'player1' },
          status: 'completed',
          bracketRound: 1,
          bracketPosition: 1,
          bracketType: 'winner'
        },
        {
          id: '2',
          player1: { id: 'p2', username: 'player2' },
          player2: { id: 'p3', username: 'player3' },
          winner: null,
          status: 'pending',
          bracketRound: 1,
          bracketPosition: 1,
          bracketType: 'loser'
        }
      ];

      const brackets = tournamentManager.formatBrackets(mockMatches, 'double-elimination');

      expect(brackets.winner).toBeDefined();
      expect(brackets.loser).toBeDefined();
      expect(brackets.winner[1]).toHaveLength(1);
      expect(brackets.loser[1]).toHaveLength(1);
    });
  });

  describe('Validation', () => {
    test('should validate supported formats', () => {
      expect(tournamentManager.supportedFormats).toContain('single-elimination');
      expect(tournamentManager.supportedFormats).toContain('double-elimination');
    });
  });
});