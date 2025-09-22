import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const StatusEffectIndicator = ({ 
  effects = [], 
  size = 'medium',
  layout = 'horizontal',
  showDuration = true,
  style = {} 
}) => {
  const getEffectConfig = (effectType) => {
    switch (effectType) {
      case 'burn':
        return {
          emoji: '🔥',
          name: 'Burn',
          color: '#fd7e14',
          backgroundColor: '#fff3cd',
          borderColor: '#ffeaa7'
        };
      case 'shield':
        return {
          emoji: '🛡️',
          name: 'Shield',
          color: '#6c757d',
          backgroundColor: '#e2e3e5',
          borderColor: '#d6d8db'
        };
      case 'vulnerable':
        return {
          emoji: '💔',
          name: 'Vulnerable',
          color: '#dc3545',
          backgroundColor: '#f8d7da',
          borderColor: '#f5c6cb'
        };
      case 'charged':
        return {
          emoji: '⚡',
          name: 'Charged',
          color: '#007AFF',
          backgroundColor: '#cce5ff',
          borderColor: '#99d6ff'
        };
      case 'regeneration':
        return {
          emoji: '💚',
          name: 'Regen',
          color: '#28a745',
          backgroundColor: '#d4edda',
          borderColor: '#c3e6cb'
        };
      case 'poison':
        return {
          emoji: '☠️',
          name: 'Poison',
          color: '#6f42c1',
          backgroundColor: '#e2d9f3',
          borderColor: '#d1c4e9'
        };
      case 'frozen':
        return {
          emoji: '🧊',
          name: 'Frozen',
          color: '#17a2b8',
          backgroundColor: '#d1ecf1',
          borderColor: '#bee5eb'
        };
      case 'stunned':
        return {
          emoji: '💫',
          name: 'Stunned',
          color: '#ffc107',
          backgroundColor: '#fff3cd',
          borderColor: '#ffeaa7'
        };
      default:
        return {
          emoji: '❓',
          name: 'Unknown',
          color: '#6c757d',
          backgroundColor: '#f8f9fa',
          borderColor: '#dee2e6'
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: styles.containerSmall,
          emoji: styles.emojiSmall,
          duration: styles.durationSmall,
          name: styles.nameSmall,
        };
      case 'large':
        return {
          container: styles.containerLarge,
          emoji: styles.emojiLarge,
          duration: styles.durationLarge,
          name: styles.nameLarge,
        };
      default: // medium
        return {
          container: styles.containerMedium,
          emoji: styles.emojiMedium,
          duration: styles.durationMedium,
          name: styles.nameMedium,
        };
    }
  };

  if (!effects || effects.length === 0) {
    return null;
  }

  const sizeStyles = getSizeStyles();
  const containerStyle = layout === 'vertical' ? styles.verticalLayout : styles.horizontalLayout;

  return (
    <View style={[containerStyle, style]}>
      {effects.map((effect, index) => {
        const config = getEffectConfig(effect.type);
        
        return (
          <View
            key={`${effect.type}-${index}`}
            style={[
              sizeStyles.container,
              {
                backgroundColor: config.backgroundColor,
                borderColor: config.borderColor,
              }
            ]}
          >
            <Text style={sizeStyles.emoji}>{config.emoji}</Text>
            {showDuration && effect.duration !== undefined && (
              <Text style={[sizeStyles.duration, { color: config.color }]}>
                {effect.duration}
              </Text>
            )}
            {size === 'large' && (
              <Text style={[sizeStyles.name, { color: config.color }]}>
                {config.name}
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  horizontalLayout: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  verticalLayout: {
    flexDirection: 'column',
    gap: 4,
  },
  // Small size styles
  containerSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    gap: 2,
  },
  emojiSmall: {
    fontSize: 10,
  },
  durationSmall: {
    fontSize: 8,
    fontWeight: 'bold',
  },
  nameSmall: {
    fontSize: 8,
    fontWeight: '500',
  },
  // Medium size styles
  containerMedium: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    gap: 3,
  },
  emojiMedium: {
    fontSize: 12,
  },
  durationMedium: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  nameMedium: {
    fontSize: 10,
    fontWeight: '500',
  },
  // Large size styles
  containerLarge: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    gap: 2,
    minWidth: 50,
  },
  emojiLarge: {
    fontSize: 16,
  },
  durationLarge: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  nameLarge: {
    fontSize: 9,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default StatusEffectIndicator;