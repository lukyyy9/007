import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';

const SeriesProgressDisplay = ({ seriesStatus, playerNames = ['Player 1', 'Player 2'] }) => {
  if (!seriesStatus || seriesStatus.bestOfSeries === 1) {
    return null; // Don't show for single games
  }

  const { 
    bestOfSeries, 
    winsNeeded, 
    player1Wins, 
    player2Wins, 
    currentGameNumber, 
    isComplete,
    winner,
    summary 
  } = seriesStatus;

  const renderGameDots = (playerWins, isWinner) => {
    const dots = [];
    
    // Add won games (filled dots)
    for (let i = 0; i < playerWins; i++) {
      dots.push(
        <View 
          key={`won-${i}`} 
          style={[
            styles.gameDot, 
            styles.wonDot,
            isWinner && styles.winnerDot
          ]} 
        />
      );
    }
    
    // Add remaining needed games (empty dots)
    const remainingNeeded = winsNeeded - playerWins;
    for (let i = 0; i < remainingNeeded; i++) {
      dots.push(
        <View 
          key={`remaining-${i}`} 
          style={[styles.gameDot, styles.emptyDot]} 
        />
      );
    }
    
    return dots;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Series Progress</Text>
      <Text style={styles.summary}>{summary}</Text>
      
      <View style={styles.progressContainer}>
        {/* Player 1 Progress */}
        <View style={styles.playerProgress}>
          <Text style={[
            styles.playerName,
            winner === 'player1' && styles.winnerName
          ]}>
            {playerNames[0]}
          </Text>
          <View style={styles.dotsContainer}>
            {renderGameDots(player1Wins, winner === 'player1')}
          </View>
          <Text style={[
            styles.scoreText,
            winner === 'player1' && styles.winnerScore
          ]}>
            {player1Wins}
          </Text>
        </View>

        {/* VS Separator */}
        <View style={styles.separator}>
          <Text style={styles.vsText}>VS</Text>
          <Text style={styles.gameInfo}>
            {isComplete ? 'Final' : `Game ${currentGameNumber}`}
          </Text>
        </View>

        {/* Player 2 Progress */}
        <View style={styles.playerProgress}>
          <Text style={[
            styles.playerName,
            winner === 'player2' && styles.winnerName
          ]}>
            {playerNames[1]}
          </Text>
          <View style={styles.dotsContainer}>
            {renderGameDots(player2Wins, winner === 'player2')}
          </View>
          <Text style={[
            styles.scoreText,
            winner === 'player2' && styles.winnerScore
          ]}>
            {player2Wins}
          </Text>
        </View>
      </View>

      {/* Series Info */}
      <View style={styles.seriesInfo}>
        <Text style={styles.seriesText}>
          Best of {bestOfSeries} • First to {winsNeeded} wins
        </Text>
        {!isComplete && (
          <Text style={styles.remainingText}>
            {Math.max(0, winsNeeded - Math.max(player1Wins, player2Wins))} more wins needed
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  summary: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  playerProgress: {
    flex: 1,
    alignItems: 'center',
  },
  playerName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  winnerName: {
    color: '#28a745',
    fontWeight: '700',
  },
  dotsContainer: {
    flexDirection: 'row',
    marginBottom: 8,
    justifyContent: 'center',
  },
  gameDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginHorizontal: 2,
    borderWidth: 2,
  },
  wonDot: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  winnerDot: {
    backgroundColor: '#28a745',
    borderColor: '#28a745',
  },
  emptyDot: {
    backgroundColor: 'transparent',
    borderColor: '#ddd',
  },
  scoreText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  winnerScore: {
    color: '#28a745',
  },
  separator: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  vsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  gameInfo: {
    fontSize: 10,
    color: '#999',
  },
  seriesInfo: {
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  seriesText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  remainingText: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
  },
});

export default SeriesProgressDisplay;