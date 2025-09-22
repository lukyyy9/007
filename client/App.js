import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';

// Import screens when they are created
// import LobbyScreen from './src/screens/LobbyScreen';
// import GameRoomScreen from './src/screens/GameRoomScreen';
// import GameBoardScreen from './src/screens/GameBoardScreen';
// import ProfileScreen from './src/screens/ProfileScreen';

const Stack = createStackNavigator();

// Placeholder component for development
const PlaceholderScreen = ({ route }) => {
  const { View, Text, StyleSheet } = require('react-native');
  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        {route.params?.title || 'Screen'} - Coming Soon
      </Text>
    </View>
  );
};

const styles = require('react-native').StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  text: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator initialRouteName="Lobby">
        <Stack.Screen 
          name="Lobby" 
          component={PlaceholderScreen}
          initialParams={{ title: 'Lobby' }}
          options={{ title: 'Tactical Card Game' }}
        />
        <Stack.Screen 
          name="GameRoom" 
          component={PlaceholderScreen}
          initialParams={{ title: 'Game Room' }}
        />
        <Stack.Screen 
          name="GameBoard" 
          component={PlaceholderScreen}
          initialParams={{ title: 'Game Board' }}
        />
        <Stack.Screen 
          name="Profile" 
          component={PlaceholderScreen}
          initialParams={{ title: 'Profile' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}