import { useState, useEffect } from 'react';
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
import { useAuth } from '../context/AuthContext';
import SocketService from '../services/SocketService';
import ConnectionStatus from '../components/ConnectionStatus';
import SeriesProgressDisplay from '../components/SeriesProgressDisplay';

const GameRoomScreen = ({ navigation }) => {
  const [players, setPlayers] = useState([]);
  const [isReady, setIsReady] = useState(false);
  const [gameSettings, setGameSettings] = useState({});
  const { currentGame, leaveGame, gameConfig } = useGame();
  const { isConnected, leaveGame: socketLeaveGame, gameState } = useSocket();
  const { user } = useAuth();

  useEffect(() => {
    if (!currentGame) {
      navigation.navigate('Lobby');
      return;
    }

    // Initialize game settings
    setGameSettings({
      bestOfSeries: gameConfig.bestOfSeries || 1,
      turnTimeLimit: gameConfig.turnTimeLimit || 20,
      maxHealth: gameConfig.maxHealth || 6,
      gameMode: gameConfig.gameMode || 'standard',
    });

    // Set initial players if available from currentGame
    if (currentGame.player1Id && user?.id) {
      const initialPlayers = [];
      
      // Add player 1 (host)
      initialPlayers.push({
        id: currentGame.player1Id,
        username: currentGame.player1?.username || 'Player 1',
        isReady: false,
        isHost: true
      });

      // Add player 2 if exists
      if (currentGame.player2Id) {
        initialPlayers.push({
          id: currentGame.player2Id,
          username: currentGame.player2?.username || 'Player 2',
          isReady: false,
          isHost: false
        });
      }

      setPlayers(initialPlayers);
    }

    // Join the game room via WebSocket
    if (isConnected && currentGame.id) {
      SocketService.joinGame(currentGame.id);
    }
  }, [currentGame, gameConfig, navigation, isConnected, user]);

  // WebSocket event listeners
  useEffect(() => {
    if (!isConnected || !currentGame?.id) return;

    // Game room events
    const handleGameJoined = (data) => {
      console.log('Game joined:', data);
      if (data.gameState && data.gameState.players) {
        setPlayers(data.gameState.players.map(player => ({
          id: player.id,
          username: player.username,
          isReady: player.ready || false,
          isHost: player.id === currentGame.player1Id // First player is the host
        })));
      }
    };

    const handlePlayerJoined = (data) => {
      console.log('Player joined:', data);
      // Refresh game state
      SocketService.getGameState(currentGame.id);
    };

    const handlePlayerLeft = (data) => {
      console.log('Player left:', data);
      setPlayers(prev => prev.filter(p => p.id !== data.userId));
    };

    const handlePlayerReady = (data) => {
      console.log('Player ready status changed:', data);
      if (data.gameState && data.gameState.players) {
        setPlayers(data.gameState.players.map(player => ({
          id: player.id,
          username: player.username,
          isReady: player.ready || false,
          isHost: player.id === currentGame.player1Id
        })));
      } else if (data.userId && data.ready !== undefined) {
        // Update specific player's ready status
        setPlayers(prev => prev.map(player => 
          player.id === data.userId 
            ? { ...player, isReady: data.ready }
            : player
        ));
      }
    };

    const handleGameStateUpdate = (data) => {
      console.log('Game state updated:', data);
      if (data.gameState && data.gameState.players) {
        setPlayers(data.gameState.players.map(player => ({
          id: player.id,
          username: player.username,
          isReady: player.ready || false,
          isHost: player.id === currentGame.player1Id
        })));
      }
    };

    const handleSettingsUpdate = (data) => {
      console.log('Game settings updated:', data);
      if (data.settings) {
        setGameSettings(prev => ({ ...prev, ...data.settings }));
      }
    };

    const handleGameStarted = (data) => {
      console.log('Game started:', data);
      navigation.navigate('GameBoard');
    };

    const handleGameError = (data) => {
      console.error('Game error:', data);
      Alert.alert('Game Error', data.error || 'An error occurred');
    };

    // Register event listeners
    SocketService.on('game:joined', handleGameJoined);
    SocketService.on('game:player-joined', handlePlayerJoined);
    SocketService.on('game:player-left', handlePlayerLeft);
    SocketService.on('game:player-ready', handlePlayerReady);
    SocketService.on('game:state-update', handleGameStateUpdate);
    SocketService.on('game:settings-updated', handleSettingsUpdate);
    SocketService.on('game:started', handleGameStarted);
    SocketService.on('game:error', handleGameError);

    // Request initial game state
    SocketService.getGameState(currentGame.id);

    // Cleanup function
    return () => {
      SocketService.off('game:joined', handleGameJoined);
      SocketService.off('game:player-joined', handlePlayerJoined);
      SocketService.off('game:player-left', handlePlayerLeft);
      SocketService.off('game:player-ready', handlePlayerReady);
      SocketService.off('game:state-update', handleGameStateUpdate);
      SocketService.off('game:settings-updated', handleSettingsUpdate);
      SocketService.off('game:started', handleGameStarted);
      SocketService.off('game:error', handleGameError);
    };
  }, [isConnected, currentGame, navigation]);

  const handleToggleReady = () => {
    if (!isConnected) {
      Alert.alert('Connection Error', 'Please check your connection and try again.');
      return;
    }

    const newReadyState = !isReady;
    setIsReady(newReadyState);
    
    // Send ready status to server via WebSocket
    if (currentGame?.id) {
      SocketService.setPlayerReady(currentGame.id, newReadyState);
    }
  };

  const handleStartGame = () => {
    const allPlayersReady = players.every(player => player.isReady);
    if (!allPlayersReady) {
      Alert.alert('Not Ready', 'All players must be ready to start the game.');
      return;
    }

    if (players.length < 2) {
      Alert.alert('Not Enough Players', 'Need at least 2 players to start.');
      return;
    }

    // Send start game request to server
    if (currentGame?.id) {
      SocketService.startGame(currentGame.id, gameSettings);
    }
  };

  const handleLeaveRoom = () => {
    Alert.alert(
      'Leave Room',
      'Are you sure you want to leave this game room?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: () => {
            // Send leave game request via socket if connected
            if (isConnected && currentGame?.id) {
              SocketService.leaveGame(currentGame.id);
            }
            
            leaveGame();
            navigation.navigate('Lobby');
          },
        },
      ]
    );
  };

  const handleChangeSettings = () => {
    Alert.alert(
      'Game Settings',
      'Choose series length:',
      [
        { text: 'Quick Match (1 game)', onPress: () => updateSettings({ bestOfSeries: 1 }) },
        { text: 'Best of 3', onPress: () => updateSettings({ bestOfSeries: 3 }) },
        { text: 'Best of 5', onPress: () => updateSettings({ bestOfSeries: 5 }) },
        { text: 'Best of 7', onPress: () => updateSettings({ bestOfSeries: 7 }) },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleChangeTimer = () => {
    Alert.alert(
      'Turn Timer',
      'Choose turn duration:',
      [
        { text: '10 seconds', onPress: () => updateSettings({ turnTimeLimit: 10 }) },
        { text: '15 seconds', onPress: () => updateSettings({ turnTimeLimit: 15 }) },
        { text: '20 seconds', onPress: () => updateSettings({ turnTimeLimit: 20 }) },
        { text: '30 seconds', onPress: () => updateSettings({ turnTimeLimit: 30 }) },
        { text: '45 seconds', onPress: () => updateSettings({ turnTimeLimit: 45 }) },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleChangeGameMode = () => {
    Alert.alert(
      'Game Mode',
      'Choose game mode:',
      [
        { text: 'Standard', onPress: () => updateSettings({ gameMode: 'standard' }) },
        { text: 'Blitz (faster)', onPress: () => updateSettings({ gameMode: 'blitz' }) },
        { text: 'Endurance (more health)', onPress: () => updateSettings({ gameMode: 'endurance' }) },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const updateSettings = (newSettings) => {
    setGameSettings(prev => ({ ...prev, ...newSettings }));
    
    // Send settings update to server
    if (currentGame?.id) {
      SocketService.updateGameSettings(currentGame.id, newSettings);
    }
  };

  const isHost = currentGame?.player1Id === user?.id; // Check if current user is the host

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Game Room</Text>
          <ConnectionStatus style={styles.connectionStatus} />
          {__DEV__ && (
            <Text style={styles.debugText}>
              Game ID: {currentGame?.id || 'None'} | User: {user?.username || 'None'}
            </Text>
          )}
        </View>
        <TouchableOpacity style={styles.leaveButton} onPress={handleLeaveRoom}>
          <Text style={styles.leaveButtonText}>Leave</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Game Settings</Text>
          <View style={styles.settingsCard}>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Game Mode:</Text>
              <Text style={styles.settingValue}>
                {gameSettings.gameMode === 'standard' ? 'Standard' :
                 gameSettings.gameMode === 'blitz' ? 'Blitz' :
                 gameSettings.gameMode === 'endurance' ? 'Endurance' : 'Standard'}
              </Text>
            </View>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Series:</Text>
              <Text style={styles.settingValue}>
                {gameSettings.bestOfSeries === 1 
                  ? 'Quick Match' 
                  : `Best of ${gameSettings.bestOfSeries}`}
              </Text>
            </View>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Turn Timer:</Text>
              <Text style={styles.settingValue}>{gameSettings.turnTimeLimit}s</Text>
            </View>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Starting Health:</Text>
              <Text style={styles.settingValue}>{gameSettings.maxHealth} ❤️</Text>
            </View>
            {isHost && (
              <View style={styles.settingsButtons}>
                <TouchableOpacity 
                  style={styles.settingButton}
                  onPress={handleChangeGameMode}
                >
                  <Text style={styles.settingButtonText}>Mode</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.settingButton}
                  onPress={handleChangeSettings}
                >
                  <Text style={styles.settingButtonText}>Series</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.settingButton}
                  onPress={handleChangeTimer}
                >
                  <Text style={styles.settingButtonText}>Timer</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Series Progress Display */}
        {gameSettings.bestOfSeries > 1 && (
          <SeriesProgressDisplay 
            seriesStatus={{
              bestOfSeries: gameSettings.bestOfSeries,
              winsNeeded: Math.ceil(gameSettings.bestOfSeries / 2),
              player1Wins: 0,
              player2Wins: 0,
              currentGameNumber: 1,
              isComplete: false,
              winner: null,
              summary: `Best of ${gameSettings.bestOfSeries} - Game 1 (0-0)`
            }}
            playerNames={players.length > 0 ? players.map(p => p.username) : ['Player 1', 'Player 2']}
          />
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Players ({players.length}/2)</Text>
          {players.map((player) => (
            <View key={player.id} style={styles.playerCard}>
              <View style={styles.playerInfo}>
                <Text style={styles.playerName}>
                  {player.username}
                  {player.isHost && ' 👑'}
                </Text>
                <Text style={[
                  styles.playerStatus,
                  player.isReady ? styles.readyStatus : styles.notReadyStatus
                ]}>
                  {player.isReady ? '✅ Ready' : '⏳ Not Ready'}
                </Text>
              </View>
            </View>
          ))}
          
          {players.length < 2 && (
            <View style={styles.waitingCard}>
              <Text style={styles.waitingText}>Waiting for another player...</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Game Rules</Text>
          <View style={styles.rulesCard}>
            <Text style={styles.ruleText}>• Each turn, select 3 cards within {gameSettings.turnTimeLimit} seconds</Text>
            <Text style={styles.ruleText}>• Cards resolve in 3 sequential steps</Text>
            <Text style={styles.ruleText}>• Reduce opponent's health to 0 to win</Text>
            <Text style={styles.ruleText}>• Use charges (⚡) to power stronger cards</Text>
            <Text style={styles.ruleText}>• Block damage with defensive cards</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.readyButton, isReady && styles.readyButtonActive]}
          onPress={handleToggleReady}
        >
          <Text style={[styles.readyButtonText, isReady && styles.readyButtonTextActive]}>
            {isReady ? '✅ Ready' : 'Ready Up'}
          </Text>
        </TouchableOpacity>

        {isHost && (
          <TouchableOpacity
            style={[
              styles.startButton,
              players.length < 2 && styles.startButtonDisabled
            ]}
            onPress={handleStartGame}
            disabled={players.length < 2}
          >
            <Text style={styles.startButtonText}>Start Game</Text>
          </TouchableOpacity>
        )}
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
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  connectionStatus: {
    alignSelf: 'flex-start',
  },
  debugText: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
  },
  leaveButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#ff4444',
  },
  leaveButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  section: {
    margin: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  settingsCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
  },
  settingValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  settingsButtons: {
    flexDirection: 'row',
    marginTop: 15,
    gap: 10,
  },
  settingButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  settingButtonText: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: '500',
  },
  playerCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  playerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  playerStatus: {
    fontSize: 14,
    fontWeight: '500',
  },
  readyStatus: {
    color: '#28a745',
  },
  notReadyStatus: {
    color: '#ffc107',
  },
  waitingCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: '#dee2e6',
  },
  waitingText: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
  },
  rulesCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ruleText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  footer: {
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  readyButton: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#28a745',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  readyButtonActive: {
    backgroundColor: '#28a745',
  },
  readyButtonText: {
    color: '#28a745',
    fontSize: 16,
    fontWeight: '600',
  },
  readyButtonTextActive: {
    color: 'white',
  },
  startButton: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
  },
  startButtonDisabled: {
    backgroundColor: '#ccc',
  },
  startButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default GameRoomScreen;