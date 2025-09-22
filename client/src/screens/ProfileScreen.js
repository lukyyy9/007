import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

const ProfileScreen = ({ navigation }) => {
  const [stats, setStats] = useState({
    gamesPlayed: 0,
    gamesWon: 0,
    tournamentsPlayed: 0,
    tournamentsWon: 0,
    winRate: 0,
  });
  const [recentMatches, setRecentMatches] = useState([]);
  const { user, logout } = useAuth();

  useEffect(() => {
    loadUserStats();
    loadRecentMatches();
  }, []);

  const loadUserStats = async () => {
    try {
      const { UserAPI } = require('../services');
      const response = await UserAPI.getUserStats();
      
      if (response.stats) {
        setStats(response.stats);
      } else {
        // If no stats endpoint available, calculate from games
        const gamesResponse = await UserAPI.getRecentMatches({ limit: 100 });
        if (gamesResponse.games) {
          const games = gamesResponse.games;
          const gamesPlayed = games.length;
          const gamesWon = games.filter(game => 
            (game.winnerId === user?.id) || 
            (game.winner?.id === user?.id)
          ).length;
          const winRate = gamesPlayed > 0 ? Math.round((gamesWon / gamesPlayed) * 100) : 0;
          
          setStats({
            gamesPlayed,
            gamesWon,
            tournamentsPlayed: 0, // Would need separate tournament endpoint
            tournamentsWon: 0,
            winRate,
          });
        }
      }
    } catch (error) {
      console.error('Error loading user stats:', error);
      // Keep default stats on error
    }
  };

  const loadRecentMatches = async () => {
    try {
      const { UserAPI } = require('../services');
      const { transformMatchData } = require('../utils');
      const response = await UserAPI.getRecentMatches({ limit: 10 });
      
      if (response.games) {
        // Transform server data to match UI expectations
        const transformedMatches = response.games.map(game => 
          transformMatchData(game, user?.id)
        );
        setRecentMatches(transformedMatches);
      }
    } catch (error) {
      console.error('Error loading recent matches:', error);
      // Keep existing matches on error
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

  const handleClearHistory = () => {
    Alert.alert(
      'Clear History',
      'Are you sure you want to clear your match history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            setRecentMatches([]);
            Alert.alert('Success', 'Match history cleared.');
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.profileInfo}>
          <Text style={styles.username}>{user?.username}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Statistics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Statistics</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.gamesPlayed}</Text>
            <Text style={styles.statLabel}>Games Played</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.gamesWon}</Text>
            <Text style={styles.statLabel}>Games Won</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.winRate}%</Text>
            <Text style={styles.statLabel}>Win Rate</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.tournamentsWon}</Text>
            <Text style={styles.statLabel}>Tournaments Won</Text>
          </View>
        </View>
      </View>

      {/* Achievement Badges */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Achievements</Text>
        <View style={styles.achievementsContainer}>
          <View style={styles.achievement}>
            <Text style={styles.achievementEmoji}>🏆</Text>
            <Text style={styles.achievementName}>Tournament Winner</Text>
          </View>
          <View style={styles.achievement}>
            <Text style={styles.achievementEmoji}>🔥</Text>
            <Text style={styles.achievementName}>Win Streak</Text>
          </View>
          <View style={styles.achievement}>
            <Text style={styles.achievementEmoji}>⚡</Text>
            <Text style={styles.achievementName}>Quick Victory</Text>
          </View>
          <View style={[styles.achievement, styles.achievementLocked]}>
            <Text style={styles.achievementEmoji}>🎯</Text>
            <Text style={styles.achievementName}>Perfect Game</Text>
          </View>
        </View>
      </View>

      {/* Recent Matches */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Matches</Text>
          <TouchableOpacity onPress={handleClearHistory}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        </View>
        
        {recentMatches.length === 0 ? (
          <Text style={styles.emptyText}>No recent matches</Text>
        ) : (
          recentMatches.map((match) => (
            <View key={match.id} style={styles.matchCard}>
              <View style={styles.matchInfo}>
                <View style={styles.matchHeader}>
                  <Text style={styles.opponentName}>vs {match.opponent}</Text>
                  <Text style={[
                    styles.matchResult,
                    match.result === 'win' ? styles.winResult : styles.lossResult
                  ]}>
                    {match.result === 'win' ? '✅ WIN' : '❌ LOSS'}
                  </Text>
                </View>
                <View style={styles.matchDetails}>
                  <Text style={styles.matchDetail}>{match.type}</Text>
                  <Text style={styles.matchDetail}>•</Text>
                  <Text style={styles.matchDetail}>{match.duration}</Text>
                  <Text style={styles.matchDetail}>•</Text>
                  <Text style={styles.matchDetail}>{match.date}</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingText}>🔊 Sound Effects</Text>
          <Text style={styles.settingValue}>On</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingText}>📳 Vibration</Text>
          <Text style={styles.settingValue}>On</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingText}>🌙 Dark Mode</Text>
          <Text style={styles.settingValue}>Off</Text>
        </TouchableOpacity>
      </View>

      {/* Navigation */}
      <View style={styles.section}>
        <TouchableOpacity 
          style={styles.navigationButton}
          onPress={() => navigation.navigate('Lobby')}
        >
          <Text style={styles.navigationButtonText}>🏠 Back to Lobby</Text>
        </TouchableOpacity>
      </View>
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
  profileInfo: {
    flex: 1,
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: '#666',
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  clearText: {
    color: '#ff4444',
    fontSize: 14,
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    width: '47%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  achievementsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  achievement: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    width: '47%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  achievementLocked: {
    backgroundColor: '#f8f9fa',
    opacity: 0.6,
  },
  achievementEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  achievementName: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
    fontWeight: '500',
  },
  matchCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  matchInfo: {
    flex: 1,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  opponentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  matchResult: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  winResult: {
    color: '#28a745',
  },
  lossResult: {
    color: '#dc3545',
  },
  matchDetails: {
    flexDirection: 'row',
    gap: 8,
  },
  matchDetail: {
    fontSize: 14,
    color: '#666',
  },
  settingItem: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingText: {
    fontSize: 16,
    color: '#333',
  },
  settingValue: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  navigationButton: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
  },
  navigationButtonText: {
    color: 'white',
    fontSize: 16,
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

export default ProfileScreen;