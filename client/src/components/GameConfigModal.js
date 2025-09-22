import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';

const GameConfigModal = ({ visible, onClose, onConfirm, initialConfig = {} }) => {
  const [config, setConfig] = useState({
    bestOfSeries: initialConfig.bestOfSeries || 1,
    turnTimeLimit: initialConfig.turnTimeLimit || 20,
    maxHealth: initialConfig.maxHealth || 6,
    gameMode: initialConfig.gameMode || 'standard',
    ...initialConfig
  });

  const seriesOptions = [
    { value: 1, label: 'Quick Match (1 game)', description: 'Single game, winner takes all' },
    { value: 3, label: 'Best of 3', description: 'First to win 2 games' },
    { value: 5, label: 'Best of 5', description: 'First to win 3 games' },
    { value: 7, label: 'Best of 7', description: 'First to win 4 games' },
  ];

  const timerOptions = [
    { value: 10, label: '10 seconds', description: 'Fast-paced action' },
    { value: 15, label: '15 seconds', description: 'Quick decisions' },
    { value: 20, label: '20 seconds', description: 'Standard timing' },
    { value: 30, label: '30 seconds', description: 'More time to think' },
    { value: 45, label: '45 seconds', description: 'Relaxed pace' },
    { value: 60, label: '60 seconds', description: 'Maximum thinking time' },
  ];

  const healthOptions = [
    { value: 3, label: '3 Health', description: 'Quick matches' },
    { value: 6, label: '6 Health', description: 'Standard game' },
    { value: 10, label: '10 Health', description: 'Extended matches' },
    { value: 15, label: '15 Health', description: 'Long strategic games' },
  ];

  const gameModeOptions = [
    { value: 'standard', label: 'Standard', description: 'Classic tactical card game' },
    { value: 'blitz', label: 'Blitz', description: 'Faster gameplay with reduced timers' },
    { value: 'endurance', label: 'Endurance', description: 'Higher health, longer matches' },
  ];

  const handleConfirm = () => {
    // Validate configuration
    if (config.bestOfSeries < 1 || config.bestOfSeries > 7) {
      Alert.alert('Invalid Configuration', 'Series length must be between 1 and 7 games.');
      return;
    }

    if (config.turnTimeLimit < 5 || config.turnTimeLimit > 120) {
      Alert.alert('Invalid Configuration', 'Turn timer must be between 5 and 120 seconds.');
      return;
    }

    if (config.maxHealth < 1 || config.maxHealth > 50) {
      Alert.alert('Invalid Configuration', 'Health must be between 1 and 50.');
      return;
    }

    // Apply game mode modifiers
    const finalConfig = applyGameModeModifiers(config);
    
    onConfirm(finalConfig);
    onClose();
  };

  const applyGameModeModifiers = (baseConfig) => {
    const modifiedConfig = { ...baseConfig };

    switch (baseConfig.gameMode) {
      case 'blitz':
        // Reduce timer by 25% for blitz mode
        modifiedConfig.turnTimeLimit = Math.max(5, Math.floor(baseConfig.turnTimeLimit * 0.75));
        break;
      case 'endurance':
        // Increase health by 50% for endurance mode
        modifiedConfig.maxHealth = Math.floor(baseConfig.maxHealth * 1.5);
        break;
      case 'standard':
      default:
        // No modifications for standard mode
        break;
    }

    return modifiedConfig;
  };

  const renderOptionSelector = (title, options, currentValue, onSelect, keyPrefix) => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsScroll}>
        {options.map((option) => (
          <TouchableOpacity
            key={`${keyPrefix}-${option.value}`}
            style={[
              styles.optionCard,
              currentValue === option.value && styles.optionCardSelected
            ]}
            onPress={() => onSelect(option.value)}
          >
            <Text style={[
              styles.optionLabel,
              currentValue === option.value && styles.optionLabelSelected
            ]}>
              {option.label}
            </Text>
            <Text style={[
              styles.optionDescription,
              currentValue === option.value && styles.optionDescriptionSelected
            ]}>
              {option.description}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Game Configuration</Text>
          <TouchableOpacity onPress={handleConfirm} style={styles.confirmButton}>
            <Text style={styles.confirmButtonText}>Create</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {renderOptionSelector(
            'Game Mode',
            gameModeOptions,
            config.gameMode,
            (value) => setConfig(prev => ({ ...prev, gameMode: value })),
            'mode'
          )}

          {renderOptionSelector(
            'Series Length',
            seriesOptions,
            config.bestOfSeries,
            (value) => setConfig(prev => ({ ...prev, bestOfSeries: value })),
            'series'
          )}

          {renderOptionSelector(
            'Turn Timer',
            timerOptions,
            config.turnTimeLimit,
            (value) => setConfig(prev => ({ ...prev, turnTimeLimit: value })),
            'timer'
          )}

          {renderOptionSelector(
            'Starting Health',
            healthOptions,
            config.maxHealth,
            (value) => setConfig(prev => ({ ...prev, maxHealth: value })),
            'health'
          )}

          <View style={styles.summaryContainer}>
            <Text style={styles.summaryTitle}>Configuration Summary</Text>
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Mode:</Text>
                <Text style={styles.summaryValue}>
                  {gameModeOptions.find(opt => opt.value === config.gameMode)?.label}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Series:</Text>
                <Text style={styles.summaryValue}>
                  {config.bestOfSeries === 1 ? 'Single Game' : `Best of ${config.bestOfSeries}`}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Timer:</Text>
                <Text style={styles.summaryValue}>
                  {applyGameModeModifiers(config).turnTimeLimit}s per turn
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Health:</Text>
                <Text style={styles.summaryValue}>
                  {applyGameModeModifiers(config).maxHealth} ❤️ starting health
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  cancelButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
  confirmButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
    borderRadius: 6,
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionContainer: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  optionsScroll: {
    flexDirection: 'row',
  },
  optionCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginRight: 15,
    minWidth: 140,
    borderWidth: 2,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  optionCardSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  optionLabelSelected: {
    color: '#007AFF',
  },
  optionDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  optionDescriptionSelected: {
    color: '#0056b3',
  },
  summaryContainer: {
    marginTop: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#333',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
});

export default GameConfigModal;