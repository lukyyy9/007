import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useGame } from '../context/GameContext';
import { useSocket } from '../context/SocketContext';
import ConnectionStatus from '../components/ConnectionStatus';

const GameBoardScreen = ({ navigation }) => {
  const [gameState, setGameState] = useState({
    players: [
      { id: '1', username: 'Player1', health: 6, charges: 0, statusEffects: [] },
      { id: '2', username: 'Player2', health: 6, charges: 0, statusEffects: [] },
    ],
    currentTurn: 1,
    phase: 'selection', // 'selection' | 'resolution' | 'ended'
    turnTimer: 20,
  });
  const [selectedCards, setSelectedCards] = useState([]);
  const [gameLog, setGameLog] = useState([]);
  
  const { currentGame, leaveGame, updateGameState } = useGame();
  const { isConnected, selectCards: socketSelectCards, leaveGame: socketLeaveGame, gameState: socketGameState } = useSocket();

  // Mock card data - will be replaced with actual card system in later tasks
  const availableCards = [
    { id: 'charger', name: 'Charger', emoji: '⚡', cost: 0, description: 'Gain 1 charge' },
    { id: 'tirer', name: 'Tirer', emoji: '🎯', cost: 1, description: 'Deal 1 damage' },
    { id: 'bloquer', name: 'Bloquer', emoji: '🛡️', cost: 0, description: 'Block all damage' },
    { id: 'big-blast', name: 'Big Blast', emoji: '💥', cost: 3, description: 'Deal 5 damage' },
    { id: 'bruler', name: 'Brûler', emoji: '🔥', cost: 2, description: 'Deal 1 damage + burn' },
    { id: 'riposte', name: 'Riposte', emoji: '⚔️', cost: 0, description: 'Counter attack' },
  ];

  useEffect(() => {
    if (!currentGame) {
      navigation.navigate('Lobby');
      return;
    }

    // TODO: Replace with actual WebSocket events in task 6.2
    // Mock game state updates
    const timer = setInterval(() => {
      if (gameState.phase === 'selection' && gameState.turnTimer > 0) {
        setGameState(prev => ({ ...prev, turnTimer: prev.turnTimer - 1 }));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [currentGame, navigation, gameState.phase, gameState.turnTimer]);

  const handleCardSelect = (card) => {
    if (selectedCards.length >= 3) {
      Alert.alert('Maximum Cards', 'You can only select 3 cards per turn.');
      return;
    }

    const currentPlayer = gameState.players[0]; // Assuming current user is player 0
    if (card.cost > currentPlayer.charges) {
      Alert.alert('Not Enough Charges', `This card requires ${card.cost} charges. You have ${currentPlayer.charges}.`);
      return;
    }

    setSelectedCards([...selectedCards, card]);
  };

  const handleCardDeselect = (index) => {
    const newSelection = selectedCards.filter((_, i) => i !== index);
    setSelectedCards(newSelection);
  };

  const handleSubmitCards = () => {
    if (selectedCards.length !== 3) {
      Alert.alert('Incomplete Selection', 'Please select exactly 3 cards.');
      return;
    }

    if (!isConnected) {
      Alert.alert('Connection Error', 'Please check your connection and try again.');
      return;
    }

    // Send card selection to server via socket
    const success = socketSelectCards(currentGame?.id, selectedCards);
    if (success) {
      setGameLog(prev => [...prev, `Turn ${gameState.currentTurn}: Cards submitted`]);
      
      // Mock turn resolution for now - will be replaced with actual socket response
      setTimeout(() => {
        setGameState(prev => ({
          ...prev,
          phase: 'resolution',
          currentTurn: prev.currentTurn + 1,
          turnTimer: 20,
        }));
        
        setTimeout(() => {
          setGameState(prev => ({ ...prev, phase: 'selection' }));
          setSelectedCards([]);
        }, 3000);
      }, 1000);
    } else {
      Alert.alert('Error', 'Failed to submit cards. Please check your connection.');
    }
  };

  const handleLeaveGame = () => {
    Alert.alert(
      'Leave Game',
      'Are you sure you want to leave this game?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: () => {
            // Send leave game request via socket if connected
            if (isConnected && currentGame?.id) {
              socketLeaveGame(currentGame.id);
            }
            
            leaveGame();
            navigation.navigate('Lobby');
          },
        },
      ]
    );
  };

  const canSelectCard = (card) => {
    const currentPlayer = gameState.players[0];
    return gameState.phase === 'selection' && 
           selectedCards.length < 3 && 
           card.cost <= currentPlayer.charges;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.turnText}>Turn {gameState.currentTurn}</Text>
          <ConnectionStatus style={styles.connectionStatus} />
        </View>
        <Text style={styles.timerText}>⏱️ {gameState.turnTimer}s</Text>
        <TouchableOpacity style={styles.leaveButton} onPress={handleLeaveGame}>
          <Text style={styles.leaveButtonText}>Leave</Text>
        </TouchableOpacity>
      </View>

      {/* Player Stats */}
      <View style={styles.playersContainer}>
        {gameState.players.map((player, index) => (
          <View key={player.id} style={[
            styles.playerStats,
            index === 0 ? styles.currentPlayer : styles.opponent
          ]}>
            <Text style={styles.playerName}>{player.username}</Text>
            <View style={styles.statsRow}>
              <Text style={styles.statText}>❤️ {player.health}</Text>
              <Text style={styles.statText}>⚡ {player.charges}</Text>
            </View>
            {player.statusEffects.length > 0 && (
              <View style={styles.statusEffects}>
                {player.statusEffects.map((effect, i) => (
                  <Text key={i} style={styles.statusEffect}>
                    {effect.type === 'burn' ? '🔥' : '🛡️'} {effect.duration}
                  </Text>
                ))}
              </View>
            )}
          </View>
        ))}
      </View>

      {/* Game Phase Indicator */}
      <View style={styles.phaseContainer}>
        <Text style={styles.phaseText}>
          {gameState.phase === 'selection' ? '🎯 Select 3 Cards' : 
           gameState.phase === 'resolution' ? '⚔️ Resolving Turn' : '🏁 Game Ended'}
        </Text>
      </View>

      {/* Selected Cards */}
      {selectedCards.length > 0 && (
        <View style={styles.selectedCardsContainer}>
          <Text style={styles.selectedTitle}>Selected Cards ({selectedCards.length}/3):</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {selectedCards.map((card, index) => (
              <TouchableOpacity
                key={index}
                style={styles.selectedCard}
                onPress={() => handleCardDeselect(index)}
              >
                <Text style={styles.cardEmoji}>{card.emoji}</Text>
                <Text style={styles.cardName}>{card.name}</Text>
                <Text style={styles.removeText}>✕</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Available Cards */}
      <ScrollView style={styles.cardsContainer}>
        <Text style={styles.cardsTitle}>Available Cards:</Text>
        <View style={styles.cardsGrid}>
          {availableCards.map((card) => (
            <TouchableOpacity
              key={card.id}
              style={[
                styles.card,
                !canSelectCard(card) && styles.cardDisabled,
                selectedCards.some(c => c.id === card.id) && styles.cardSelected
              ]}
              onPress={() => handleCardSelect(card)}
              disabled={!canSelectCard(card)}
            >
              <Text style={styles.cardEmoji}>{card.emoji}</Text>
              <Text style={styles.cardName}>{card.name}</Text>
              <Text style={styles.cardCost}>⚡ {card.cost}</Text>
              <Text style={styles.cardDescription}>{card.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Action Button */}
      {gameState.phase === 'selection' && (
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              selectedCards.length !== 3 && styles.submitButtonDisabled
            ]}
            onPress={handleSubmitCards}
            disabled={selectedCards.length !== 3}
          >
            <Text style={styles.submitButtonText}>
              Submit Cards ({selectedCards.length}/3)
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Game Log */}
      <View style={styles.logContainer}>
        <Text style={styles.logTitle}>Game Log:</Text>
        <ScrollView style={styles.logScroll}>
          {gameLog.map((entry, index) => (
            <Text key={index} style={styles.logEntry}>{entry}</Text>
          ))}
        </ScrollView>
      </View>
    </View>
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
    padding: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerLeft: {
    flex: 1,
  },
  turnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  connectionStatus: {
    alignSelf: 'flex-start',
  },
  timerText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff4444',
  },
  leaveButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#ff4444',
  },
  leaveButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  playersContainer: {
    flexDirection: 'row',
    padding: 15,
    gap: 10,
  },
  playerStats: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  currentPlayer: {
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  opponent: {
    borderLeftWidth: 4,
    borderLeftColor: '#ff4444',
  },
  playerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statText: {
    fontSize: 18,
    fontWeight: '600',
  },
  statusEffects: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 5,
  },
  statusEffect: {
    fontSize: 12,
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  phaseContainer: {
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: '#e3f2fd',
  },
  phaseText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  selectedCardsContainer: {
    padding: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  selectedCard: {
    backgroundColor: '#e8f5e8',
    borderRadius: 8,
    padding: 10,
    marginRight: 10,
    alignItems: 'center',
    minWidth: 80,
    borderWidth: 2,
    borderColor: '#28a745',
  },
  removeText: {
    color: '#ff4444',
    fontSize: 12,
    marginTop: 4,
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
    gap: 10,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 12,
    width: '48%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardDisabled: {
    backgroundColor: '#f8f9fa',
    opacity: 0.6,
  },
  cardSelected: {
    backgroundColor: '#e8f5e8',
    borderWidth: 2,
    borderColor: '#28a745',
  },
  cardEmoji: {
    fontSize: 24,
    marginBottom: 5,
  },
  cardName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  cardCost: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 10,
    color: '#888',
    textAlign: 'center',
  },
  actionContainer: {
    padding: 15,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  logContainer: {
    maxHeight: 100,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    padding: 15,
  },
  logTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  logScroll: {
    maxHeight: 60,
  },
  logEntry: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
});

export default GameBoardScreen;