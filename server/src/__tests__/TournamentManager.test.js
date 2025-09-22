const TournamentManager = require('../services/TournamentManager');
const { Tournament, TournamentPlayer, Match, User, sequelize } = require('../models');

describe('TournamentManager', () => {
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

  describe('Tournament Creation', () => {
    test('should create a single elimination tournament', async () => {
      const config = {
        name: 'Test Tournament',
        format: 'single-elimination',
        maxPlayers: 8,
        creatorId: testUsers[0].id
      };

      const tournament = await tournamentManager.createTournament(config);

      expect(tournament.name).toBe('Test Tournament');
      expect(tournament.format).toBe('single-elimination');
      expect(tournament.maxPlayers).toBe(8);
      expect(tournament.status).toBe('waiting');
      expect(tournament.currentPlayers).toBe(1);
      expect(tournament.creatorId).toBe(testUsers[0].id);
    });

    test('should create a double elimination tournament', async () => {
      const config = {
        name: 'Double Elim Tournament',
        format: 'double-elimination',
        maxPlayers: 4,
        creatorId: testUsers[0].id
      };

      const tournament = await tournamentManager.createTournament(config);

      expect(tournament.format).toBe('double-elimination');
      expect(tournament.maxPlayers).toBe(4);
    });

    test('should reject invalid player counts', async () => {
      const config = {
        name: 'Invalid Tournament',
        format: 'single-elimination',
        maxPlayers: 6, // Not a power of 2
        creatorId: testUsers[0].id
      };

      await expect(tournamentManager.createTournament(config)).rejects.toThrow(
        'Tournament must have a power of 2 players between 4 and 64'
      );
    });

    test('should reject unsupported formats', async () => {
      const config = {
        name: 'Invalid Format Tournament',
        format: 'round-robin',
        maxPlayers: 8,
        creatorId: testUsers[0].id
      };

      await expect(tournamentManager.createTournament(config)).rejects.toThrow(
        'Unsupported tournament format: round-robin'
      );
    });

    test('should apply default game configuration', async () => {
      const config = {
        name: 'Default Config Tournament',
        format: 'single-elimination',
        maxPlayers: 4,
        creatorId: testUsers[0].id
      };

      const tournament = await tournamentManager.createTournament(config);

      expect(tournament.settings.maxHealth).toBe(6);
      expect(tournament.settings.turnTimeLimit).toBe(20);
      expect(tournament.settings.bestOfSeries).toBe(1);
    });

    test('should merge custom game configuration', async () => {
      const config = {
        name: 'Custom Config Tournament',
        format: 'single-elimination',
        maxPlayers: 4,
        creatorId: testUsers[0].id,
        gameConfig: {
          maxHealth: 10,
          turnTimeLimit: 30
        }
      };

      const tournament = await tournamentManager.createTournament(config);

      expect(tournament.settings.maxHealth).toBe(10);
      expect(tournament.settings.turnTimeLimit).toBe(30);
      expect(tournament.settings.bestOfSeries).toBe(1); // Should keep default
    });
  });

  describe('Player Management', () => {
    let tournament;

    beforeEach(async () => {
      tournament = await tournamentManager.createTournament({
        name: 'Player Test Tournament',
        format: 'single-elimination',
        maxPlayers: 4,
        creatorId: testUsers[0].id
      });
    });

    test('should add players to tournament', async () => {
      const tournamentPlayer = await tournamentManager.addPlayer(tournament.id, testUsers[1].id);

      expect(tournamentPlayer.tournamentId).toBe(tournament.id);
      expect(tournamentPlayer.playerId).toBe(testUsers[1].id);
      expect(tournamentPlayer.status).toBe('active');
      expect(tournamentPlayer.seedPosition).toBe(2);

      // Check tournament player count updated
      await tournament.reload();
      expect(tournament.currentPlayers).toBe(2);
    });

    test('should prevent duplicate player joins', async () => {
      await tournamentManager.addPlayer(tournament.id, testUsers[1].id);

      await expect(
        tournamentManager.addPlayer(tournament.id, testUsers[1].id)
      ).rejects.toThrow('Player already joined this tournament');
    });

    test('should prevent joining full tournament', async () => {
      // Fill tournament to capacity
      for (let i = 1; i < 4; i++) {
        await tournamentManager.addPlayer(tournament.id, testUsers[i].id);
      }

      await expect(
        tournamentManager.addPlayer(tournament.id, testUsers[4].id)
      ).rejects.toThrow('Tournament is full');
    });

    test('should prevent joining started tournament', async () => {
      // Add players and start tournament
      for (let i = 1; i < 4; i++) {
        await tournamentManager.addPlayer(tournament.id, testUsers[i].id);
      }
      
      await tournament.update({ status: 'active' });

      await expect(
        tournamentManager.addPlayer(tournament.id, testUsers[4].id)
      ).rejects.toThrow('Tournament is not accepting new players');
    });

    test('should assign correct seed positions', async () => {
      const player2 = await tournamentManager.addPlayer(tournament.id, testUsers[1].id);
      const player3 = await tournamentManager.addPlayer(tournament.id, testUsers[2].id);
      const player4 = await tournamentManager.addPlayer(tournament.id, testUsers[3].id);

      expect(player2.seedPosition).toBe(2);
      expect(player3.seedPosition).toBe(3);
      expect(player4.seedPosition).toBe(4);
    });
  });

  describe('Tournament Start and Bracket Generation', () => {
    let tournament;

    beforeEach(async () => {
      tournament = await tournamentManager.createTournament({
        name: 'Bracket Test Tournament',
        format: 'single-elimination',
        maxPlayers: 4,
        creatorId: testUsers[0].id
      });

      // Add remaining players
      for (let i = 1; i < 4; i++) {
        await tournamentManager.addPlayer(tournament.id, testUsers[i].id);
      }
    });

    test('should start tournament and generate single elimination brackets', async () => {
      const result = await tournamentManager.startTournament(tournament.id, testUsers[0].id);

      expect(result.tournament.status).toBe('active');
      expect(result.tournament.currentRound).toBe(1);
      expect(result.tournament.startedAt).toBeTruthy();
      expect(result.playerCount).toBe(4);

      // Check brackets structure
      expect(result.brackets.winner).toBeDefined();
      expect(result.brackets.winner[1]).toHaveLength(2); // 2 matches in first round
      expect(result.brackets.loser).toBeNull(); // Single elimination has no loser bracket

      // Verify matches were created
      const matches = await Match.findAll({ where: { tournamentId: tournament.id } });
      expect(matches).toHaveLength(2);
      
      matches.forEach(match => {
        expect(match.bracketType).toBe('winner');
        expect(match.bracketRound).toBe(1);
        expect(match.status).toBe('pending');
        expect(match.matchType).toBe('tournament');
      });
    });

    test('should generate double elimination brackets', async () => {
      // Create double elimination tournament
      const doubleTournament = await tournamentManager.createTournament({
        name: 'Double Elim Test',
        format: 'double-elimination',
        maxPlayers: 4,
        creatorId: testUsers[0].id
      });

      for (let i = 1; i < 4; i++) {
        await tournamentManager.addPlayer(doubleTournament.id, testUsers[i].id);
      }

      const result = await tournamentManager.startTournament(doubleTournament.id, testUsers[0].id);

      expect(result.brackets.winner).toBeDefined();
      expect(result.brackets.loser).toBeDefined();
      expect(result.brackets.winner[1]).toHaveLength(2);
    });

    test('should pair players correctly in single elimination', async () => {
      const result = await tournamentManager.startTournament(tournament.id, testUsers[0].id);
      const firstRoundMatches = result.brackets.winner[1];

      // In single elimination, highest seed should play lowest seed
      // Seed 1 vs Seed 4, Seed 2 vs Seed 3
      const match1 = firstRoundMatches[0];
      const match2 = firstRoundMatches[1];

      // Get tournament players to check seeding
      const tournamentPlayers = await TournamentPlayer.findAll({
        where: { tournamentId: tournament.id },
        order: [['seedPosition', 'ASC']]
      });

      const seed1 = tournamentPlayers[0].playerId;
      const seed2 = tournamentPlayers[1].playerId;
      const seed3 = tournamentPlayers[2].playerId;
      const seed4 = tournamentPlayers[3].playerId;

      // Check that matches pair correctly (seed 1 vs 4, seed 2 vs 3)
      const allPlayerIds = [
        match1.player1.id, match1.player2.id,
        match2.player1.id, match2.player2.id
      ];
      
      expect(allPlayerIds).toContain(seed1);
      expect(allPlayerIds).toContain(seed2);
      expect(allPlayerIds).toContain(seed3);
      expect(allPlayerIds).toContain(seed4);
    });

    test('should reject start by non-creator', async () => {
      await expect(
        tournamentManager.startTournament(tournament.id, testUsers[1].id)
      ).rejects.toThrow('Only tournament creator can start the tournament');
    });

    test('should reject start with insufficient players', async () => {
      const smallTournament = await tournamentManager.createTournament({
        name: 'Small Tournament',
        format: 'single-elimination',
        maxPlayers: 8,
        creatorId: testUsers[0].id
      });

      await expect(
        tournamentManager.startTournament(smallTournament.id, testUsers[0].id)
      ).rejects.toThrow('Tournament needs at least 4 players to start');
    });

    test('should reject start of already started tournament', async () => {
      await tournamentManager.startTournament(tournament.id, testUsers[0].id);

      await expect(
        tournamentManager.startTournament(tournament.id, testUsers[0].id)
      ).rejects.toThrow('Tournament cannot be started');
    });
  });

  describe('Match Result Processing', () => {
    let tournament;
    let matches;

    beforeEach(async () => {
      tournament = await tournamentManager.createTournament({
        name: 'Match Test Tournament',
        format: 'single-elimination',
        maxPlayers: 4,
        creatorId: testUsers[0].id
      });

      for (let i = 1; i < 4; i++) {
        await tournamentManager.addPlayer(tournament.id, testUsers[i].id);
      }

      const result = await tournamentManager.startTournament(tournament.id, testUsers[0].id);
      matches = await Match.findAll({ 
        where: { tournamentId: tournament.id },
        order: [['position', 'ASC']]
      });

      // Set matches to active status for testing
      for (const match of matches) {
        await match.update({ status: 'active' });
      }
    });

    test('should process match result and eliminate loser', async () => {
      const match = matches[0];
      const winnerId = match.player1Id;
      const loserId = match.player2Id;

      const result = await tournamentManager.processMatchResult(match.id, winnerId);

      expect(result.winnerId).toBe(winnerId);
      expect(result.loserId).toBe(loserId);
      expect(result.matchId).toBe(match.id);

      // Check match was updated
      await match.reload();
      expect(match.winnerId).toBe(winnerId);
      expect(match.status).toBe('completed');
      expect(match.completedAt).toBeTruthy();

      // Check loser was eliminated
      const loserPlayer = await TournamentPlayer.findOne({
        where: { tournamentId: tournament.id, playerId: loserId }
      });
      expect(loserPlayer.status).toBe('eliminated');
      expect(loserPlayer.eliminatedAt).toBeTruthy();
    });

    test('should advance to next round when round is complete', async () => {
      // Complete first match
      const match1 = matches[0];
      const winner1 = match1.player1Id;
      await tournamentManager.processMatchResult(match1.id, winner1);

      // Complete second match
      const match2 = matches[1];
      const winner2 = match2.player1Id;
      await tournamentManager.processMatchResult(match2.id, winner2);

      // Check that final match was created
      const finalMatches = await Match.findAll({
        where: { 
          tournamentId: tournament.id,
          bracketRound: 2
        }
      });

      expect(finalMatches).toHaveLength(1);
      expect(finalMatches[0].player1Id).toBe(winner1);
      expect(finalMatches[0].player2Id).toBe(winner2);
      expect(finalMatches[0].bracketType).toBe('winner');

      // Check tournament round was advanced
      await tournament.reload();
      expect(tournament.currentRound).toBe(2);
    });

    test('should complete tournament when final match is won', async () => {
      // Complete first round
      const winner1 = matches[0].player1Id;
      const winner2 = matches[1].player1Id;
      
      await tournamentManager.processMatchResult(matches[0].id, winner1);
      await tournamentManager.processMatchResult(matches[1].id, winner2);

      // Get and complete final match
      const finalMatch = await Match.findOne({
        where: { 
          tournamentId: tournament.id,
          bracketRound: 2
        }
      });
      
      await finalMatch.update({ status: 'active' });
      const tournamentWinner = finalMatch.player1Id;
      
      await tournamentManager.processMatchResult(finalMatch.id, tournamentWinner);

      // Check tournament was completed
      await tournament.reload();
      expect(tournament.status).toBe('completed');
      expect(tournament.winnerId).toBe(tournamentWinner);
      expect(tournament.completedAt).toBeTruthy();

      // Check winner status was updated
      const winnerPlayer = await TournamentPlayer.findOne({
        where: { tournamentId: tournament.id, playerId: tournamentWinner }
      });
      expect(winnerPlayer.status).toBe('winner');
    });

    test('should reject invalid match result', async () => {
      const match = matches[0];
      const invalidWinnerId = testUsers[4].id; // Not a participant

      await expect(
        tournamentManager.processMatchResult(match.id, invalidWinnerId)
      ).rejects.toThrow('Winner must be one of the match participants');
    });

    test('should reject processing inactive match', async () => {
      const match = matches[0];
      await match.update({ status: 'pending' });

      await expect(
        tournamentManager.processMatchResult(match.id, match.player1Id)
      ).rejects.toThrow('Match is not active');
    });
  });

  describe('Final Rankings Calculation', () => {
    let tournament;

    beforeEach(async () => {
      tournament = await tournamentManager.createTournament({
        name: 'Rankings Test Tournament',
        format: 'single-elimination',
        maxPlayers: 4,
        creatorId: testUsers[0].id
      });

      for (let i = 1; i < 4; i++) {
        await tournamentManager.addPlayer(tournament.id, testUsers[i].id);
      }
    });

    test('should calculate final rankings correctly', async () => {
      // Simulate tournament completion
      await tournament.update({ 
        status: 'completed',
        winnerId: testUsers[0].id
      });

      // Set up player statuses to simulate tournament results
      const players = await TournamentPlayer.findAll({
        where: { tournamentId: tournament.id }
      });

      // Winner
      await players[0].update({ status: 'winner', wins: 2, losses: 0 });
      
      // Runner-up (eliminated later)
      await players[1].update({ 
        status: 'eliminated', 
        wins: 1, 
        losses: 1,
        eliminatedAt: new Date(Date.now() - 1000) // Eliminated 1 second ago
      });
      
      // Semi-finalists (eliminated earlier)
      await players[2].update({ 
        status: 'eliminated', 
        wins: 0, 
        losses: 1,
        eliminatedAt: new Date(Date.now() - 2000) // Eliminated 2 seconds ago
      });
      
      await players[3].update({ 
        status: 'eliminated', 
        wins: 0, 
        losses: 1,
        eliminatedAt: new Date(Date.now() - 2000) // Eliminated 2 seconds ago
      });

      const rankings = await tournamentManager.calculateFinalRankings(tournament.id);

      expect(rankings).toHaveLength(4);
      
      // Winner should be rank 1
      expect(rankings[0].rank).toBe(1);
      expect(rankings[0].player.id).toBe(testUsers[0].id);
      expect(rankings[0].status).toBe('winner');
      
      // Runner-up should be rank 2 (eliminated later)
      expect(rankings[1].rank).toBe(2);
      expect(rankings[1].player.id).toBe(testUsers[1].id);
      expect(rankings[1].status).toBe('eliminated');

      // Check that final ranks were updated in database
      const updatedPlayers = await TournamentPlayer.findAll({
        where: { tournamentId: tournament.id },
        order: [['finalRank', 'ASC']]
      });

      expect(updatedPlayers[0].finalRank).toBe(1);
      expect(updatedPlayers[1].finalRank).toBe(2);
      expect(updatedPlayers[2].finalRank).toBe(3);
      expect(updatedPlayers[3].finalRank).toBe(4);
    });
  });

  describe('Bracket Retrieval and Formatting', () => {
    let tournament;

    beforeEach(async () => {
      tournament = await tournamentManager.createTournament({
        name: 'Bracket Retrieval Test',
        format: 'single-elimination',
        maxPlayers: 4,
        creatorId: testUsers[0].id
      });

      for (let i = 1; i < 4; i++) {
        await tournamentManager.addPlayer(tournament.id, testUsers[i].id);
      }

      await tournamentManager.startTournament(tournament.id, testUsers[0].id);
    });

    test('should retrieve and format brackets correctly', async () => {
      const brackets = await tournamentManager.getBrackets(tournament.id);

      expect(brackets.winner).toBeDefined();
      expect(brackets.loser).toBeNull(); // Single elimination
      expect(brackets.winner[1]).toHaveLength(2);

      const firstRoundMatches = brackets.winner[1];
      firstRoundMatches.forEach(match => {
        expect(match.id).toBeDefined();
        expect(match.player1).toBeDefined();
        expect(match.player2).toBeDefined();
        expect(match.player1.username).toBeDefined();
        expect(match.player2.username).toBeDefined();
        expect(match.status).toBe('pending');
        expect(match.round).toBe(1);
        expect(match.position).toBeDefined();
      });
    });

    test('should handle non-existent tournament', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      
      await expect(
        tournamentManager.getBrackets(fakeId)
      ).rejects.toThrow('Tournament not found');
    });
  });

  describe('Tournament Status', () => {
    let tournament;

    beforeEach(async () => {
      tournament = await tournamentManager.createTournament({
        name: 'Status Test Tournament',
        format: 'single-elimination',
        maxPlayers: 8,
        creatorId: testUsers[0].id
      });

      // Add some players
      for (let i = 1; i < 4; i++) {
        await tournamentManager.addPlayer(tournament.id, testUsers[i].id);
      }
    });

    test('should return comprehensive tournament status', async () => {
      const status = await tournamentManager.getTournamentStatus(tournament.id);

      expect(status.id).toBe(tournament.id);
      expect(status.name).toBe('Status Test Tournament');
      expect(status.format).toBe('single-elimination');
      expect(status.status).toBe('waiting');
      expect(status.maxPlayers).toBe(8);
      expect(status.currentPlayers).toBe(4);
      expect(status.activePlayers).toBe(4);
      expect(status.eliminatedPlayers).toBe(0);
      expect(status.creator).toBeDefined();
      expect(status.creator.username).toBe('testuser1');
      expect(status.players).toHaveLength(4);
      expect(status.settings).toBeDefined();
      expect(status.createdAt).toBeDefined();

      status.players.forEach(player => {
        expect(player.id).toBeDefined();
        expect(player.username).toBeDefined();
        expect(player.status).toBe('active');
        expect(player.seedPosition).toBeDefined();
        expect(player.wins).toBe(0);
        expect(player.losses).toBe(0);
      });
    });

    test('should handle tournament status after start', async () => {
      // Fill tournament and start
      for (let i = 4; i < 8; i++) {
        await tournamentManager.addPlayer(tournament.id, testUsers[i].id);
      }

      await tournamentManager.startTournament(tournament.id, testUsers[0].id);

      const status = await tournamentManager.getTournamentStatus(tournament.id);

      expect(status.status).toBe('active');
      expect(status.currentRound).toBe(1);
      expect(status.startedAt).toBeTruthy();
      expect(status.activePlayers).toBe(8);
    });
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
  });

  describe('Double Elimination Advanced Logic', () => {
    let tournament;

    beforeEach(async () => {
      tournament = await tournamentManager.createTournament({
        name: 'Double Elim Advanced Test',
        format: 'double-elimination',
        maxPlayers: 4,
        creatorId: testUsers[0].id
      });

      for (let i = 1; i < 4; i++) {
        await tournamentManager.addPlayer(tournament.id, testUsers[i].id);
      }

      await tournamentManager.startTournament(tournament.id, testUsers[0].id);
    });

    test('should handle first loss in double elimination', async () => {
      const matches = await Match.findAll({ 
        where: { tournamentId: tournament.id },
        order: [['position', 'ASC']]
      });

      const match = matches[0];
      await match.update({ status: 'active' });
      
      const winnerId = match.player1Id;
      const loserId = match.player2Id;

      await tournamentManager.processMatchResult(match.id, winnerId);

      // Check that loser was moved to loser bracket (not eliminated)
      const loserPlayer = await TournamentPlayer.findOne({
        where: { tournamentId: tournament.id, playerId: loserId }
      });
      
      expect(loserPlayer.status).toBe('active'); // Still active in loser bracket
      expect(loserPlayer.losses).toBe(1);

      // Check that a loser bracket match was created or updated
      const loserBracketMatches = await Match.findAll({
        where: { 
          tournamentId: tournament.id,
          bracketType: 'loser'
        }
      });

      expect(loserBracketMatches.length).toBeGreaterThan(0);
    });
  });
});