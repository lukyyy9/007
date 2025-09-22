import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
} from 'react-native';

const SeriesTransition = ({ 
  visible, 
  gameResult, 
  seriesStatus, 
  playerNames = ['Player 1', 'Player 2'],
  onContinue,
  onClose 
}) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
    }
  }, [visible]);

  if (!visible || !gameResult || !seriesStatus) {
    return null;
  }

  const { winner, reason } = gameResult;
  const { 
    isComplete, 
    winner: seriesWinner, 
    player1Wins, 
    player2Wins, 
    currentGameNumber,
    winsNeeded,
    bestOfSeries
  } = seriesStatus;

  const winnerName = winner ? playerNames[winner === 'player1' ? 0 : 1] : 'No one';
  const seriesWinnerName = seriesWinner ? playerNames[seriesWinner === 'player1' ? 0 : 1] : null;

  const getResultMessage = () => {
    switch (reason) {
      case 'health_depleted':
        return `${winnerName} wins by reducing opponent's health to 0!`;
      case 'forfeit':
        return `${winnerName} wins by forfeit!`;
      case 'timeout':
        return `${winnerName} wins by timeout!`;
      default:
        return `${winnerName} wins!`;
    }
  };

  const getSeriesMessage = () => {
    if (isComplete) {
      return `🏆 ${seriesWinnerName} wins the series ${player1Wins}-${player2Wins}!`;
    } else {
      const leadingPlayer = player1Wins > player2Wins ? playerNames[0] : 
                           player2Wins > player1Wins ? playerNames[1] : null;
      
      if (leadingPlayer) {
        const leadAmount = Math.abs(player1Wins - player2Wins);
        return `${leadingPlayer} leads the series ${Math.max(player1Wins, player2Wins)}-${Math.min(player1Wins, player2Wins)}`;
      } else {
        return `Series tied ${player1Wins}-${player2Wins}`;
      }
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View 
          style={[
            styles.container,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          {/* Game Result */}
          <View style={styles.resultSection}>
            <Text style={styles.gameTitle}>Game {currentGameNumber - 1} Result</Text>
            <Text style={styles.resultText}>{getResultMessage()}</Text>
          </View>

          {/* Series Progress */}
          <View style={styles.seriesSection}>
            <Text style={styles.seriesTitle}>Series Progress</Text>
            <Text style={styles.seriesMessage}>{getSeriesMessage()}</Text>
            
            <View style={styles.scoreContainer}>
              <View style={styles.playerScore}>
                <Text style={[
                  styles.playerName,
                  seriesWinner === 'player1' && styles.winnerName
                ]}>
                  {playerNames[0]}
                </Text>
                <Text style={[
                  styles.scoreNumber,
                  seriesWinner === 'player1' && styles.winnerScore
                ]}>
                  {player1Wins}
                </Text>
              </View>
              
              <Text style={styles.scoreSeparator}>-</Text>
              
              <View style={styles.playerScore}>
                <Text style={[
                  styles.playerName,
                  seriesWinner === 'player2' && styles.winnerName
                ]}>
                  {playerNames[1]}
                </Text>
                <Text style={[
                  styles.scoreNumber,
                  seriesWinner === 'player2' && styles.winnerScore
                ]}>
                  {player2Wins}
                </Text>
              </View>
            </View>

            <Text style={styles.seriesInfo}>
              Best of {bestOfSeries} • First to {winsNeeded} wins
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            {isComplete ? (
              <TouchableOpacity style={styles.finishButton} onPress={onClose}>
                <Text style={styles.finishButtonText}>View Final Results</Text>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity style={styles.continueButton} onPress={onContinue}>
                  <Text style={styles.continueButtonText}>
                    Continue to Game {currentGameNumber}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                  <Text style={styles.closeButtonText}>View Series Stats</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  resultSection: {
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  gameTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  resultText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
  },
  seriesSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  seriesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  seriesMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  playerScore: {
    alignItems: 'center',
    minWidth: 80,
  },
  playerName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  winnerName: {
    color: '#28a745',
    fontWeight: '700',
  },
  scoreNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: '#333',
  },
  winnerScore: {
    color: '#28a745',
  },
  scoreSeparator: {
    fontSize: 24,
    fontWeight: '300',
    color: '#999',
    marginHorizontal: 20,
  },
  seriesInfo: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  buttonContainer: {
    gap: 12,
  },
  continueButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  finishButton: {
    backgroundColor: '#28a745',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  finishButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  closeButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default SeriesTransition;