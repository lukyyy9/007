import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSocket } from '../context/SocketContext';

const ConnectionStatus = ({ style }) => {
  const { connectionStatus, isConnected, reconnectAttempts, connect } = useSocket();

  const getStatusInfo = () => {
    switch (connectionStatus) {
      case 'connected':
        return {
          text: '🟢 Connected',
          color: '#28a745',
          showRetry: false,
        };
      case 'connecting':
        return {
          text: '🟡 Connecting...',
          color: '#ffc107',
          showRetry: false,
        };
      case 'reconnecting':
        return {
          text: `🟡 Reconnecting... (${reconnectAttempts})`,
          color: '#ffc107',
          showRetry: false,
        };
      case 'error':
        return {
          text: '🔴 Connection Error',
          color: '#dc3545',
          showRetry: true,
        };
      case 'disconnected':
      default:
        return {
          text: '⚫ Disconnected',
          color: '#6c757d',
          showRetry: true,
        };
    }
  };

  const statusInfo = getStatusInfo();

  const handleRetry = () => {
    connect();
  };

  return (
    <View style={[styles.container, style]}>
      <Text style={[styles.statusText, { color: statusInfo.color }]}>
        {statusInfo.text}
      </Text>
      {statusInfo.showRetry && (
        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    marginRight: 8,
  },
  retryButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  retryText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
});

export default ConnectionStatus;