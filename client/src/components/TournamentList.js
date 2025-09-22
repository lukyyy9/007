import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from 'react-native';
import { EmojiResource } from './index';

const TournamentList = ({ 
  tournaments, 
  onJoinTournament, 
  onViewTournament,
  currentUserId,
  loading = false 
}) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'waiting': return '#28a745';
      case 'active': return '#007AFF';
      case 'completed': return '#6c757d';
      case 'cancelled': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getStatusEmoji = (status) => {
    switch (status) {
      case 'waiting': return '⏳';
      case 'active': return '🔥';
      case 'completed': return '🏆';
      case 'cancelled': return '❌';
      default: return '❓';
    }
  };

  const getFormatEmoji = (format) => {
    return format === 'double-elimination' ? '🥇' : '🏆';
  };

  const isPlayerInTournament = (tournament) => {
    return tournament.TournamentPlayers?.some(tp => tp.playerId === currentUserId);
  };

  const canJoinTournament = (tournament) => {
    return tournament.status === 'waiting' && 
           tournament.currentPlayers < tournament.maxPlayers &&
           !isPlayerInTournament(tournament);
  };

  const renderTournamentCard = ({ item: tournament }) => {
    const playerInTournament = isPlayerInTournament(tournament);
    const canJoin = canJoinTournament(tournament);
    const isCreator = tournament.creatorId === currentUserId;

    return (
      <TouchableOpacity
        style={styles.tournamentCard}
        onPress={() => onViewTournament(tournament.id)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.titleRow}>
            <Text style={styles.tournamentName} numberOfLines={1}>
              {tournament.name}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(tournament.status) }]}>
              <Text style={styles.statusText}>
                {getStatusEmoji(tournament.status)} {tournament.status.toUpperCase()}
              </Text>
            </View>
          </View>
          
          <View style={styles.metaRow}>
            <Text style={styles.creatorText}>
              👤 {tournament.creator?.username || 'Unknown'}
              {isCreator && ' (You)'}
            </Text>
            <Text style={styles.formatText}>
              {getFormatEmoji(tournament.format)} {tournament.format.replace('-', ' ')}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.playersSection}>
            <Text style={styles.playersText}>
              👥 {tournament.currentPlayers}/{tournament.maxPlayers} players
            </Text>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${(tournament.currentPlayers / tournament.maxPlayers) * 100}%` }
                ]} 
              />
            </View>
          </View>

          <View style={styles.settingsRow}>
            <View style={styles.setting}>
              <Text style={styles.settingLabel}>⏱️</Text>
              <Text style={styles.settingValue}>{tournament.settings?.turnTimeLimit || 20}s</Text>
            </View>
            <View style={styles.setting}>
              <EmojiResource type="health" value={tournament.settings?.maxHealth || 6} />
              <Text style={styles.settingValue}>{tournament.settings?.maxHealth || 6}</Text>
            </View>
            <View style={styles.setting}>
              <Text style={styles.settingLabel}>🎯</Text>
              <Text style={styles.settingValue}>BO{tournament.settings?.bestOfSeries || 1}</Text>
            </View>
          </View>

          {playerInTournament && (
            <View style={styles.participantBadge}>
              <Text style={styles.participantText}>✅ You're participating</Text>
            </View>
          )}
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.timeText}>
            Created {new Date(tournament.createdAt).toLocaleDateString()}
          </Text>
          
          {canJoin && (
            <TouchableOpacity
              style={styles.joinButton}
              onPress={(e) => {
                e.stopPropagation();
                onJoinTournament(tournament.id);
              }}
            >
              <Text style={styles.joinButtonText}>Join Tournament</Text>
            </TouchableOpacity>
          )}
          
          {tournament.status === 'waiting' && tournament.currentPlayers >= 4 && isCreator && (
            <TouchableOpacity
              style={styles.startButton}
              onPress={(e) => {
                e.stopPropagation();
                // This will be handled by the parent component
              }}
            >
              <Text style={styles.startButtonText}>Start Tournament</Text>
            </TouchableOpacity>
          )}
          
          {!canJoin && !playerInTournament && tournament.status === 'waiting' && (
            <View style={styles.fullBadge}>
              <Text style={styles.fullText}>
                {tournament.currentPlayers >= tournament.maxPlayers ? 'Full' : 'Cannot Join'}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyEmoji}>🏆</Text>
      <Text style={styles.emptyTitle}>No tournaments available</Text>
      <Text style={styles.emptySubtitle}>
        Create a new tournament to get started!
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading tournaments...</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={tournaments}
      renderItem={renderTournamentCard}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContainer}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={renderEmptyState}
    />
  );
};

const styles = StyleSheet.create({
  listContainer: {
    padding: 15,
  },
  tournamentCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#FFD700',
  },
  cardHeader: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tournamentName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  creatorText: {
    fontSize: 14,
    color: '#666',
  },
  formatText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  cardBody: {
    padding: 15,
  },
  playersSection: {
    marginBottom: 15,
  },
  playersText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#28a745',
    borderRadius: 3,
  },
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  setting: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  settingLabel: {
    fontSize: 16,
  },
  settingValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  participantBadge: {
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  participantText: {
    color: '#28a745',
    fontSize: 14,
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  timeText: {
    fontSize: 12,
    color: '#666',
  },
  joinButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  joinButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  startButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  startButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  fullBadge: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  fullText: {
    color: '#6c757d',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 15,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
});

export default TournamentList;