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
  GameStateManager,
  GameLog,
  CardEffectAnimation,
  TurnTransition,
  WinLoseScreen
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
  const [gameLog, setGameLog] = useState([
    { id: 1, timestamp: Date.now(), type: 'game', message: 'Game started', turn: 1 },
    { id: 2, timestamp: Date.now(), type: 'info', message: 'Waiting for players to select cards...', turn: 1 }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentEffect, setCurrentEffect] = useState(null);
  const [showTurnTransition, setShowTurnTransition] = useState(false);
  const [showWinLoseScreen, setShowWinLoseScreen] = useState(false);
  const [gameResult, setGameResult] = useState(null);
  
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
      const cardNames = selectedCards.map(card => card.name).join(', ');
      setGameLog(prev => [...prev, {
        id: Date.now(),
        timestamp: Date.now(),
        type: 'info',
        message: `Cards submitted: ${cardNames}`,
        turn: gameState.currentTurn
      }]);
      
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
      setGameLog(prev => [...prev, {
        id: Date.now(),
        timestamp: Date.now(),
        type: 'warning',
        message: 'Time expired - auto-selecting cards',
        turn: gameState.currentTurn
      }]);
    }
  };

  const handleGameStateUpdate = (newGameState) => {
    const previousPhase = gameState.phase;
    const previousTurn = gameState.currentTurn;
    
    setGameState(newGameState);
    
    // Show turn transition animation when phase or turn changes
    if (newGameState.phase !== previousPhase || newGameState.currentTurn !== previousTurn) {
      setShowTurnTransition(true);
      
      // Reset submission state when phase changes
      setIsSubmitting(false);
      
      // Clear selected cards when entering new selection phase
      if (newGameState.phase === 'selection') {
        setSelectedCards([]);
      }
      
      // Check for game end
      if (newGameState.phase === 'ended') {
        const winner = newGameState.players.find(p => p.health > 0);
        const currentPlayer = newGameState.players[0];
        
        if (winner) {
          setGameResult(winner.id === currentPlayer.id ? 'win' : 'lose');
        } else {
          setGameResult('draw');
        }
        
        setTimeout(() => {
          setShowWinLoseScreen(true);
        }, 2000);
      }
    }
    
    // Trigger card effect animations based on game log changes
    if (newGameState.lastEffect) {
      setCurrentEffect(newGameState.lastEffect);
      setTimeout(() => setCurrentEffect(null), 2000);
    }
  };

  const handleAutoSelectCards = (autoCards) => {
    setSelectedCards(prev => [...prev, ...autoCards]);
    setGameLog(prev => [...prev, {
      id: Date.now(),
      timestamp: Date.now(),
      type: 'charge',
      message: `Auto-selected ${autoCards.length} Charger cards`,
      turn: gameState.currentTurn,
      details: 'Cards were automatically selected due to time expiry'
    }]);
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
      <GameLog
        entries={gameLog}
        maxHeight={120}
        showTimestamps={false}
        autoScroll={true}
        style={styles.gameLog}
      />

      {/* Game State Manager */}
      <GameStateManager
        gameState={gameState}
        selectedCards={selectedCards}
        onGameStateUpdate={handleGameStateUpdate}
        onAutoSelectCards={handleAutoSelectCards}
        onTimerExpired={handleTimerExpired}
        onSubmitCards={handleSubmitCards}
      />

      {/* Card Effect Animation */}
      <CardEffectAnimation
        effect={currentEffect}
        isVisible={!!currentEffect}
        onComplete={() => setCurrentEffect(null)}
      />

      {/* Turn Transition Animation */}
      <TurnTransition
        isVisible={showTurnTransition}
        turnNumber={gameState.currentTurn}
        phase={gameState.phase}
        onComplete={() => setShowTurnTransition(false)}
      />

      {/* Win/Lose Screen */}
      <WinLoseScreen
        isVisible={showWinLoseScreen}
        result={gameResult}
        playerStats={gameState.players[0]}
        onPlayAgain={() => {
          setShowWinLoseScreen(false);
          setGameResult(null);
          // Reset game state for new game
          navigation.navigate('Lobby');
        }}
        onBackToLobby={() => {
          setShowWinLoseScreen(false);
          setGameResult(null);
          handleLeaveGame();
        }}
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
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    minHeight: 60,
  },
  headerLeft: {
    flex: 1,
    minWidth: 0, // Allows text to truncate if needed
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
    backgroundColor: '#f8f9fa',
  },
  playerStatsContainer: {
    flex: 1,
    minWidth: 0, // Prevents overflow on small screens
  },
  phaseIndicator: {
    marginHorizontal: 15,
    marginVertical: 8,
  },
  actionContainer: {
    padding: 15,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    minHeight: 70,
  },
  submitButton: {
    width: '100%',
  },
  gameLog: {
    flex: 0,
    minHeight: 120,
    maxHeight: 150,
  },
});

export default GameBoardScreen;