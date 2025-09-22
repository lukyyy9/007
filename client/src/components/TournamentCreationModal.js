import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { EmojiResource } from './index';

const TournamentCreationModal = ({ visible, onClose, onCreateTournament }) => {
  const [formData, setFormData] = useState({
    name: '',
    format: 'single-elimination',
    maxPlayers: 8,
    turnTimeLimit: 20,
    maxHealth: 6,
    bestOfSeries: 1,
  });

  const [errors, setErrors] = useState({});

  const formatOptions = [
    { value: 'single-elimination', label: 'Single Elimination', emoji: '🏆' },
    { value: 'double-elimination', label: 'Double Elimination', emoji: '🥇' },
  ];

  const playerCountOptions = [4, 8, 16, 32];
  const timerOptions = [10, 15, 20, 30, 45, 60];
  const healthOptions = [3, 6, 10, 15];
  const seriesOptions = [1, 3, 5];

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Tournament name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Tournament name must be at least 3 characters';
    } else if (formData.name.length > 100) {
      newErrors.name = 'Tournament name must be less than 100 characters';
    }

    if (!playerCountOptions.includes(formData.maxPlayers)) {
      newErrors.maxPlayers = 'Invalid player count';
    }

    if (!timerOptions.includes(formData.turnTimeLimit)) {
      newErrors.turnTimeLimit = 'Invalid timer setting';
    }

    if (!healthOptions.includes(formData.maxHealth)) {
      newErrors.maxHealth = 'Invalid health setting';
    }

    if (!seriesOptions.includes(formData.bestOfSeries)) {
      newErrors.bestOfSeries = 'Invalid series setting';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = () => {
    if (!validateForm()) {
      return;
    }

    const tournamentConfig = {
      name: formData.name.trim(),
      format: formData.format,
      maxPlayers: formData.maxPlayers,
      gameConfig: {
        turnTimeLimit: formData.turnTimeLimit,
        maxHealth: formData.maxHealth,
        bestOfSeries: formData.bestOfSeries,
      },
    };

    onCreateTournament(tournamentConfig);
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      name: '',
      format: 'single-elimination',
      maxPlayers: 8,
      turnTimeLimit: 20,
      maxHealth: 6,
      bestOfSeries: 1,
    });
    setErrors({});
    onClose();
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Create Tournament</Text>
          <TouchableOpacity onPress={handleCreate} style={styles.createButton}>
            <Text style={styles.createText}>Create</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Tournament Name */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tournament Details</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tournament Name</Text>
              <TextInput
                style={[styles.textInput, errors.name && styles.inputError]}
                value={formData.name}
                onChangeText={(value) => updateFormData('name', value)}
                placeholder="Enter tournament name"
                maxLength={100}
              />
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            </View>
          </View>

          {/* Tournament Format */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Format</Text>
            {formatOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionButton,
                  formData.format === option.value && styles.selectedOption
                ]}
                onPress={() => updateFormData('format', option.value)}
              >
                <Text style={styles.optionEmoji}>{option.emoji}</Text>
                <View style={styles.optionContent}>
                  <Text style={[
                    styles.optionLabel,
                    formData.format === option.value && styles.selectedOptionText
                  ]}>
                    {option.label}
                  </Text>
                  <Text style={[
                    styles.optionDescription,
                    formData.format === option.value && styles.selectedOptionText
                  ]}>
                    {option.value === 'single-elimination' 
                      ? 'One loss eliminates player'
                      : 'Players get a second chance'
                    }
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Player Count */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Max Players</Text>
            <View style={styles.optionGrid}>
              {playerCountOptions.map((count) => (
                <TouchableOpacity
                  key={count}
                  style={[
                    styles.gridOption,
                    formData.maxPlayers === count && styles.selectedGridOption
                  ]}
                  onPress={() => updateFormData('maxPlayers', count)}
                >
                  <Text style={[
                    styles.gridOptionText,
                    formData.maxPlayers === count && styles.selectedGridOptionText
                  ]}>
                    {count}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Game Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Game Settings</Text>
            
            {/* Turn Timer */}
            <View style={styles.settingGroup}>
              <Text style={styles.settingLabel}>
                ⏱️ Turn Timer: {formData.turnTimeLimit}s
              </Text>
              <View style={styles.optionGrid}>
                {timerOptions.map((seconds) => (
                  <TouchableOpacity
                    key={seconds}
                    style={[
                      styles.gridOption,
                      formData.turnTimeLimit === seconds && styles.selectedGridOption
                    ]}
                    onPress={() => updateFormData('turnTimeLimit', seconds)}
                  >
                    <Text style={[
                      styles.gridOptionText,
                      formData.turnTimeLimit === seconds && styles.selectedGridOptionText
                    ]}>
                      {seconds}s
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Health */}
            <View style={styles.settingGroup}>
              <Text style={styles.settingLabel}>
                <EmojiResource type="health" value={formData.maxHealth} /> Starting Health
              </Text>
              <View style={styles.optionGrid}>
                {healthOptions.map((health) => (
                  <TouchableOpacity
                    key={health}
                    style={[
                      styles.gridOption,
                      formData.maxHealth === health && styles.selectedGridOption
                    ]}
                    onPress={() => updateFormData('maxHealth', health)}
                  >
                    <Text style={[
                      styles.gridOptionText,
                      formData.maxHealth === health && styles.selectedGridOptionText
                    ]}>
                      {health}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Best of Series */}
            <View style={styles.settingGroup}>
              <Text style={styles.settingLabel}>
                🎯 Best of {formData.bestOfSeries}
              </Text>
              <View style={styles.optionGrid}>
                {seriesOptions.map((series) => (
                  <TouchableOpacity
                    key={series}
                    style={[
                      styles.gridOption,
                      formData.bestOfSeries === series && styles.selectedGridOption
                    ]}
                    onPress={() => updateFormData('bestOfSeries', series)}
                  >
                    <Text style={[
                      styles.gridOptionText,
                      formData.bestOfSeries === series && styles.selectedGridOptionText
                    ]}>
                      BO{series}
                    </Text>
                  </TouchableOpacity>
                ))}
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
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  cancelText: {
    color: '#007AFF',
    fontSize: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  createButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  createText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
  },
  inputError: {
    borderColor: '#ff4444',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 14,
    marginTop: 5,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  selectedOption: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  optionEmoji: {
    fontSize: 24,
    marginRight: 15,
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
  },
  selectedOptionText: {
    color: '#007AFF',
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  gridOption: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    minWidth: 60,
    alignItems: 'center',
  },
  selectedGridOption: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF',
  },
  gridOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  selectedGridOptionText: {
    color: 'white',
  },
  settingGroup: {
    marginBottom: 20,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 10,
  },
});

export default TournamentCreationModal;