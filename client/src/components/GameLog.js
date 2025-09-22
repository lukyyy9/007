import React, { useRef, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

const GameLog = ({ 
  entries = [], 
  maxHeight = 120, 
  style = {},
  showTimestamps = false,
  autoScroll = true 
}) => {
  const scrollViewRef = useRef(null);

  useEffect(() => {
    if (autoScroll && scrollViewRef.current && entries.length > 0) {
      // Auto-scroll to bottom when new entries are added
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [entries.length, autoScroll]);

  const getEntryIcon = (type) => {
    switch (type) {
      case 'damage':
        return '💥';
      case 'heal':
        return '💚';
      case 'charge':
        return '⚡';
      case 'block':
        return '🛡️';
      case 'burn':
        return '🔥';
      case 'status':
        return '✨';
      case 'turn':
        return '🔄';
      case 'win':
        return '🏆';
      case 'lose':
        return '💀';
      case 'info':
        return 'ℹ️';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      case 'game':
        return '🎮';
      default:
        return '📝';
    }
  };

  const getEntryColor = (type) => {
    switch (type) {
      case 'damage':
        return '#ff4444';
      case 'heal':
        return '#28a745';
      case 'charge':
        return '#007AFF';
      case 'block':
        return '#6c757d';
      case 'burn':
        return '#fd7e14';
      case 'status':
        return '#6f42c1';
      case 'turn':
        return '#17a2b8';
      case 'win':
        return '#28a745';
      case 'lose':
        return '#dc3545';
      case 'info':
        return '#17a2b8';
      case 'warning':
        return '#ffc107';
      case 'error':
        return '#dc3545';
      case 'game':
        return '#6c757d';
      default:
        return '#333';
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  if (entries.length === 0) {
    return (
      <View style={[styles.container, { maxHeight }, style]}>
        <Text style={styles.title}>Game Log</Text>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No game events yet...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { maxHeight }, style]}>
      <Text style={styles.title}>Game Log</Text>
      <ScrollView 
        ref={scrollViewRef}
        style={styles.scrollView}
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
      >
        {entries.map((entry, index) => (
          <View key={entry.id || index} style={styles.entryContainer}>
            <View style={styles.entryHeader}>
              <View style={styles.entryIconContainer}>
                <Text style={styles.entryIcon}>{getEntryIcon(entry.type)}</Text>
                {entry.turn && (
                  <Text style={styles.turnNumber}>T{entry.turn}</Text>
                )}
              </View>
              {showTimestamps && entry.timestamp && (
                <Text style={styles.timestamp}>
                  {formatTimestamp(entry.timestamp)}
                </Text>
              )}
            </View>
            <Text style={[
              styles.entryMessage,
              { color: getEntryColor(entry.type) }
            ]}>
              {entry.message}
            </Text>
            {entry.details && (
              <Text style={styles.entryDetails}>{entry.details}</Text>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingHorizontal: 15,
    paddingTop: 12,
    paddingBottom: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  scrollView: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  entryContainer: {
    marginBottom: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  entryIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  entryIcon: {
    fontSize: 12,
  },
  turnNumber: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#666',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 6,
  },
  timestamp: {
    fontSize: 9,
    color: '#999',
  },
  entryMessage: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 18,
  },
  entryDetails: {
    fontSize: 10,
    color: '#666',
    marginLeft: 18,
    marginTop: 2,
    fontStyle: 'italic',
  },
});

export default GameLog;