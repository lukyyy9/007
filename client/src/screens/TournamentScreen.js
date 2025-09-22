import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTournament } from '../context/TournamentContext';
import { useSocket } from '../context/SocketContext';
import TournamentCreationModal from '../components/TournamentCreationModal';
import TournamentList from '../components/TournamentList';
import TournamentWaitingRoom from '../components/TournamentWaitingRoom';
import ConnectionStatus from '../components/ConnectionStatus';

const TournamentScreen = ({ navigation }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { user } = useAuth();
  const {
    tournaments,
    currentTournament,
    isInTournament,
    updateTournaments,
    joinTournament,
    leaveTournament,
  } = useTournament();
  const { isConnected, socket } = useSocket();

  useEffect(() => {
    loadTournaments();
    setupSocketListeners();

    return () => {
      cleanupSocketListeners();
    };
  }, []);

  const setupSocketListeners = () => {
    if (!socket) return;

    socket.on('tournament:joined', handleTournamentJoined);
    socket.on('tournament:left', handleTournamentLeft);
    socket.on('tournament:player-connected', handlePlayerConnected);
    socket.on('tournament:player-disconnected', handlePlayerDisconnected);
    socket.on('tournament:status-update', handleTournamentStatusUpdate);
    socket.on('tournament:started', handleTournamentStarted);
    socket.on('tournament:error', handleTournamentError);
  };

  const cleanupSocketListeners = () => {
    if (!socket) return;

    socket.off('tournament:joined', handleTournamentJoined);
    socket.off('tournament:left', handleTournamentLeft);
    socket.off('tournament:player-connected', handlePlayerConnected);
    socket.off('tournament:player-disconnected', handlePlayerDisconnected);
    socket.off('tournament:status-update', handleTournamentStatusUpdate);
    socket.off('tournament:started', handleTournamentStarted);
    socket.off('tournament:error', handleTournamentError);
  };

  const handleTournamentJoined = (data) => {
    console.log('Tournament joined:', data);
    joinTournament(data.tournament);
  };

  const handleTournamentLeft = (data) => {
    console.log('Tournament left:', data);
    leaveTournament();
  };

  const handlePlayerConnected = (data) => {
    console.log('Player connected to tournament:', data);
    // Refresh tournament data
    loadTournaments();
  };

  const handlePlayerDisconnected = (data) => {
    console.log('Player disconnected from tournament:', data);
    // Refresh tournament data
    loadTournaments();
  };

  const handleTournamentStatusUpdate = (data) => {
    console.log('Tournament status update:', data);
    if (data.tournament) {
      joinTournament(data.tournament);
    }
  };

  const handleTournamentStarted = (data) => {
    console.log('Tournament started:', data);
    Alert.alert(
      'Tournament Started!',
      'The tournament has begun. Good luck!',
      [{ text: 'OK' }]
    );
    // Navigate to bracket view or game
    navigation.navigate('TournamentBracket', { tournamentId: data.tournamentId });
  };

  const handleTournamentError = (data) => {
    console.error('Tournament error:', data);
    Alert.alert('Tournament Error', data.error || 'An error occurred');
  };

  const loadTournaments = async () => {
    try {
      setLoading(true);
      const { TournamentAPI } = require('../services');
      const response = await TournamentAPI.getTournaments({ status: 'waiting', limit: 20 });
      
      if (response.tournaments) {
        updateTournaments(response.tournaments);
      }
    } catch (error) {
      console.error('Error loading tournaments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTournaments();
    setRefreshing(false);
  };

  const handleCreateTournament = async (tournamentConfig) => {
    if (!isConnected) {
      Alert.alert('Connection Error', 'Please check your connection and try again.');
      return;
    }

    try {
      const { TournamentAPI } = require('../services');
      const response = await TournamentAPI.createTournament(tournamentConfig);
      
      if (response.tournament) {
        Alert.alert('Success', 'Tournament created successfully!');

        // Join the tournament room via socket
        socket.emit('tournament:join', { tournamentId: response.tournament.id });

        // Refresh tournaments list
        loadTournaments();
      }
    } catch (error) {
      console.error('Error creating tournament:', error);
      Alert.alert('Error', error.message || 'Failed to create tournament. Please try again.');
    }
  };

  const handleJoinTournament = async (tournamentId) => {
    if (!isConnected) {
      Alert.alert('Connection Error', 'Please check your connection and try again.');
      return;
    }

    try {
      const { TournamentAPI } = require('../services');
      const response = await TournamentAPI.joinTournament(tournamentId);
      
      if (response.tournament) {
        // Join the tournament room via socket
        socket.emit('tournament:join', { tournamentId });

        Alert.alert('Success', 'Joined tournament successfully!');
        loadTournaments();
      }
    } catch (error) {
      console.error('Error joining tournament:', error);
      Alert.alert('Error', error.message || 'Failed to join tournament. Please try again.');
    }
  };

  const handleLeaveTournament = async () => {
    if (!currentTournament) return;

    try {
      const { TournamentAPI } = require('../services');
      const response = await TournamentAPI.leaveTournament(currentTournament.id);
      
      if (response.message) {
        // Leave the tournament room via socket
        socket.emit('tournament:leave', { tournamentId: currentTournament.id });

        Alert.alert('Success', 'Left tournament successfully');
        loadTournaments();
      }
    } catch (error) {
      console.error('Error leaving tournament:', error);
      Alert.alert('Error', error.message || 'Failed to leave tournament. Please try again.');
    }
  };

  const handleStartTournament = async () => {
    if (!currentTournament) return;

    try {
      // Use socket to start tournament for real-time updates
      socket.emit('tournament:start', { tournamentId: currentTournament.id });
    } catch (error) {
      console.error('Error starting tournament:', error);
      Alert.alert('Error', 'Failed to start tournament. Please try again.');
    }
  };

  const handleViewTournament = (tournamentId) => {
    // Navigate to tournament details or bracket view
    navigation.navigate('TournamentBracket', { tournamentId });
  };

  if (isInTournament && currentTournament) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => leaveTournament()}
          >
            <Text style={styles.backButtonText}>← Back to Lobby</Text>
          </TouchableOpacity>
          <ConnectionStatus />
        </View>

        <TournamentWaitingRoom
          tournament={currentTournament}
          currentUserId={user.id}
          onLeaveTournament={handleLeaveTournament}
          onStartTournament={handleStartTournament}
          onRefresh={handleRefresh}
          refreshing={refreshing}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Tournaments</Text>
        <ConnectionStatus />
      </View>

      <View style={styles.actionBar}>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Text style={styles.createButtonText}>🏆 Create Tournament</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRefresh}
        >
          <Text style={styles.refreshButtonText}>🔄 Refresh</Text>
        </TouchableOpacity>
      </View>

      <TournamentList
        tournaments={tournaments}
        onJoinTournament={handleJoinTournament}
        onViewTournament={handleViewTournament}
        currentUserId={user.id}
        loading={loading}
      />

      <TournamentCreationModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateTournament={handleCreateTournament}
      />
    </SafeAreaView>
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
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  createButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  refreshButton: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    alignItems: 'center',
  },
  refreshButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default TournamentScreen;