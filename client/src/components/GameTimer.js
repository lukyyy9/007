import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

const GameTimer = ({
  timeRemaining,
  totalTime = 20,
  onTimeExpired,
  isActive = true,
  size = 'medium',
  showProgress = true,
  style = {},
  serverTime = null, // Server timestamp for synchronization
  autoSelectOnExpiry = true,
}) => {
  const [animatedValue] = useState(new Animated.Value(1));
  const [pulseAnimation] = useState(new Animated.Value(1));
  const [localTimeRemaining, setLocalTimeRemaining] = useState(timeRemaining);
  const intervalRef = useRef(null);
  const hasExpiredRef = useRef(false);

  // Synchronize with server time if provided
  useEffect(() => {
    if (serverTime && isActive) {
      const now = Date.now();
      const serverTimeRemaining = Math.max(0, Math.floor((serverTime - now) / 1000));
      setLocalTimeRemaining(serverTimeRemaining);
      hasExpiredRef.current = false;
    } else {
      setLocalTimeRemaining(timeRemaining);
    }
  }, [serverTime, timeRemaining, isActive]);

  // Local countdown timer
  useEffect(() => {
    if (!isActive) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setLocalTimeRemaining(prev => {
        const newTime = Math.max(0, prev - 1);
        
        // Handle expiration
        if (newTime === 0 && !hasExpiredRef.current && autoSelectOnExpiry) {
          hasExpiredRef.current = true;
          setTimeout(() => {
            onTimeExpired?.();
          }, 100); // Small delay to ensure UI updates
        }
        
        return newTime;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isActive, onTimeExpired, autoSelectOnExpiry]);

  // Animation effects
  useEffect(() => {
    const currentTime = localTimeRemaining;

    // Progress animation
    if (showProgress) {
      Animated.timing(animatedValue, {
        toValue: currentTime / totalTime,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }

    // Pulse animation for low time warning
    if (currentTime <= 5 && currentTime > 0 && isActive) {
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.2,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      pulseAnimation.setValue(1);
    }
  }, [localTimeRemaining, totalTime, isActive, animatedValue, pulseAnimation, showProgress]);

  const getTimerColor = () => {
    if (timeRemaining <= 5) return '#ff4444';
    if (timeRemaining <= 10) return '#ff8800';
    return '#28a745';
  };

  const getTimerSize = () => {
    switch (size) {
      case 'small':
        return {
          container: styles.smallContainer,
          text: styles.smallText,
          emoji: styles.smallEmoji,
        };
      case 'large':
        return {
          container: styles.largeContainer,
          text: styles.largeText,
          emoji: styles.largeEmoji,
        };
      default: // medium
        return {
          container: styles.mediumContainer,
          text: styles.mediumText,
          emoji: styles.mediumEmoji,
        };
    }
  };

  const sizeStyles = getTimerSize();
  const timerColor = getTimerColor();

  const progressWidth = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.container, sizeStyles.container, style]}>
      {showProgress && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBackground} />
          <Animated.View
            style={[
              styles.progressBar,
              {
                width: progressWidth,
                backgroundColor: timerColor,
              },
            ]}
          />
        </View>
      )}
      
      <Animated.View
        style={[
          styles.timerContent,
          {
            transform: [{ scale: pulseAnimation }],
          },
        ]}
      >
        <Text style={[sizeStyles.emoji]}>⏱️</Text>
        <Text
          style={[
            sizeStyles.text,
            {
              color: timerColor,
            },
          ]}
        >
          {localTimeRemaining}s
        </Text>
      </Animated.View>

      {localTimeRemaining <= 5 && localTimeRemaining > 0 && (
        <Text style={styles.warningText}>Hurry up!</Text>
      )}

      {localTimeRemaining <= 0 && (
        <Text style={styles.expiredText}>
          {autoSelectOnExpiry ? 'Auto-selecting...' : 'Time\'s up!'}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    width: '100%',
    height: 4,
    marginBottom: 8,
    position: 'relative',
  },
  progressBackground: {
    width: '100%',
    height: '100%',
    backgroundColor: '#e9ecef',
    borderRadius: 2,
  },
  progressBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    borderRadius: 2,
  },
  timerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  warningText: {
    fontSize: 10,
    color: '#ff4444',
    fontWeight: '600',
    marginTop: 4,
  },
  expiredText: {
    fontSize: 10,
    color: '#ff4444',
    fontWeight: 'bold',
    marginTop: 4,
  },
  
  // Small size
  smallContainer: {
    minWidth: 60,
  },
  smallText: {
    fontSize: 12,
    fontWeight: '600',
  },
  smallEmoji: {
    fontSize: 14,
  },
  
  // Medium size
  mediumContainer: {
    minWidth: 80,
  },
  mediumText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  mediumEmoji: {
    fontSize: 18,
  },
  
  // Large size
  largeContainer: {
    minWidth: 100,
  },
  largeText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  largeEmoji: {
    fontSize: 24,
  },
});

export default GameTimer;