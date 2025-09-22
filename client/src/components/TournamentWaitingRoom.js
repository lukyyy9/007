import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import { EmojiResource } from './index';

const TournamentWaitingRoom = ({ 
  tournament, 
  currentUserId, 
  onLeaveTournament, 
  onStartTournament,
  onRefresh,
  refreshing = false 
}) => {
  const [timeUntilStart, setTimeUntilStart] = useState(null);

  const isCreator = tournament.creatorId === currentUserId;
  const canStart = tournament.currentPlayers >= 4 && tournament.status === 'waiting';
  const isFull = tournament.currentPlayers >= tournament.maxPlayers;

  useEffect(() => {
    // Auto-refresh every 5 seconds when waiting
    let interval;
    if (tournament.status === 'waiting') {
      interval = setInterval(() => {
        onRefresh?.();
      }, 5000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [tournament.status, onRefresh]);

  const handleLeave = () => {
    Alert.alert(
      'Leave Tournament',
      'Are you sure you want to leave this tournament?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Leave', 
          style: 'destructive',
          onPress: onLeaveTournament 
        },
      ]
    );
  };

  const handleStart = () => {
    if (tournament.currentPlayers < 4) {
      Alert.alert(
        'Cannot Start',
        'Tournament needs at least 4 players to start.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Check if player count is power of 2
    const playerCount = tournament.currentPlayers;
    if ((playerCount & (playerCount - 1)) !== 0) {
      Alert.alert(
        'Cannot Start',
        'Tournament requires a power of 2 number of players (4, 8, 16, 32).',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Start Tournament',
      `Start tournament with ${tournament.currentPlayers} players?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Start', 
          onPress: onStartTournament 
        },
      ]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'waiting': return '#28a745';
      case 'active': return '#007AFF';
      case 'completed': return '#6c757d';
      default: return '#6c757d';
    }
  };

  const getStatusEmoji = (status) => {
    switch (status) {
      case 'waiting': return '⏳';
      case 'active': return '🔥';
      case 'completed': return '🏆';
      default: return '❓';
    }
  };

  const renderPlayerList = () => {
    const players = tournament.TournamentPlayers || [];
    const emptySlots = tournament.maxPlayers - players.length;

    return (
      <View style={styles.playersContainer}>
        <Text style={styles.sectionTitle}>
          👥 Players ({players.length}/{tournament.maxPlayers})
        </Text>
        
        <View style={styles.playerGrid}>
          {players.map((tournamentPlayer, index) => (
            <View key={tournamentPlayer.id} style={styles.playerCard}>
              <View style={styles.playerInfo}>
                <Text style={styles.playerName}>
                  {tournamentPlayer.player?.username || 'Unknown'}
                </Text>
                <Text style={styles.seedPosition}>
                  Seed #{tournamentPlayer.seedPosition}
                </Text>
              </View>
              {tournamentPlayer.playerId === currentUserId && (
                <View style={styles.youBadge}>
                  <Text style={styles.youText}>You</Text>
                </View>
              )}
              {tournamentPlayer.playerId === tournament.creatorId && (
                <View style={styles.creatorBadge}>
                  <Text style={styles.creatorText}>👑</Text>
                </View>
              )}
            </View>
          ))}
          
          {/* Empty slots */}
          {Array.from({ length: emptySlots }, (_, index) => (
            <View key={`empty-${index}`} style={[styles.playerCard, styles.emptySlot]}>
              <Text style={styles.emptySlotText}>Waiting for player...</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderTournamentSettings = () => (
    <View style={styles.settingsContainer}>
      <Text style={styles.sectionTitle}>🎮 Tournament Settings</Text>
      
      <View style={styles.settingsGrid}>
        <View style={styles.settingCard}>
          <Text style={styles.settingLabel}>Format</Text>
          <Text style={styles.settingValue}>
            {tournament.format === 'double-elimination' ? '🥇' : '🏆'} {tournament.format.replace('-', ' ')}
          </Text>
        </View>
        
        <View style={styles.settingCard}>
          <Text style={styles.settingLabel}>Turn Timer</Text>
          <Text style={styles.settingValue}>
            ⏱️ {tournament.settings?.turnTimeLimit || 20}s
          </Text>
        </View>
        
        <View style={styles.settingCard}>
          <Text style={styles.settingLabel}>Starting Health</Text>
          <Text style={styles.settingValue}>
            <EmojiResource type="health" value={tournament.settings?.maxHealth || 6} /> {tournament.settings?.maxHealth || 6}
          </Text>
        </View>
        
        <View style={styles.settingCard}>
          <Text style={styles.settingLabel}>Match Format</Text>
          <Text style={styles.settingValue}>
            🎯 Best of {tournament.settings?.bestOfSeries || 1}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Tournament Header */}
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <Text style={styles.tournamentName}>{tournament.name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(tournament.status) }]}>
            <Text style={styles.statusText}>
              {getStatusEmoji(tournament.status)} {tournament.status.toUpperCase()}
            </Text>
          </View>
        </View>
        
        <Text style={styles.creatorText}>
          Created by {tournament.creator?.username || 'Unknown'}
        </Text>
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressSection}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${(tournament.currentPlayers / tournament.maxPlayers) * 100}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {tournament.currentPlayers}/{tournament.maxPlayers} players joined
        </Text>
        
        {isFull && (
          <View style={styles.fullBadge}>
            <Text style={styles.fullText}>🎉 Tournament is full!</Text>
          </View>
        )}
        
        {canStart && isCreator && (
          <View style={styles.readyBadge}>
            <Text style={styles.readyText}>✅ Ready to start!</Text>
          </View>
        )}
      </View>

      {/* Player List */}
      {renderPlayerList()}

      {/* Tournament Settings */}
      {renderTournamentSettings()}

      {/* Action Buttons */}
      <View style={styles.actionSection}>
        {tournament.status === 'waiting' && (
          <>
            {isCreator && canStart && (
              <TouchableOpacity style={styles.startButton} onPress={handleStart}>
                <Text style={styles.startButtonText}>🚀 Start Tournament</Text>
              </TouchableOpacity>
            )}
            
            {isCreator && !canStart && (
              <View style={styles.waitingButton}>
                <Text style={styles.waitingButtonText}>
                  ⏳ Waiting for {4 - tournament.currentPlayers} more players
                </Text>
              </View>
            )}
            
            <TouchableOpacity style={styles.leaveButton} onPress={handleLeave}>
              <Text style={styles.leaveButtonText}>Leave Tournament</Text>
            </TouchableOpacity>
          </>
        )}
        
        {tournament.status === 'active' && (
          <View style={styles.activeBadge}>
            <Text style={styles.activeText}>🔥 Tournament is active!</Text>
          </View>
        )}
        
        {tournament.status === 'completed' && (
          <View style={styles.completedBadge}>
            <Text style={styles.completedText}>
              🏆 Tournament completed! 
              {tournament.winner && ` Winner: ${tournament.winner.username}`}
            </Text>
          </View>
        )}
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
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  titleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tournamentName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  creatorText: {
    fontSize: 14,
    color: '#666',
  },
  progressSection: {
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#28a745',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
  },
  fullBadge: {
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'center',
    marginTop: 10,
  },
  fullText: {
    color: '#28a745',
    fontSize: 14,
    fontWeight: '600',
  },
  readyBadge: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'center',
    marginTop: 10,
  },
  readyText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  playersContainer: {
    backgroundColor: 'white',
    margin: 15,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  playerGrid: {
    gap: 10,
  },
  playerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  emptySlot: {
    backgroundColor: '#f8f9fa',
    borderStyle: 'dashed',
    borderColor: '#dee2e6',
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  seedPosition: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  emptySlotText: {
    fontSize: 14,
    color: '#adb5bd',
    fontStyle: 'italic',
  },
  youBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginLeft: 10,
  },
  youText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  creatorBadge: {
    marginLeft: 5,
  },
  creatorText: {
    fontSize: 16,
  },
  settingsContainer: {
    backgroundColor: 'white',
    margin: 15,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  settingCard: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  settingValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  actionSection: {
    padding: 20,
    gap: 15,
  },
  startButton: {
    backgroundColor: '#28a745',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  startButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  waitingButton: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  waitingButtonText: {
    color: '#6c757d',
    fontSize: 16,
    fontWeight: '500',
  },
  leaveButton: {
    backgroundColor: 'white',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dc3545',
  },
  leaveButtonText: {
    color: '#dc3545',
    fontSize: 16,
    fontWeight: '600',
  },
  activeBadge: {
    backgroundColor: '#e3f2fd',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  activeText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  completedBadge: {
    backgroundColor: '#fff3cd',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  completedText: {
    color: '#856404',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default TournamentWaitingRoom;