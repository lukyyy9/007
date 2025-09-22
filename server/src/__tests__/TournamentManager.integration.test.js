const TournamentManager = require('../services/TournamentManager');
const { Tournament, TournamentPlayer, Match, User, sequelize } = require('../models');

describe('TournamentManager Integration Tests', () => {
  let tournamentManager;
  let testUsers;

  beforeAll(async () => {
    tournamentManager = new TournamentManager();
    
    // Create test users
    testUsers = [];
    for (let i = 1; i <= 8; i++) {
      const user = await User.create({
        username: `testuser${i}`,
        email: `test${i}@example.com`,
        password: 'hashedpassword'
      });
      testUsers.push(user);
    }
  });

  beforeEach(async () => {
    // Clean up before each test
    await Match.destroy({ where: {} });
    await TournamentPlayer.destroy({ where: {} });
    await Tournament.destroy({ where: {} });
  });

  describe('Complete Tournament Flow', () => {
    test('should complete a full 4-player single elimination tournament', async () => {
      // Step 1: Create tournament
      const tournament = await tournamentManager.createTournament({
        name: 'Integration Test Tournament',
        format: 'single-elimination',
        maxPlayers: 4,
        creatorId: testUsers[0].id
      });

      expect(tournament.status).toBe('waiting');
      expect(tournament.currentPlayers).toBe(1);

      // Step 2: Add remaining players
      for (let i = 1; i < 4; i++) {
        await tournamentManager.addPlayer(tournament.id, testUsers[i].id);
      }

      // Verify all players joined
      const updatedTournament = await Tournament.findByPk(tournament.id);
      expect(updatedTournament.currentPlayers).toBe(4);

      // Step 3: Start tournament
      const startResult = await tournamentManager.startTournament(tournament.id, testUsers[0].id);
      
      expect(startResult.tournament.status).toBe('active');
      expect(startResult.playerCount).toBe(4);
      expect(startResult.brackets.winner[1]).toHaveLength(2); // 2 first round matches

      // Step 4: Get first round matches
      const firstRoundMatches = await Match.findAll({
        where: { 
          tournamentId: tournament.id,
          bracketRound: 1
        },
        order: [['bracketPosition', 'ASC']]
      });

      expect(firstRoundMatches).toHaveLength(2);

      // Step 5: Complete first match
      const match1 = firstRoundMatches[0];
      await match1.update({ status: 'active' });
      const winner1 = match1.player1Id;
      
      const result1 = await tournamentManager.processMatchResult(match1.id, winner1);
      expect(result1.winnerId).toBe(winner1);

      // Verify loser was eliminated
      const eliminatedPlayer1 = await TournamentPlayer.findOne({
        where: { 
          tournamentId: tournament.id,
          playerId: result1.loserId
        }
      });
      expect(eliminatedPlayer1.status).toBe('eliminated');

      // Step 6: Complete second match
      const match2 = firstRoundMatches[1];
      await match2.update({ status: 'active' });
      const winner2 = match2.player1Id;
      
      const result2 = await tournamentManager.processMatchResult(match2.id, winner2);
      expect(result2.winnerId).toBe(winner2);

      // Step 7: Verify final match was created
      const finalMatches = await Match.findAll({
        where: { 
          tournamentId: tournament.id,
          bracketRound: 2
        }
      });

      expect(finalMatches).toHaveLength(1);
      const finalMatch = finalMatches[0];
      expect(finalMatch.player1Id).toBe(winner1);
      expect(finalMatch.player2Id).toBe(winner2);

      // Step 8: Complete final match
      await finalMatch.update({ status: 'active' });
      const tournamentWinner = finalMatch.player1Id;
      
      await tournamentManager.processMatchResult(finalMatch.id, tournamentWinner);

      // Step 9: Verify tournament completion
      const completedTournament = await Tournament.findByPk(tournament.id);
      expect(completedTournament.status).toBe('completed');
      expect(completedTournament.winnerId).toBe(tournamentWinner);

      // Step 10: Verify final rankings
      const rankings = await tournamentManager.calculateFinalRankings(tournament.id);
      expect(rankings).toHaveLength(4);
      expect(rankings[0].player.id).toBe(tournamentWinner);
      expect(rankings[0].rank).toBe(1);
      expect(rankings[0].status).toBe('winner');

      // Verify all players have final ranks
      const allPlayers = await TournamentPlayer.findAll({
        where: { tournamentId: tournament.id },
        order: [['finalRank', 'ASC']]
      });

      allPlayers.forEach((player, index) => {
        expect(player.finalRank).toBe(index + 1);
      });
    });

    test('should handle double elimination tournament basics', async () => {
      // Create double elimination tournament
      const tournament = await tournamentManager.createTournament({
        name: 'Double Elim Test',
        format: 'double-elimination',
        maxPlayers: 4,
        creatorId: testUsers[0].id
      });

      // Add players
      for (let i = 1; i < 4; i++) {
        await tournamentManager.addPlayer(tournament.id, testUsers[i].id);
      }

      // Start tournament
      const startResult = await tournamentManager.startTournament(tournament.id, testUsers[0].id);
      
      expect(startResult.brackets.winner).toBeDefined();
      expect(startResult.brackets.loser).toBeDefined();
      expect(startResult.brackets.winner[1]).toHaveLength(2);

      // Complete first winner bracket match
      const firstMatch = await Match.findOne({
        where: { 
          tournamentId: tournament.id,
          bracketRound: 1,
          bracketType: 'winner'
        }
      });

      await firstMatch.update({ status: 'active' });
      const winner = firstMatch.player1Id;
      const loser = firstMatch.player2Id;

      await tournamentManager.processMatchResult(firstMatch.id, winner);

      // Verify loser was moved to loser bracket (not eliminated)
      const loserPlayer = await TournamentPlayer.findOne({
        where: { 
          tournamentId: tournament.id,
          playerId: loser
        }
      });
      
      expect(loserPlayer.status).toBe('active'); // Still active in loser bracket
      expect(loserPlayer.losses).toBe(1);

      // Verify loser bracket match was created
      const loserBracketMatches = await Match.findAll({
        where: { 
          tournamentId: tournament.id,
          bracketType: 'loser'
        }
      });

      expect(loserBracketMatches.length).toBeGreaterThan(0);
    });

    test('should handle tournament status and bracket retrieval', async () => {
      // Create and set up tournament
      const tournament = await tournamentManager.createTournament({
        name: 'Status Test Tournament',
        format: 'single-elimination',
        maxPlayers: 4,
        creatorId: testUsers[0].id
      });

      for (let i = 1; i < 4; i++) {
        await tournamentManager.addPlayer(tournament.id, testUsers[i].id);
      }

      // Test status before start
      const statusBefore = await tournamentManager.getTournamentStatus(tournament.id);
      expect(statusBefore.status).toBe('waiting');
      expect(statusBefore.activePlayers).toBe(4);
      expect(statusBefore.eliminatedPlayers).toBe(0);

      // Start tournament
      await tournamentManager.startTournament(tournament.id, testUsers[0].id);

      // Test status after start
      const statusAfter = await tournamentManager.getTournamentStatus(tournament.id);
      expect(statusAfter.status).toBe('active');
      expect(statusAfter.currentRound).toBe(1);

      // Test bracket retrieval
      const brackets = await tournamentManager.getBrackets(tournament.id);
      expect(brackets.winner).toBeDefined();
      expect(brackets.winner[1]).toHaveLength(2);
      expect(brackets.loser).toBeNull(); // Single elimination

      // Verify bracket format
      const firstRoundMatches = brackets.winner[1];
      firstRoundMatches.forEach(match => {
        expect(match.id).toBeDefined();
        expect(match.player1).toBeDefined();
        expect(match.player2).toBeDefined();
        expect(match.status).toBe('pending');
        expect(match.round).toBe(1);
      });
    });

    test('should handle match result validation', async () => {
      // Create and start tournament
      const tournament = await tournamentManager.createTournament({
        name: 'Validation Test Tournament',
        format: 'single-elimination',
        maxPlayers: 4,
        creatorId: testUsers[0].id
      });

      for (let i = 1; i < 4; i++) {
        await tournamentManager.addPlayer(tournament.id, testUsers[i].id);
      }

      await tournamentManager.startTournament(tournament.id, testUsers[0].id);

      const match = await Match.findOne({
        where: { tournamentId: tournament.id }
      });

      // Test invalid winner (not a participant)
      await match.update({ status: 'active' });
      await expect(
        tournamentManager.processMatchResult(match.id, testUsers[4].id)
      ).rejects.toThrow('Winner must be one of the match participants');

      // Test inactive match
      await match.update({ status: 'pending' });
      await expect(
        tournamentManager.processMatchResult(match.id, match.player1Id)
      ).rejects.toThrow('Match is not active');

      // Test non-existent match
      await expect(
        tournamentManager.processMatchResult('00000000-0000-0000-0000-000000000000', match.player1Id)
      ).rejects.toThrow('Match not found');
    });

    test('should calculate rankings correctly based on elimination order', async () => {
      // Create tournament
      const tournament = await tournamentManager.createTournament({
        name: 'Rankings Test Tournament',
        format: 'single-elimination',
        maxPlayers: 4,
        creatorId: testUsers[0].id
      });

      for (let i = 1; i < 4; i++) {
        await tournamentManager.addPlayer(tournament.id, testUsers[i].id);
      }

      await tournamentManager.startTournament(tournament.id, testUsers[0].id);

      // Complete tournament with specific elimination order
      const matches = await Match.findAll({
        where: { tournamentId: tournament.id },
        order: [['bracketPosition', 'ASC']]
      });

      // Complete first match - eliminate player 2
      const match1 = matches[0];
      await match1.update({ status: 'active' });
      const winner1 = match1.player1Id;
      await tournamentManager.processMatchResult(match1.id, winner1);

      // Wait a moment to ensure different elimination times
      await new Promise(resolve => setTimeout(resolve, 10));

      // Complete second match - eliminate player 4
      const match2 = matches[1];
      await match2.update({ status: 'active' });
      const winner2 = match2.player1Id;
      await tournamentManager.processMatchResult(match2.id, winner2);

      // Complete final match
      const finalMatch = await Match.findOne({
        where: { 
          tournamentId: tournament.id,
          bracketRound: 2
        }
      });
      
      await finalMatch.update({ status: 'active' });
      const tournamentWinner = finalMatch.player1Id;
      await tournamentManager.processMatchResult(finalMatch.id, tournamentWinner);

      // Get final rankings
      const rankings = await tournamentManager.calculateFinalRankings(tournament.id);

      // Verify ranking structure
      expect(rankings).toHaveLength(4);
      expect(rankings[0].rank).toBe(1);
      expect(rankings[0].status).toBe('winner');
      expect(rankings[1].rank).toBe(2);
      expect(rankings[1].status).toBe('eliminated');
      expect(rankings[2].rank).toBe(3);
      expect(rankings[3].rank).toBe(4);

      // Winner should be first
      expect(rankings[0].player.id).toBe(tournamentWinner);
    });
  });

  describe('Error Handling', () => {
    test('should handle tournament creation errors', async () => {
      // Invalid player count
      await expect(
        tournamentManager.createTournament({
          name: 'Invalid Tournament',
          format: 'single-elimination',
          maxPlayers: 6, // Not power of 2
          creatorId: testUsers[0].id
        })
      ).rejects.toThrow('Tournament must have a power of 2 players between 4 and 64');

      // Invalid format
      await expect(
        tournamentManager.createTournament({
          name: 'Invalid Format',
          format: 'round-robin',
          maxPlayers: 4,
          creatorId: testUsers[0].id
        })
      ).rejects.toThrow('Unsupported tournament format: round-robin');
    });

    test('should handle player management errors', async () => {
      const tournament = await tournamentManager.createTournament({
        name: 'Error Test Tournament',
        format: 'single-elimination',
        maxPlayers: 4,
        creatorId: testUsers[0].id
      });

      // Duplicate join
      await expect(
        tournamentManager.addPlayer(tournament.id, testUsers[0].id)
      ).rejects.toThrow('Player already joined this tournament');

      // Non-existent tournament
      await expect(
        tournamentManager.addPlayer('00000000-0000-0000-0000-000000000000', testUsers[1].id)
      ).rejects.toThrow('Tournament not found');

      // Fill tournament
      for (let i = 1; i < 4; i++) {
        await tournamentManager.addPlayer(tournament.id, testUsers[i].id);
      }

      // Try to join full tournament
      await expect(
        tournamentManager.addPlayer(tournament.id, testUsers[4].id)
      ).rejects.toThrow('Tournament is full');

      // Start tournament
      await tournamentManager.startTournament(tournament.id, testUsers[0].id);

      // Try to join started tournament
      await expect(
        tournamentManager.addPlayer(tournament.id, testUsers[5].id)
      ).rejects.toThrow('Tournament is not accepting new players');
    });

    test('should handle tournament start errors', async () => {
      const tournament = await tournamentManager.createTournament({
        name: 'Start Error Test',
        format: 'single-elimination',
        maxPlayers: 8,
        creatorId: testUsers[0].id
      });

      // Insufficient players
      await expect(
        tournamentManager.startTournament(tournament.id, testUsers[0].id)
      ).rejects.toThrow('Tournament needs at least 4 players to start');

      // Non-creator trying to start
      await tournamentManager.addPlayer(tournament.id, testUsers[1].id);
      await expect(
        tournamentManager.startTournament(tournament.id, testUsers[1].id)
      ).rejects.toThrow('Only tournament creator can start the tournament');

      // Add more players and start
      for (let i = 2; i < 4; i++) {
        await tournamentManager.addPlayer(tournament.id, testUsers[i].id);
      }

      await tournamentManager.startTournament(tournament.id, testUsers[0].id);

      // Try to start already started tournament
      await expect(
        tournamentManager.startTournament(tournament.id, testUsers[0].id)
      ).rejects.toThrow('Tournament cannot be started');
    });
  });
});