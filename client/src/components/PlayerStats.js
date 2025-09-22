import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import EmojiResource from './EmojiResource';
import StatusEffectIndicator from './StatusEffectIndicator';

const PlayerStats = ({ 
  player, 
  isCurrentPlayer = false, 
  size = 'medium',
  showStatusEffects = true,
  style = {},
  animateChanges = true
}) => {
  const getPlayerBorderColor = () => {
    if (isCurrentPlayer) return '#007AFF';
    return '#ff4444';
  };



  return (
    <View style={[
      styles.container,
      { borderLeftColor: getPlayerBorderColor() },
      style
    ]}>
      <Text style={styles.playerName}>{player.username}</Text>
      
      <View style={styles.statsRow}>
        <EmojiResource
          type="health"
          value={player.health}
          size={size}
          showLabel={false}
          animated={animateChanges && player.health <= 2}
          animationType="shake"
        />
        <EmojiResource
          type="charges"
          value={player.charges}
          size={size}
          showLabel={false}
          animated={animateChanges && player.charges > 0}
          animationType="glow"
        />
      </View>

      {showStatusEffects && player.statusEffects && player.statusEffects.length > 0 && (
        <View style={styles.statusEffectsContainer}>
          <Text style={styles.statusEffectsTitle}>Effects:</Text>
          <StatusEffectIndicator
            effects={player.statusEffects}
            size="small"
            layout="horizontal"
            showDuration={true}
          />
        </View>
      )}

      {isCurrentPlayer && (
        <View style={styles.currentPlayerIndicator}>
          <Text style={styles.currentPlayerText}>You</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    position: 'relative',
  },
  playerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusEffectsContainer: {
    marginTop: 8,
  },
  statusEffectsTitle: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
    fontWeight: '500',
  },
  currentPlayerIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  currentPlayerText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default PlayerStats;