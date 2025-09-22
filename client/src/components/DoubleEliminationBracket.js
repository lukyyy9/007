import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';

const DoubleEliminationBracket = ({ 
  brackets, 
  tournament, 
  onMatchPress,
  currentUserId 
}) => {
  const [selectedBracket, setSelectedBracket] = useState('winner');
  
  const winnerBracket = brackets.winner || {};
  const loserBracket = brackets.loser || {};
  
  const winnerRounds = Object.keys(winnerBracket).sort((a, b) => parseInt(a) - parseInt(b));
  const loserRounds = Object.keys(loserBracket).sort((a, b) => parseInt(a) - parseInt(b));

  const getMatchStatusColor = (match) => {
    switch (match.status) {
      case 'pending': return '#f8f9fa';
      case 'active': return '#e3f2fd';
      case 'completed': return '#e8f5e8';
      default: return '#f8f9fa';
    }
  };

  const getMatchStatusBorder = (match) => {
    switch (match.status) {
      case 'pending': return '#dee2e6';
      case 'active': return '#007AFF';
      case 'completed': return '#28a745';
      default: return '#dee2e6';
    }
  };

  const isPlayerInMatch = (match) => {
    return match.player1?.id === currentUserId || match.player2?.id === currentUserId;
  };

  const renderPlayer = (player, isWinner, match) => {
    if (!player) {
      return (
        <View style={styles.playerSlot}>
          <Text style={styles.emptyPlayerText}>TBD</Text>
        </View>
      );
    }

    const isCurrentUser = player.id === currentUserId;
    
    return (
      <View style={[
        styles.playerSlot,
        isWinner && styles.winnerSlot,
        isCurrentUser && styles.currentUserSlot,
      ]}>
        <Text style={[
          styles.playerName,
          isWinner && styles.winnerText,
          isCurrentUser && styles.currentUserText,
        ]}>
          {player.username}
          {isCurrentUser && ' (You)'}
        </Text>
        {isWinner && <Text style={styles.winnerIcon}>👑</Text>}
      </View>
    );
  };

  const renderMatch = (match, roundIndex, matchIndex, bracketType) => {
    const isWinner1 = match.winner?.id === match.player1?.id;
    const isWinner2 = match.winner?.id === match.player2?.id;
    const isUserMatch = isPlayerInMatch(match);

    return (
      <TouchableOpacity
        key={match.id}
        style={[
          styles.matchCard,
          { 
            backgroundColor: getMatchStatusColor(match),
            borderColor: getMatchStatusBorder(match),
          },
          isUserMatch && styles.userMatchCard,
          bracketType === 'loser' && styles.loserBracketMatch,
        ]}
        onPress={() => onMatchPress?.(match)}
        activeOpacity={0.7}
      >
        <View style={styles.matchHeader}>
          <Text style={styles.matchTitle}>
            {bracketType === 'winner' ? '🏆' : '🥈'} Round {roundIndex + 1} - Match {matchIndex + 1}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: getMatchStatusBorder(match) }]}>
            <Text style={styles.statusText}>
              {match.status === 'pending' && '⏳'}
              {match.status === 'active' && '🔥'}
              {match.status === 'completed' && '✅'}
            </Text>
          </View>
        </View>

        <View style={styles.matchBody}>
          {renderPlayer(match.player1, isWinner1, match)}
          <View style={styles.vsContainer}>
            <Text style={styles.vsText}>VS</Text>
          </View>
          {renderPlayer(match.player2, isWinner2, match)}
        </View>

        {match.status === 'completed' && match.winner && (
          <View style={styles.matchFooter}>
            <Text style={styles.winnerText}>
              🏆 Winner: {match.winner.username}
            </Text>
            {bracketType === 'winner' && (
              <Text style={styles.advanceText}>Advances in Winner Bracket</Text>
            )}
            {bracketType === 'loser' && (
              <Text style={styles.eliminatedText}>Loser is eliminated</Text>
            )}
          </View>
        )}

        {match.status === 'active' && isUserMatch && (
          <View style={styles.activeMatchFooter}>
            <Text style={styles.activeMatchText}>🔥 Your match is ready!</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderRound = (roundNumber, roundIndex, bracketType) => {
    const bracket = bracketType === 'winner' ? winnerBracket : loserBracket;
    const roundMatches = bracket[roundNumber] || [];
    const rounds = bracketType === 'winner' ? winnerRounds : loserRounds;
    const isLastRound = roundIndex === rounds.length - 1;

    let roundTitle = `Round ${roundIndex + 1}`;
    if (bracketType === 'winner' && isLastRound) {
      roundTitle = '🏆 Winner Final';
    } else if (bracketType === 'loser' && isLastRound) {
      roundTitle = '🥈 Loser Final';
    }

    return (
      <View key={`${bracketType}-${roundNumber}`} style={styles.roundContainer}>
        <View style={styles.roundHeader}>
          <Text style={styles.roundTitle}>{roundTitle}</Text>
          <Text style={styles.roundSubtitle}>
            {roundMatches.length} match{roundMatches.length !== 1 ? 'es' : ''}
          </Text>
        </View>
        
        <View style={styles.roundMatches}>
          {roundMatches.map((match, matchIndex) => 
            renderMatch(match, roundIndex, matchIndex, bracketType)
          )}
        </View>
      </View>
    );
  };

  const renderBracketSelector = () => (
    <View style={styles.bracketSelector}>
      <TouchableOpacity
        style={[
          styles.bracketTab,
          selectedBracket === 'winner' && styles.activeBracketTab,
        ]}
        onPress={() => setSelectedBracket('winner')}
      >
        <Text style={[
          styles.bracketTabText,
          selectedBracket === 'winner' && styles.activeBracketTabText,
        ]}>
          🏆 Winner Bracket
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.bracketTab,
          selectedBracket === 'loser' && styles.activeBracketTab,
        ]}
        onPress={() => setSelectedBracket('loser')}
      >
        <Text style={[
          styles.bracketTabText,
          selectedBracket === 'loser' && styles.activeBracketTabText,
        ]}>
          🥈 Loser Bracket
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderBracketOverview = () => {
    const allMatches = [...Object.values(winnerBracket).flat(), ...Object.values(loserBracket).flat()];
    const totalMatches = allMatches.length;
    const completedMatches = allMatches.filter(m => m.status === 'completed').length;
    const activeMatches = allMatches.filter(m => m.status === 'active').length;

    return (
      <View style={styles.overviewContainer}>
        <Text style={styles.overviewTitle}>Double Elimination Progress</Text>
        <View style={styles.overviewStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{tournament.currentRound}</Text>
            <Text style={styles.statLabel}>Current Round</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{completedMatches}/{totalMatches}</Text>
            <Text style={styles.statLabel}>Matches Complete</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{activeMatches}</Text>
            <Text style={styles.statLabel}>Active Matches</Text>
          </View>
        </View>
        
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${totalMatches > 0 ? (completedMatches / totalMatches) * 100 : 0}%` }
            ]} 
          />
        </View>
        
        <View style={styles.bracketInfo}>
          <Text style={styles.bracketInfoText}>
            💡 Double elimination gives players a second chance. 
            Lose in winner bracket? Drop to loser bracket. 
            Lose in loser bracket? You're eliminated.
          </Text>
        </View>
      </View>
    );
  };

  const renderSelectedBracket = () => {
    const rounds = selectedBracket === 'winner' ? winnerRounds : loserRounds;
    
    if (rounds.length === 0) {
      return (
        <View style={styles.emptyBracket}>
          <Text style={styles.emptyBracketText}>
            {selectedBracket === 'winner' 
              ? 'Winner bracket not yet generated' 
              : 'No players in loser bracket yet'
            }
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.bracketContainer}>
        {rounds.map((roundNumber, roundIndex) => 
          renderRound(roundNumber, roundIndex, selectedBracket)
        )}
      </View>
    );
  };

  if (winnerRounds.length === 0 && loserRounds.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyEmoji}>🏆</Text>
        <Text style={styles.emptyTitle}>No bracket available</Text>
        <Text style={styles.emptySubtitle}>
          Tournament hasn't started yet or bracket is being generated.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {renderBracketOverview()}
      {renderBracketSelector()}
      {renderSelectedBracket()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  overviewContainer: {
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
  overviewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  overviewStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 15,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#28a745',
    borderRadius: 3,
  },
  bracketInfo: {
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
  },
  bracketInfoText: {
    fontSize: 14,
    color: '#1565c0',
    textAlign: 'center',
    lineHeight: 20,
  },
  bracketSelector: {
    flexDirection: 'row',
    marginHorizontal: 15,
    marginBottom: 15,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bracketTab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeBracketTab: {
    backgroundColor: '#007AFF',
  },
  bracketTabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  activeBracketTabText: {
    color: 'white',
  },
  bracketContainer: {
    paddingHorizontal: 15,
  },
  roundContainer: {
    marginBottom: 25,
  },
  roundHeader: {
    alignItems: 'center',
    marginBottom: 15,
  },
  roundTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  roundSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  roundMatches: {
    gap: 15,
  },
  matchCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userMatchCard: {
    borderWidth: 3,
    borderColor: '#FFD700',
  },
  loserBracketMatch: {
    borderLeftWidth: 4,
    borderLeftColor: '#ff6b6b',
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  matchTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  matchBody: {
    padding: 15,
  },
  playerSlot: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  winnerSlot: {
    backgroundColor: '#e8f5e8',
    borderColor: '#28a745',
  },
  currentUserSlot: {
    backgroundColor: '#e3f2fd',
    borderColor: '#007AFF',
  },
  playerName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  winnerText: {
    color: '#28a745',
    fontWeight: '600',
  },
  currentUserText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  emptyPlayerText: {
    fontSize: 16,
    color: '#adb5bd',
    fontStyle: 'italic',
  },
  winnerIcon: {
    fontSize: 16,
  },
  vsContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  vsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  matchFooter: {
    backgroundColor: '#e8f5e8',
    padding: 12,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    alignItems: 'center',
  },
  advanceText: {
    color: '#28a745',
    fontSize: 12,
    marginTop: 4,
  },
  eliminatedText: {
    color: '#dc3545',
    fontSize: 12,
    marginTop: 4,
  },
  activeMatchFooter: {
    backgroundColor: '#fff3cd',
    padding: 12,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    alignItems: 'center',
  },
  activeMatchText: {
    color: '#856404',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyBracket: {
    padding: 40,
    alignItems: 'center',
  },
  emptyBracketText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
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

export default DoubleEliminationBracket;