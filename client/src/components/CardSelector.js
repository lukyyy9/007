import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';

const CardSelector = ({
  availableCards,
  selectedCards,
  onCardSelect,
  onCardDeselect,
  playerCharges,
  gamePhase,
  maxSelection = 3,
}) => {
  const handleCardSelect = (card) => {
    if (selectedCards.length >= maxSelection) {
      Alert.alert('Maximum Cards', `You can only select ${maxSelection} cards per turn.`);
      return;
    }

    if (card.cost > playerCharges) {
      Alert.alert(
        'Not Enough Charges', 
        `This card requires ${card.cost} charges. You have ${playerCharges}.`
      );
      return;
    }

    onCardSelect(card);
  };

  const canSelectCard = (card) => {
    return gamePhase === 'selection' && 
           selectedCards.length < maxSelection && 
           card.cost <= playerCharges &&
           !selectedCards.some(selected => selected.id === card.id);
  };

  const isCardSelected = (card) => {
    return selectedCards.some(selected => selected.id === card.id);
  };

  return (
    <View style={styles.container}>
      {/* Selected Cards Display */}
      {selectedCards.length > 0 && (
        <View style={styles.selectedCardsContainer}>
          <Text style={styles.selectedTitle}>
            Selected Cards ({selectedCards.length}/{maxSelection}):
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {selectedCards.map((card, index) => (
              <TouchableOpacity
                key={`selected-${index}`}
                style={styles.selectedCard}
                onPress={() => onCardDeselect(index)}
                activeOpacity={0.7}
              >
                <Text style={styles.selectedCardEmoji}>{card.emoji}</Text>
                <Text style={styles.selectedCardName}>{card.name}</Text>
                <Text style={styles.selectedCardCost}>⚡ {card.cost}</Text>
                <Text style={styles.removeText}>✕ Remove</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Available Cards Grid */}
      <ScrollView style={styles.cardsContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.cardsTitle}>Available Cards:</Text>
        <View style={styles.cardsGrid}>
          {availableCards.map((card) => {
            const canSelect = canSelectCard(card);
            const isSelected = isCardSelected(card);
            
            return (
              <TouchableOpacity
                key={card.id}
                style={[
                  styles.card,
                  !canSelect && styles.cardDisabled,
                  isSelected && styles.cardSelected,
                ]}
                onPress={() => handleCardSelect(card)}
                disabled={!canSelect}
                activeOpacity={canSelect ? 0.7 : 1}
              >
                <Text style={[
                  styles.cardEmoji,
                  !canSelect && styles.disabledText
                ]}>
                  {card.emoji}
                </Text>
                <Text style={[
                  styles.cardName,
                  !canSelect && styles.disabledText
                ]}>
                  {card.name}
                </Text>
                <View style={styles.cardCostContainer}>
                  <Text style={[
                    styles.cardCost,
                    card.cost > playerCharges && styles.insufficientCharges,
                    !canSelect && styles.disabledText
                  ]}>
                    ⚡ {card.cost}
                  </Text>
                  {card.cost > playerCharges && gamePhase === 'selection' && (
                    <Text style={styles.insufficientLabel}>Need {card.cost - playerCharges} more</Text>
                  )}
                </View>
                <Text style={[
                  styles.cardDescription,
                  !canSelect && styles.disabledText
                ]}>
                  {card.description}
                </Text>
                {isSelected && (
                  <View style={styles.selectedBadge}>
                    <Text style={styles.selectedBadgeText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  selectedCardsContainer: {
    padding: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  selectedCard: {
    backgroundColor: '#e8f5e8',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    alignItems: 'center',
    minWidth: 90,
    borderWidth: 2,
    borderColor: '#28a745',
    shadowColor: '#28a745',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedCardEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  selectedCardName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 2,
  },
  selectedCardCost: {
    fontSize: 10,
    color: '#28a745',
    fontWeight: '600',
    marginBottom: 4,
  },
  removeText: {
    color: '#ff4444',
    fontSize: 10,
    fontWeight: '500',
  },
  cardsContainer: {
    flex: 1,
    padding: 15,
  },
  cardsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    width: '48%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    position: 'relative',
  },
  cardDisabled: {
    backgroundColor: '#f8f9fa',
    opacity: 0.6,
    borderColor: '#e9ecef',
  },
  cardSelected: {
    backgroundColor: '#e8f5e8',
    borderWidth: 2,
    borderColor: '#28a745',
    shadowColor: '#28a745',
    shadowOpacity: 0.2,
  },
  cardEmoji: {
    fontSize: 28,
    marginBottom: 6,
  },
  cardName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  cardCostContainer: {
    alignItems: 'center',
    marginBottom: 6,
  },
  cardCost: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  insufficientCharges: {
    color: '#ff4444',
  },
  insufficientLabel: {
    fontSize: 9,
    color: '#ff4444',
    fontStyle: 'italic',
    marginTop: 2,
  },
  cardDescription: {
    fontSize: 10,
    color: '#888',
    textAlign: 'center',
    lineHeight: 12,
  },
  disabledText: {
    color: '#ccc',
  },
  selectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#28a745',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default CardSelector;