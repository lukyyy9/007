import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useGame } from '../context/GameContext';
import { useTournament } from '../context/TournamentContext';
import { useSocket } from '../context/SocketContext';
import ConnectionStatus from '../components/ConnectionStatus';
import GameConfigModal from '../components/GameConfigModal';

const LobbyScreen = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [availableGames, setAvailableGames] = useState([]);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const { user, logout } = useAuth();
  const { joinGame } = useGame();
  const { tournaments, updateTournaments } = useTournament();
  const { isConnected, createGame: socketCreateGame, joinGame: socketJoinGame } = useSocket();

  useEffect(() => {
    loadAvailableGames();
    loadTournaments();
  }, []);

  const loadAvailableGames = async () => {
    try {
      const { GameAPI } = require('../services');
      const { transformGameData } = require('../utils');
      const response = await GameAPI.getAvailableGames({ status: 'waiting', limit: 20 });

      if (response.games) {
        // Transform server data to match UI expectations
        const transformedGames = response.games.map(game => ({
          ...transformGameData(game),
          players: game.player2Id ? 2 : 1,
          maxPlayers: 2,
          type: '1v1',
        }));
        setAvailableGames(transformedGames);
      }
    } catch (error) {
      console.error('Error loading games:', error);
      // Keep existing games on error, don't clear the list
    }
  };

  const loadTournaments = async () => {
    try {
      const { TournamentAPI } = require('../services');
      const { transformTournamentData } = require('../utils');
      const response = await TournamentAPI.getTournaments({ status: 'waiting', limit: 10 });

      if (response.tournaments) {
        // Transform server data to match UI expectations
        const transformedTournaments = response.tournaments.map(tournament =>
          transformTournamentData(tournament)
        );
        updateTournaments(transformedTournaments);
      }
    } catch (error) {
      console.error('Error loading tournaments:', error);
      // Keep existing tournaments on error
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadAvailableGames(), loadTournaments()]);
    setRefreshing(false);
  };

  const handleCreateGame = () => {
    setShowConfigModal(true);
  };

  const createGame = async (gameConfig) => {
    if (!isConnected) {
      Alert.alert('Connection Error', 'Please check your connection and try again.');
      return;
    }

    try {
      const { GameAPI } = require('../services');
      const finalConfig = {
        ...gameConfig,
        name: `${user.username}'s Game`,
      };

      // Create game via API
      const response = await GameAPI.createGame(finalConfig);

      if (response.game) {
        // Transform server response to match expected format
        const gameData = {
          id: response.game.id,
          name: response.game.name,
          config: response.game.gameConfig,
          players: [response.game.player1],
          status: response.game.status,
        };

        joinGame(gameData);

        // Also send create game request via socket for real-time updates
        socketCreateGame(finalConfig);

        navigation.navigate('GameRoom');
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Error creating game:', error);
      const { handleApiError } = require('../utils');
      Alert.alert('Error', handleApiError(error));
    }
  };

  const handleJoinGame = async (gameId) => {
    if (!isConnected) {
      Alert.alert('Connection Error', 'Please check your connection and try again.');
      return;
    }

    try {
      const { GameAPI } = require('../services');

      // Join game via API
      const response = await GameAPI.joinGame(gameId);

      if (response.game) {
        // Transform server response to match expected format
        const gameData = {
          id: response.game.id,
          name: response.game.name,
          config: response.game.gameConfig,
          players: [response.game.player1, response.game.player2].filter(Boolean),
          status: response.game.status,
        };

        joinGame(gameData);

        // Also send join game request via socket for real-time updates
        socketJoinGame(gameId);

        navigation.navigate('GameRoom');
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Error joining game:', error);
      const { handleApiError } = require('../utils');
      Alert.alert('Error', handleApiError(error));
    }
  };

  const handleJoinTournament = async (tournamentId) => {
    try {
      const { TournamentAPI } = require('../services');
      const response = await TournamentAPI.joinTournament(tournamentId);

      if (response.tournament) {
        Alert.alert('Success', 'Joined tournament! You will be notified when it starts.');
        // Refresh tournaments list to show updated player count
        loadTournaments();
      }
    } catch (error) {
      console.error('Error joining tournament:', error);
      const { handleApiError } = require('../utils');
      Alert.alert('Error', handleApiError(error));
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', onPress: logout, style: 'destructive' },
      ]
    );
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.welcomeText}>Welcome, {user?.username}!</Text>
          <ConnectionStatus style={styles.connectionStatus} />
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={handleCreateGame}>
          <Text style={styles.primaryButtonText}>🎮 Create New Game</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('Tournament')}
        >
          <Text style={styles.secondaryButtonText}>🏆 Tournaments</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('Profile')}
        >
          <Text style={styles.secondaryButtonText}>👤 View Profile</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Available Games ({availableGames.length})</Text>
        {availableGames.length === 0 ? (
          <Text style={styles.emptyText}>No games available. Create one!</Text>
        ) : (
          availableGames.map((game) => (
            <View key={game.id} style={styles.gameCard}>
              <View style={styles.gameInfo}>
                <Text style={styles.gameName}>{game.name}</Text>
                <Text style={styles.gameDetails}>
                  {game.players}/{game.maxPlayers} players • {game.type}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.joinButton}
                onPress={() => handleJoinGame(game.id)}
              >
                <Text style={styles.joinButtonText}>Join</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tournaments ({tournaments.length})</Text>
        {tournaments.length === 0 ? (
          <Text style={styles.emptyText}>No tournaments available.</Text>
        ) : (
          tournaments.map((tournament) => (
            <View key={tournament.id} style={styles.tournamentCard}>
              <View style={styles.gameInfo}>
                <Text style={styles.gameName}>{tournament.name}</Text>
                <Text style={styles.gameDetails}>
                  {tournament.players}/{tournament.maxPlayers} players • {tournament.status}
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.joinButton,
                  tournament.status !== 'waiting' && styles.joinButtonDisabled
                ]}
                onPress={() => handleJoinTournament(tournament.id)}
                disabled={tournament.status !== 'waiting'}
              >
                <Text style={styles.joinButtonText}>
                  {tournament.status === 'waiting' ? 'Join' : 'Full'}
                </Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      <GameConfigModal
        visible={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        onConfirm={createGame}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerLeft: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  connectionStatus: {
    alignSelf: 'flex-start',
  },
  logoutButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#ff4444',
  },
  logoutText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    margin: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'white',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  gameCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tournamentCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#FFD700',
  },
  gameInfo: {
    flex: 1,
  },
  gameName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  gameDetails: {
    fontSize: 14,
    color: '#666',
  },
  joinButton: {
    backgroundColor: '#28a745',
    borderRadius: 6,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  joinButtonDisabled: {
    backgroundColor: '#ccc',
  },
  joinButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    fontStyle: 'italic',
    paddingVertical: 20,
  },
});

export default LobbyScreen;