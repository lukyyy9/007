import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

const TournamentRankings = ({ 
  tournament, 
  players, 
  currentUserId,
  onPlayerPress 
}) => {
  const getRankEmoji = (rank) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `${rank}.`;
    }
  };

  const getRankColor = (rank) => {
    switch (rank) {
      case 1: return '#FFD700';
      case 2: return '#C0C0C0';
      case 3: return '#CD7F32';
      default: return '#f8f9fa';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'winner': return '#28a745';
      case 'active': return '#007AFF';
      case 'eliminated': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'winner': return '👑 Champion';
      case 'active': return '🔥 Active';
      case 'eliminated': return '❌ Eliminated';
      default: return '⏳ Waiting';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const sortedPlayers = [...players].sort((a, b) => {
    // Winner first
    if (a.status === 'winner') return -1;
    if (b.status === 'winner') return 1;

    // Then by final rank if available
    if (a.finalRank && b.finalRank) {
      return a.finalRank - b.finalRank;
    }

    // Then by elimination time (later elimination = higher rank)
    if (a.eliminatedAt && b.eliminatedAt) {
      return new Date(b.eliminatedAt) - new Date(a.eliminatedAt);
    }
    if (a.eliminatedAt) return 1;
    if (b.eliminatedAt) return -1;

    // Then by wins
    return (b.wins || 0) - (a.wins || 0);
  });

  const renderPlayerCard = (player, index) => {
    const isCurrentUser = player.player?.id === currentUserId || player.playerId === currentUserId;
    const rank = player.finalRank || index + 1;
    const playerData = player.player || player;

    return (
      <TouchableOpacity
        key={player.id || `${player.playerId}-${index}`}
        style={[
          styles.playerCard,
          { backgroundColor: getRankColor(rank) },
          isCurrentUser && styles.currentUserCard,
        ]}
        onPress={() => onPlayerPress?.(playerData)}
        activeOpacity={0.7}
      >
        <View style={styles.rankSection}>
          <Text style={styles.rankEmoji}>{getRankEmoji(rank)}</Text>
          <Text style={styles.rankNumber}>#{rank}</Text>
        </View>

        <View style={styles.playerInfo}>
          <View style={styles.playerHeader}>
            <Text style={[styles.playerName, isCurrentUser && styles.currentUserName]}>
              {playerData.username || 'Unknown Player'}
              {isCurrentUser && ' (You)'}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(player.status) }]}>
              <Text style={styles.statusText}>{getStatusText(player.status)}</Text>
            </View>
          </View>

          <View style={styles.playerStats}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Wins</Text>
              <Text style={styles.statValue}>{player.wins || 0}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Losses</Text>
              <Text style={styles.statValue}>{player.losses || 0}</Text>
            </View>
            {tournament.format === 'double-elimination' && (
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Lives</Text>
                <Text style={styles.statValue}>
                  {player.status === 'eliminated' ? '0' : player.losses === 1 ? '1' : '2'}
                </Text>
              </View>
            )}
          </View>

          {player.eliminatedAt && (
            <Text style={styles.eliminationTime}>
              Eliminated: {formatDate(player.eliminatedAt)}
            </Text>
          )}

          {player.joinedAt && (
            <Text style={styles.joinTime}>
              Joined: {formatDate(player.joinedAt)}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderTournamentSummary = () => {
    const totalPlayers = players.length;
    const activePlayers = players.filter(p => p.status === 'active').length;
    const eliminatedPlayers = players.filter(p => p.status === 'eliminated').length;
    const winner = players.find(p => p.status === 'winner');

    return (
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>Tournament Summary</Text>
        
        {winner && (
          <View style={styles.championSection}>
            <Text style={styles.championEmoji}>🏆</Text>
            <Text style={styles.championText}>
              Champion: {winner.player?.username || winner.username || 'Unknown'}
            </Text>
            {tournament.completedAt && (
              <Text style={styles.completionTime}>
                Completed: {formatDate(tournament.completedAt)}
              </Text>
            )}
          </View>
        )}

        <View style={styles.summaryStats}>
          <View style={styles.summaryStatItem}>
            <Text style={styles.summaryStatValue}>{totalPlayers}</Text>
            <Text style={styles.summaryStatLabel}>Total Players</Text>
          </View>
          <View style={styles.summaryStatItem}>
            <Text style={styles.summaryStatValue}>{activePlayers}</Text>
            <Text style={styles.summaryStatLabel}>Still Active</Text>
          </View>
          <View style={styles.summaryStatItem}>
            <Text style={styles.summaryStatValue}>{eliminatedPlayers}</Text>
            <Text style={styles.summaryStatLabel}>Eliminated</Text>
          </View>
        </View>

        <View style={styles.tournamentInfo}>
          <Text style={styles.tournamentInfoText}>
            📅 Started: {tournament.startedAt ? formatDate(tournament.startedAt) : 'Not started'}
          </Text>
          <Text style={styles.tournamentInfoText}>
            🎮 Format: {tournament.format?.replace('-', ' ') || 'Unknown'}
          </Text>
          <Text style={styles.tournamentInfoText}>
            ⚙️ Settings: {tournament.settings?.maxHealth || 6}❤️, {tournament.settings?.turnTimeLimit || 20}s timer
          </Text>
        </View>
      </View>
    );
  };

  if (!players || players.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyEmoji}>🏆</Text>
        <Text style={styles.emptyTitle}>No rankings available</Text>
        <Text style={styles.emptySubtitle}>
          Tournament hasn't started or no players have been ranked yet.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {renderTournamentSummary()}
      
      <View style={styles.rankingsContainer}>
        <Text style={styles.rankingsTitle}>Final Rankings</Text>
        {sortedPlayers.map((player, index) => renderPlayerCard(player, index))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  summaryContainer: {
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
  summaryTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  championSection: {
    alignItems: 'center',
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#fff3cd',
    borderRadius: 10,
  },
  championEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  championText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 4,
  },
  completionTime: {
    fontSize: 14,
    color: '#856404',
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  summaryStatItem: {
    alignItems: 'center',
  },
  summaryStatValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#007AFF',
  },
  summaryStatLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  tournamentInfo: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
  },
  tournamentInfoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  rankingsContainer: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  rankingsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  playerCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  currentUserCard: {
    borderWidth: 3,
    borderColor: '#007AFF',
  },
  rankSection: {
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
  },
  rankEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  rankNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  playerInfo: {
    flex: 1,
    padding: 15,
  },
  playerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  playerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  currentUserName: {
    color: '#007AFF',
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
  playerStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  eliminationTime: {
    fontSize: 12,
    color: '#dc3545',
    marginBottom: 2,
  },
  joinTime: {
    fontSize: 12,
    color: '#666',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
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
    paddingHorizontal: 40,
  },
});

export default TournamentRankings;