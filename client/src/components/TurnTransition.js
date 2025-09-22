import React, { useRef, useEffect } from 'react';
import { View, Text, Animated, StyleSheet, Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const TurnTransition = ({ 
  isVisible = false, 
  turnNumber, 
  phase,
  onComplete,
  style = {} 
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const slideAnim = useRef(new Animated.Value(-screenWidth)).current;

  useEffect(() => {
    if (isVisible) {
      startTransitionAnimation();
    }
  }, [isVisible]);

  const startTransitionAnimation = () => {
    // Reset animation values
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.3);
    slideAnim.setValue(-screenWidth);

    const animationSequence = Animated.sequence([
      // Slide in and fade in
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      // Hold for display
      Animated.delay(1500),
      // Slide out and fade out
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: screenWidth,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.3,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ]);

    animationSequence.start((finished) => {
      if (finished && onComplete) {
        onComplete();
      }
    });
  };

  const getPhaseConfig = (phaseType) => {
    switch (phaseType) {
      case 'selection':
        return {
          title: 'CARD SELECTION',
          subtitle: 'Choose your cards wisely',
          emoji: '🎯',
          color: '#007AFF',
          backgroundColor: 'rgba(0, 122, 255, 0.9)',
        };
      case 'resolution':
        return {
          title: 'TURN RESOLUTION',
          subtitle: 'Cards are being resolved',
          emoji: '⚔️',
          color: '#ff4444',
          backgroundColor: 'rgba(255, 68, 68, 0.9)',
        };
      case 'ended':
        return {
          title: 'GAME OVER',
          subtitle: 'The battle has ended',
          emoji: '🏆',
          color: '#28a745',
          backgroundColor: 'rgba(40, 167, 69, 0.9)',
        };
      default:
        return {
          title: 'TURN TRANSITION',
          subtitle: 'Preparing next phase',
          emoji: '🔄',
          color: '#6c757d',
          backgroundColor: 'rgba(108, 117, 125, 0.9)',
        };
    }
  };

  if (!isVisible) {
    return null;
  }

  const config = getPhaseConfig(phase);

  return (
    <Animated.View
      style={[
        styles.overlay,
        {
          opacity: fadeAnim,
          backgroundColor: config.backgroundColor,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.container,
          {
            transform: [
              { translateX: slideAnim },
              { scale: scaleAnim },
            ],
          },
        ]}
      >
        <Text style={[styles.emoji, { color: config.color }]}>
          {config.emoji}
        </Text>
        
        {turnNumber && (
          <Text style={styles.turnNumber}>
            TURN {turnNumber}
          </Text>
        )}
        
        <Text style={styles.title}>
          {config.title}
        </Text>
        
        <Text style={styles.subtitle}>
          {config.subtitle}
        </Text>
        
        <View style={styles.decorativeLine} />
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    minWidth: 250,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 10,
  },
  turnNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
    letterSpacing: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 15,
    fontStyle: 'italic',
  },
  decorativeLine: {
    width: 60,
    height: 3,
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
});

export default TurnTransition;