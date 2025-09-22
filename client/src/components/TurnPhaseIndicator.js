import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

const TurnPhaseIndicator = ({
  phase,
  turnNumber,
  animated = true,
  style = {},
  playersReady = { player1: false, player2: false },
  timeRemaining = null,
  showPlayerStatus = true,
}) => {
  const [fadeAnimation] = useState(new Animated.Value(1));
  const [slideAnimation] = useState(new Animated.Value(0));

  useEffect(() => {
    if (animated) {
      // Fade out and slide, then fade back in with new content
      Animated.sequence([
        Animated.parallel([
          Animated.timing(fadeAnimation, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnimation, {
            toValue: -20,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(fadeAnimation, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnimation, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }
  }, [phase, turnNumber, animated, fadeAnimation, slideAnimation]);

  const getPhaseInfo = () => {
    switch (phase) {
      case 'selection':
        const readyCount = Object.values(playersReady).filter(Boolean).length;
        const totalPlayers = Object.keys(playersReady).length;
        return {
          emoji: '🎯',
          title: 'Card Selection',
          description: showPlayerStatus 
            ? `Choose 3 cards (${readyCount}/${totalPlayers} ready)`
            : 'Choose 3 cards for this turn',
          color: '#007AFF',
          backgroundColor: '#e3f2fd',
        };
      case 'resolution':
        return {
          emoji: '⚔️',
          title: 'Turn Resolution',
          description: 'Cards are being resolved...',
          color: '#ff8800',
          backgroundColor: '#fff3e0',
        };
      case 'ended':
        return {
          emoji: '🏁',
          title: 'Game Ended',
          description: 'The match has concluded',
          color: '#28a745',
          backgroundColor: '#e8f5e8',
        };
      case 'waiting':
        return {
          emoji: '⏳',
          title: 'Waiting',
          description: 'Waiting for opponent...',
          color: '#6c757d',
          backgroundColor: '#f8f9fa',
        };
      default:
        return {
          emoji: '❓',
          title: 'Unknown Phase',
          description: 'Game state unclear',
          color: '#6c757d',
          backgroundColor: '#f8f9fa',
        };
    }
  };

  const phaseInfo = getPhaseInfo();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: phaseInfo.backgroundColor,
          opacity: fadeAnimation,
          transform: [{ translateY: slideAnimation }],
        },
        style,
      ]}
    >
      <View style={styles.content}>
        <Text style={styles.emoji}>{phaseInfo.emoji}</Text>
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: phaseInfo.color }]}>
            Turn {turnNumber} - {phaseInfo.title}
          </Text>
          <Text style={styles.description}>{phaseInfo.description}</Text>
        </View>
      </View>
      
      {phase === 'selection' && (
        <View style={styles.selectionIndicator}>
          <Text style={styles.selectionText}>Select 3 cards</Text>
          {showPlayerStatus && (
            <View style={styles.playerStatusContainer}>
              {Object.entries(playersReady).map(([playerKey, ready]) => (
                <View key={playerKey} style={styles.playerStatus}>
                  <Text style={[styles.playerStatusText, { color: ready ? '#28a745' : '#6c757d' }]}>
                    {ready ? '✓' : '○'} {playerKey === 'player1' ? 'You' : 'Opponent'}
                  </Text>
                </View>
              ))}
            </View>
          )}
          {timeRemaining !== null && timeRemaining <= 10 && (
            <Text style={styles.urgentText}>
              {timeRemaining}s remaining!
            </Text>
          )}
        </View>
      )}
      
      {phase === 'resolution' && (
        <View style={styles.resolutionIndicator}>
          <View style={styles.loadingDots}>
            <Text style={styles.dot}>●</Text>
            <Text style={styles.dot}>●</Text>
            <Text style={styles.dot}>●</Text>
          </View>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  emoji: {
    fontSize: 24,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  description: {
    fontSize: 12,
    color: '#666',
  },
  selectionIndicator: {
    marginTop: 8,
    alignItems: 'center',
  },
  selectionText: {
    fontSize: 11,
    color: '#007AFF',
    fontWeight: '600',
    backgroundColor: 'white',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  resolutionIndicator: {
    marginTop: 8,
    alignItems: 'center',
  },
  loadingDots: {
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    fontSize: 16,
    color: '#ff8800',
    opacity: 0.7,
  },
  playerStatusContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 4,
  },
  playerStatus: {
    alignItems: 'center',
  },
  playerStatusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  urgentText: {
    fontSize: 10,
    color: '#ff4444',
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 4,
  },
});

export default TurnPhaseIndicator;