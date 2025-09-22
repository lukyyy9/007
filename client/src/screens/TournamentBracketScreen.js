import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import SingleEliminationBracket from '../components/SingleEliminationBracket';
import DoubleEliminationBracket from '../components/DoubleEliminationBracket';
import TournamentRankings from '../components/TournamentRankings';
import ConnectionStatus from '../components/ConnectionStatus';

const TournamentBracketScreen = ({ route, navigation }) => {
  const { tournamentId } = route.params;
  const [tournament, setTournament] = useState(null);
  const [brackets, setBrackets] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState('bracket');
  
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    loadTournamentData();
    setupSocketListeners();

    return () => {
      cleanupSocketListeners();
    };
  }, [tournamentId]);

  const setupSocketListeners = () => {
    if (!socket) return;

    socket.on('tournament:brackets-update', handleBracketsUpdate);
    socket.on('tournament:status-update', handleTournamentStatusUpdate);
    socket.on('tournament:match-started', handleMatchStarted);
    socket.on('tournament:match-completed', handleMatchCompleted);
    socket.on('tournament:completed', handleTournamentCompleted);
    socket.on('tournament:error', handleTournamentError);

    // Join tournament room for real-time updates
    socket.emit('tournament:join', { tournamentId });
  };

  const cleanupSocketListeners = () => {
    if (!socket) return;

    socket.off('tournament:brackets-update', handleBracketsUpdate);
    socket.off('tournament:status-update', handleTournamentStatusUpdate);
    socket.off('tournament:match-started', handleMatchStarted);
    socket.off('tournament:match-completed', handleMatchCompleted);
    socket.off('tournament:completed', handleTournamentCompleted);
    socket.off('tournament:error', handleTournamentError);

    // Leave tournament room
    socket.emit('tournament:leave', { tournamentId });
  };

  const handleBracketsUpdate = (data) => {
    console.log('Brackets updated:', data);
    if (data.tournamentId === tournamentId) {
      setBrackets(data.brackets);
    }
  };

  const handleTournamentStatusUpdate = (data) => {
    console.log('Tournament status updated:', data);
    if (data.tournament && data.tournament.id === tournamentId) {
      setTournament(data.tournament);
    }
  };

  const handleMatchStarted = (data) => {
    console.log('Match started:', data);
    if (data.tournamentId === tournamentId) {
      Alert.alert(
        'Match Started!',
        `A match has started. ${data.match?.player1?.username} vs ${data.match?.player2?.username}`,
        [{ text: 'OK' }]
      );
      loadTournamentData(); // Refresh data
    }
  };

  const handleMatchCompleted = (data) => {
    console.log('Match completed:', data);
    if (data.tournamentId === tournamentId) {
      Alert.alert(
        'Match Completed!',
        `${data.winner?.username} defeated ${data.loser?.username}`,
        [{ text: 'OK' }]
      );
      loadTournamentData(); // Refresh data
    }
  };

  const handleTournamentCompleted = (data) => {
    console.log('Tournament completed:', data);
    if (data.tournamentId === tournamentId) {
      Alert.alert(
        'Tournament Complete!',
        `🏆 Champion: ${data.winner?.username}`,
        [{ text: 'View Results', onPress: () => setSelectedTab('rankings') }]
      );
      loadTournamentData(); // Refresh data
    }
  };

  const handleTournamentError = (data) => {
    console.error('Tournament error:', data);
    Alert.alert('Tournament Error', data.error || 'An error occurred');
  };

  const loadTournamentData = async () => {
    try {
      setLoading(true);
      
      // Load tournament details
      const tournamentResponse = await fetch(`/api/tournaments/${tournamentId}`, {
        headers: {
          'Authorization': `Bearer ${user.token}`,
        },
      });

      if (tournamentResponse.ok) {
        const tournamentData = await tournamentResponse.json();
        setTournament(tournamentData.tournament);
      }

      // Load brackets if tournament is active or completed
      if (tournament?.status === 'active' || tournament?.status === 'completed') {
        const bracketsResponse = await fetch(`/api/tournaments/${tournamentId}/brackets`, {
          headers: {
            'Authorization': `Bearer ${user.token}`,
          },
        });

        if (bracketsResponse.ok) {
          const bracketsData = await bracketsResponse.json();
          setBrackets(bracketsData.brackets);
        }
      }
    } catch (error) {
      console.error('Error loading tournament data:', error);
      Alert.alert('Error', 'Failed to load tournament data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTournamentData();
    setRefreshing(false);
  };

  const handleMatchPress = (match) => {
    if (match.status === 'active') {
      const isPlayerInMatch = match.player1?.id === user.id || match.player2?.id === user.id;
      
      if (isPlayerInMatch) {
        Alert.alert(
          'Join Match',
          'Your match is ready! Would you like to join?',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Join Match', 
              onPress: () => {
                // Navigate to game board with match details
                navigation.navigate('GameBoard', { 
                  gameId: match.gameId,
                  matchId: match.id,
                  tournamentId: tournamentId 
                });
              }
            },
          ]
        );
      } else {
        Alert.alert(
          'Match in Progress',
          `${match.player1?.username} vs ${match.player2?.username}`,
          [{ text: 'OK' }]
        );
      }
    } else if (match.status === 'completed') {
      Alert.alert(
        'Match Result',
        `Winner: ${match.winner?.username}\nLoser: ${match.player1?.id === match.winner?.id ? match.player2?.username : match.player1?.username}`,
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert(
        'Match Pending',
        'This match hasn\'t started yet.',
        [{ text: 'OK' }]
      );
    }
  };

  const handlePlayerPress = (player) => {
    // Could navigate to player profile or show player stats
    Alert.alert(
      'Player Info',
      `Username: ${player.username}`,
      [{ text: 'OK' }]
    );
  };

  const renderTabSelector = () => (
    <View style={styles.tabSelector}>
      <TouchableOpacity
        style={[
          styles.tab,
          selectedTab === 'bracket' && styles.activeTab,
        ]}
        onPress={() => setSelectedTab('bracket')}
      >
        <Text style={[
          styles.tabText,
          selectedTab === 'bracket' && styles.activeTabText,
        ]}>
          🏆 Bracket
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.tab,
          selectedTab === 'rankings' && styles.activeTab,
        ]}
        onPress={() => setSelectedTab('rankings')}
      >
        <Text style={[
          styles.tabText,
          selectedTab === 'rankings' && styles.activeTabText,
        ]}>
          📊 Rankings
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderContent = () => {
    if (selectedTab === 'rankings') {
      return (
        <TournamentRankings
          tournament={tournament}
          players={tournament?.TournamentPlayers || []}
          currentUserId={user.id}
          onPlayerPress={handlePlayerPress}
        />
      );
    }

    // Render bracket based on tournament format
    if (tournament?.format === 'double-elimination') {
      return (
        <DoubleEliminationBracket
          brackets={brackets}
          tournament={tournament}
          onMatchPress={handleMatchPress}
          currentUserId={user.id}
        />
      );
    } else {
      return (
        <SingleEliminationBracket
          brackets={brackets}
          tournament={tournament}
          onMatchPress={handleMatchPress}
          currentUserId={user.id}
        />
      );
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading tournament...</Text>
      </SafeAreaView>
    );
  }

  if (!tournament) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorEmoji}>❌</Text>
        <Text style={styles.errorTitle}>Tournament not found</Text>
        <Text style={styles.errorSubtitle}>
          The tournament you're looking for doesn't exist or has been deleted.
        </Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerBackButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.headerBackText}>← Back</Text>
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {tournament.name}
          </Text>
          <Text style={styles.headerSubtitle}>
            {tournament.format?.replace('-', ' ')} • {tournament.status}
          </Text>
        </View>
        
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={handleRefresh} disabled={refreshing}>
            <Text style={styles.refreshButton}>
              {refreshing ? '⏳' : '🔄'}
            </Text>
          </TouchableOpacity>
          <ConnectionStatus />
        </View>
      </View>

      {renderTabSelector()}
      {renderContent()}
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
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerBackButton: {
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  headerBackText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  refreshButton: {
    fontSize: 20,
    padding: 5,
  },
  tabSelector: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 15,
    marginVertical: 10,
    borderRadius: 10,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 40,
  },
  errorEmoji: {
    fontSize: 48,
    marginBottom: 15,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  backButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TournamentBracketScreen;