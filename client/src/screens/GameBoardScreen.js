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
import { 
  ConnectionStatus, 
  CardSelector, 
  EmojiResource, 
  ActionButton, 
  PlayerStats,
  GameTimer,
  TurnPhaseIndicator,
  GameStateManager
} from '../components';

const GameBoardScreen = ({ navigation }) => {
  const [gameState, setGameState] = useState({
    players: [
      { id: '1', username: 'Player1', health: 6, charges: 0, statusEffects: [], ready: false },
      { id: '2', username: 'Player2', health: 6, charges: 0, statusEffects: [], ready: false },
    ],
    currentTurn: 1,
    phase: 'selection', // 'selection' | 'resolution' | 'ended'
    turnTimer: 20,
    turnTimerServer: null, // Server timestamp for timer synchronization
  });
  const [selectedCards, setSelectedCards] = useState([]);
  const [gameLog, setGameLog] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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

    // Real-time game state synchronization is now handled by GameStateManager
    // No need for local timer simulation
  }, [currentGame, navigation]);



  const handleSubmitCards = () => {
    if (selectedCards.length !== 3) {
      Alert.alert('Incomplete Selection', 'Please select exactly 3 cards.');
      return;
    }

    if (!isConnected) {
      Alert.alert('Connection Error', 'Please check your connection and try again.');
      return;
    }

    if (isSubmitting) {
      return; // Prevent double submission
    }

    setIsSubmitting(true);

    // Send card selection to server via socket
    const success = socketSelectCards(currentGame?.id, selectedCards);
    if (success) {
      setGameLog(prev => [...prev, `Turn ${gameState.currentTurn}: Cards submitted`]);
      
      // Update local player ready state
      setGameState(prev => ({
        ...prev,
        players: prev.players.map((player, index) => 
          index === 0 ? { ...player, ready: true } : player
        )
      }));
    } else {
      Alert.alert('Error', 'Failed to submit cards. Please check your connection.');
      setIsSubmitting(false);
    }
  };

  const handleCardSelect = (card) => {
    setSelectedCards(prev => [...prev, card]);
  };

  const handleCardDeselect = (index) => {
    setSelectedCards(prev => prev.filter((_, i) => i !== index));
  };

  const handleTimerExpired = () => {
    if (gameState.phase === 'selection' && selectedCards.length < 3 && !isSubmitting) {
      // This will be handled by GameStateManager
      setGameLog(prev => [...prev, `Turn ${gameState.currentTurn}: Time expired - auto-selecting cards`]);
    }
  };

  const handleGameStateUpdate = (newGameState) => {
    setGameState(newGameState);
    
    // Reset submission state when phase changes
    if (newGameState.phase !== gameState.phase) {
      setIsSubmitting(false);
      
      // Clear selected cards when entering new selection phase
      if (newGameState.phase === 'selection') {
        setSelectedCards([]);
      }
    }
  };

  const handleAutoSelectCards = (autoCards) => {
    setSelectedCards(prev => [...prev, ...autoCards]);
    setGameLog(prev => [...prev, `Turn ${gameState.currentTurn}: Auto-selected ${autoCards.length} Charger cards`]);
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



  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.turnText}>Turn {gameState.currentTurn}</Text>
          <ConnectionStatus style={styles.connectionStatus} />
        </View>
        <GameTimer
          timeRemaining={gameState.turnTimer}
          totalTime={20}
          onTimeExpired={handleTimerExpired}
          isActive={gameState.phase === 'selection' && !isSubmitting}
          size="medium"
          showProgress={true}
          serverTime={gameState.turnTimerServer}
          autoSelectOnExpiry={true}
        />
        <ActionButton
          title="Leave"
          onPress={handleLeaveGame}
          variant="danger"
          size="small"
        />
      </View>

      {/* Player Stats */}
      <View style={styles.playersContainer}>
        {gameState.players.map((player, index) => (
          <PlayerStats
            key={player.id}
            player={player}
            isCurrentPlayer={index === 0}
            size="medium"
            showStatusEffects={true}
            style={styles.playerStatsContainer}
          />
        ))}
      </View>

      {/* Turn Phase Indicator */}
      <TurnPhaseIndicator
        phase={gameState.phase}
        turnNumber={gameState.currentTurn}
        animated={true}
        style={styles.phaseIndicator}
        playersReady={{
          player1: gameState.players[0]?.ready || false,
          player2: gameState.players[1]?.ready || false,
        }}
        timeRemaining={gameState.turnTimer}
        showPlayerStatus={true}
      />

      {/* Card Selection Interface */}
      <CardSelector
        availableCards={availableCards}
        selectedCards={selectedCards}
        onCardSelect={handleCardSelect}
        onCardDeselect={handleCardDeselect}
        playerCharges={gameState.players[0]?.charges || 0}
        gamePhase={gameState.phase}
        maxSelection={3}
      />

      {/* Action Button */}
      {gameState.phase === 'selection' && (
        <View style={styles.actionContainer}>
          <ActionButton
            title={isSubmitting ? 'Submitting...' : `Submit Cards (${selectedCards.length}/3)`}
            onPress={handleSubmitCards}
            disabled={selectedCards.length !== 3 || isSubmitting || gameState.players[0]?.ready}
            variant="success"
            size="large"
            icon={isSubmitting ? '⏳' : '🎯'}
            style={styles.submitButton}
          />
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

      {/* Game State Manager */}
      <GameStateManager
        gameState={gameState}
        selectedCards={selectedCards}
        onGameStateUpdate={handleGameStateUpdate}
        onAutoSelectCards={handleAutoSelectCards}
        onTimerExpired={handleTimerExpired}
        onSubmitCards={handleSubmitCards}
      />
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
  playersContainer: {
    flexDirection: 'row',
    padding: 15,
    gap: 10,
  },
  playerStatsContainer: {
    flex: 1,
  },
  phaseIndicator: {
    marginHorizontal: 15,
  },
  actionContainer: {
    padding: 15,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  submitButton: {
    width: '100%',
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