import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

const EmojiResource = ({
  type,
  value,
  maxValue = null,
  size = 'medium',
  showLabel = true,
  style = {},
  animated = false,
  animationType = 'pulse' // 'pulse' | 'bounce' | 'shake' | 'glow'
}) => {
  const animationValue = useRef(new Animated.Value(1)).current;
  const glowValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      startAnimation();
    } else {
      // Reset to default state
      animationValue.setValue(1);
      glowValue.setValue(0);
    }
  }, [animated, animationType]);

  const startAnimation = () => {
    switch (animationType) {
      case 'pulse':
        startPulseAnimation();
        break;
      case 'bounce':
        startBounceAnimation();
        break;
      case 'shake':
        startShakeAnimation();
        break;
      case 'glow':
        startGlowAnimation();
        break;
      default:
        startPulseAnimation();
    }
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animationValue, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(animationValue, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const startBounceAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animationValue, {
          toValue: 1.3,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(animationValue, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(1000),
      ])
    ).start();
  };

  const startShakeAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animationValue, {
          toValue: 1.1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(animationValue, {
          toValue: 0.9,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(animationValue, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.delay(1500),
      ])
    ).start();
  };

  const startGlowAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false, // Can't use native driver for shadow properties
        }),
        Animated.timing(glowValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ])
    ).start();
  };
  const getEmoji = () => {
    switch (type) {
      case 'health':
        return '❤️';
      case 'charges':
        return '⚡';
      case 'shield':
        return '🛡️';
      case 'burn':
        return '🔥';
      case 'timer':
        return '⏱️';
      default:
        return '❓';
    }
  };

  const getLabel = () => {
    switch (type) {
      case 'health':
        return 'Health';
      case 'charges':
        return 'Charges';
      case 'shield':
        return 'Shield';
      case 'burn':
        return 'Burn';
      case 'timer':
        return 'Time';
      default:
        return 'Unknown';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          emoji: styles.emojiSmall,
          value: styles.valueSmall,
          label: styles.labelSmall,
        };
      case 'large':
        return {
          emoji: styles.emojiLarge,
          value: styles.valueLarge,
          label: styles.labelLarge,
        };
      default: // medium
        return {
          emoji: styles.emojiMedium,
          value: styles.valueMedium,
          label: styles.labelMedium,
        };
    }
  };

  const getValueColor = () => {
    switch (type) {
      case 'health':
        if (value <= 2) return '#ff4444';
        if (value <= 4) return '#ff8800';
        return '#28a745';
      case 'charges':
        return '#007AFF';
      case 'timer':
        if (value <= 5) return '#ff4444';
        if (value <= 10) return '#ff8800';
        return '#28a745';
      default:
        return '#333';
    }
  };

  const sizeStyles = getSizeStyles();
  const valueColor = getValueColor();

  const animatedEmojiStyle = animated ? {
    transform: [{ scale: animationValue }],
    shadowOpacity: animationType === 'glow' ? glowValue : 0,
    shadowRadius: animationType === 'glow' ? 10 : 0,
    shadowColor: valueColor,
  } : {};

  return (
    <View style={[styles.container, style]}>
      <View style={styles.resourceRow}>
        <Animated.Text style={[
          sizeStyles.emoji, 
          animatedEmojiStyle,
          animated && styles.animated
        ]}>
          {getEmoji()}
        </Animated.Text>
        <Text style={[sizeStyles.value, { color: valueColor }]}>
          {maxValue !== null ? `${value}/${maxValue}` : value}
        </Text>
      </View>
      {showLabel && (
        <Text style={sizeStyles.label}>{getLabel()}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  resourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  // Small size styles
  emojiSmall: {
    fontSize: 14,
  },
  valueSmall: {
    fontSize: 12,
    fontWeight: '600',
  },
  labelSmall: {
    fontSize: 9,
    color: '#666',
    marginTop: 2,
  },
  // Medium size styles
  emojiMedium: {
    fontSize: 18,
  },
  valueMedium: {
    fontSize: 16,
    fontWeight: '600',
  },
  labelMedium: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  // Large size styles
  emojiLarge: {
    fontSize: 24,
  },
  valueLarge: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  labelLarge: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  animated: {
    // Animation styles can be added here for future enhancements
  },
});

export default EmojiResource;