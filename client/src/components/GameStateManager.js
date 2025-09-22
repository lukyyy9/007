import React, { useEffect, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import { useGame } from '../context/GameContext';
import { useSocket } from '../context/SocketContext';

const GameStateManager = ({
  gameState,
  selectedCards,
  onGameStateUpdate,
  onAutoSelectCards,
  onTimerExpired,
  onSubmitCards,
}) => {
  const { updateGameState, updateTimer } = useGame();
  const { isConnected, gameState: socketGameState } = useSocket();
  const timerSyncRef = useRef(null);
  const autoSelectTriggeredRef = useRef(false);

  // Handle automatic card selection when timer expires
  const handleTimerExpired = useCallback(() => {
    if (gameState.phase === 'selection' && selectedCards.length < 3 && !autoSelectTriggeredRef.current) {
      autoSelectTriggeredRef.current = true;
      
      // Auto-select 3 Charger cards as per requirement 1.3
      const chargerCard = {
        id: 'charger',
        name: 'Charger',
        emoji: '⚡',
        cost: 0,
        description: 'Gain 1 charge'
      };
      
      const autoSelectedCards = [];
      const remainingSlots = 3 - selectedCards.length;
      
      for (let i = 0; i < remainingSlots; i++) {
        autoSelectedCards.push({ ...chargerCard, autoSelected: true });
      }
      
      // Add auto-selected cards
      onAutoSelectCards?.(autoSelectedCards);
      
      // Auto-submit after a brief delay to allow UI to update
      setTimeout(() => {
        onSubmitCards?.();
      }, 1000);
      
      Alert.alert(
        'Time Expired',
        `Auto-selected ${remainingSlots} Charger card${remainingSlots > 1 ? 's' : ''} and submitted your turn.`,
        [{ text: 'OK' }]
      );
    }
    
    onTimerExpired?.();
  }, [gameState.phase, selectedCards.length, onAutoSelectCards, onTimerExpired, onSubmitCards]);

  // Synchronize with server game state
  useEffect(() => {
    if (socketGameState && isConnected) {
      // Reset auto-select trigger when new turn starts
      if (socketGameState.phase === 'selection' && gameState.phase !== 'selection') {
        autoSelectTriggeredRef.current = false;
      }
      
      // Update local game state with server state
      onGameStateUpdate?.(socketGameState);
      updateGameState(socketGameState);
      
      // Sync timer with server timestamp
      if (socketGameState.turnTimer !== undefined && socketGameState.turnTimer !== null) {
        const serverTime = socketGameState.turnTimer;
        const now = Date.now();
        const timeRemaining = Math.max(0, Math.floor((serverTime - now) / 1000));
        updateTimer(timeRemaining);
        
        // Store server time for precise synchronization
        timerSyncRef.current = serverTime;
      }
    }
  }, [socketGameState, isConnected, onGameStateUpdate, updateGameState, updateTimer, gameState.phase]);

  // Handle connection status changes
  useEffect(() => {
    if (!isConnected && gameState.phase === 'selection') {
      // Show warning about connection loss during selection phase
      Alert.alert(
        'Connection Lost',
        'You have lost connection to the server. Attempting to reconnect...',
        [{ text: 'OK' }]
      );
    }
  }, [isConnected, gameState.phase]);

  // Handle phase transitions
  useEffect(() => {
    if (gameState.phase === 'resolution') {
      // Clear any pending timers during resolution
      // The server will handle the resolution timing
      autoSelectTriggeredRef.current = false;
    } else if (gameState.phase === 'ended') {
      // Game has ended, show final results
      // This will be handled by the parent component
      autoSelectTriggeredRef.current = false;
    } else if (gameState.phase === 'selection') {
      // Reset auto-select trigger for new selection phase
      autoSelectTriggeredRef.current = false;
    }
  }, [gameState.phase]);

  // Handle server timer synchronization
  useEffect(() => {
    if (gameState.phase === 'selection' && timerSyncRef.current) {
      const syncInterval = setInterval(() => {
        const now = Date.now();
        const timeRemaining = Math.max(0, Math.floor((timerSyncRef.current - now) / 1000));
        updateTimer(timeRemaining);
        
        // Clear interval when timer reaches 0
        if (timeRemaining === 0) {
          clearInterval(syncInterval);
        }
      }, 1000);

      return () => clearInterval(syncInterval);
    }
  }, [gameState.phase, updateTimer]);

  // Validate game state consistency
  useEffect(() => {
    if (gameState.players) {
      gameState.players.forEach(player => {
        // Validate player health
        if (player.health < 0) {
          console.warn('Player health is negative:', player.health);
        }
        
        // Validate player charges
        if (player.charges < 0) {
          console.warn('Player charges are negative:', player.charges);
        }
      });
    }
  }, [gameState.players]);

  // This component doesn't render anything, it just manages state
  return null;
};

export default GameStateManager;