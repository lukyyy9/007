import React, { useRef, useEffect } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';

const CardEffectAnimation = ({ 
  effect, 
  isVisible = false, 
  onComplete,
  style = {} 
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const translateYAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    if (isVisible && effect) {
      startAnimation();
    }
  }, [isVisible, effect]);

  const startAnimation = () => {
    // Reset animation values
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.5);
    translateYAnim.setValue(50);

    const animationSequence = Animated.sequence([
      // Fade in and scale up
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateYAnim, {
          toValue: -20,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
      // Hold for a moment
      Animated.delay(500),
      // Fade out and move up
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(translateYAnim, {
          toValue: -80,
          duration: 400,
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

  const getEffectConfig = (effectType) => {
    switch (effectType) {
      case 'damage':
        return {
          emoji: '💥',
          text: 'DAMAGE',
          color: '#ff4444',
          backgroundColor: 'rgba(255, 68, 68, 0.1)',
        };
      case 'heal':
        return {
          emoji: '💚',
          text: 'HEAL',
          color: '#28a745',
          backgroundColor: 'rgba(40, 167, 69, 0.1)',
        };
      case 'charge':
        return {
          emoji: '⚡',
          text: 'CHARGE',
          color: '#007AFF',
          backgroundColor: 'rgba(0, 122, 255, 0.1)',
        };
      case 'block':
        return {
          emoji: '🛡️',
          text: 'BLOCKED',
          color: '#6c757d',
          backgroundColor: 'rgba(108, 117, 125, 0.1)',
        };
      case 'burn':
        return {
          emoji: '🔥',
          text: 'BURN',
          color: '#fd7e14',
          backgroundColor: 'rgba(253, 126, 20, 0.1)',
        };
      case 'shield':
        return {
          emoji: '🛡️',
          text: 'SHIELD',
          color: '#6c757d',
          backgroundColor: 'rgba(108, 117, 125, 0.1)',
        };
      case 'stun':
        return {
          emoji: '💫',
          text: 'STUNNED',
          color: '#ffc107',
          backgroundColor: 'rgba(255, 193, 7, 0.1)',
        };
      default:
        return {
          emoji: '✨',
          text: 'EFFECT',
          color: '#6f42c1',
          backgroundColor: 'rgba(111, 66, 193, 0.1)',
        };
    }
  };

  if (!isVisible || !effect) {
    return null;
  }

  const config = getEffectConfig(effect.type);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [
            { scale: scaleAnim },
            { translateY: translateYAnim },
          ],
          backgroundColor: config.backgroundColor,
        },
        style,
      ]}
    >
      <Text style={[styles.emoji, { color: config.color }]}>
        {config.emoji}
      </Text>
      <Text style={[styles.text, { color: config.color }]}>
        {config.text}
      </Text>
      {effect.value && (
        <Text style={[styles.value, { color: config.color }]}>
          {effect.value > 0 ? `+${effect.value}` : effect.value}
        </Text>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -50 }, { translateY: -25 }],
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
  emoji: {
    fontSize: 24,
    marginBottom: 2,
  },
  text: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  value: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 2,
  },
});

export default CardEffectAnimation;