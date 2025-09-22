import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

// Context Providers
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { GameProvider } from './src/context/GameContext';
import { TournamentProvider } from './src/context/TournamentContext';
import { SocketProvider } from './src/context/SocketContext';

// Screen imports
import {
  LobbyScreen,
  GameRoomScreen,
  GameBoardScreen,
  ProfileScreen,
  LoginScreen,
  RegisterScreen,
} from './src/screens';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Loading component
const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#007AFF" />
    <Text style={styles.loadingText}>Loading...</Text>
  </View>
);

// Authentication Stack Navigator
const AuthStack = () => (
  <Stack.Navigator 
    initialRouteName="Login"
    screenOptions={{
      headerShown: false,
    }}
  >
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

// Main Tab Navigator for authenticated users
const MainTabs = () => (
  <Tab.Navigator
    screenOptions={{
      tabBarActiveTintColor: '#007AFF',
      tabBarInactiveTintColor: '#666',
      tabBarStyle: {
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#eee',
      },
    }}
  >
    <Tab.Screen 
      name="Lobby" 
      component={LobbyScreen}
      options={{
        title: 'Tactical Card Game',
        tabBarLabel: 'Lobby',
        tabBarIcon: ({ color }) => (
          <Text style={{ color, fontSize: 20 }}>🏠</Text>
        ),
      }}
    />
    <Tab.Screen 
      name="Profile" 
      component={ProfileScreen}
      options={{
        title: 'Profile',
        tabBarLabel: 'Profile',
        tabBarIcon: ({ color }) => (
          <Text style={{ color, fontSize: 20 }}>👤</Text>
        ),
      }}
    />
  </Tab.Navigator>
);

// Game Stack Navigator (for game-related screens)
const GameStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="MainTabs" 
      component={MainTabs}
      options={{ headerShown: false }}
    />
    <Stack.Screen 
      name="GameRoom" 
      component={GameRoomScreen}
      options={{ 
        title: 'Game Room',
        headerBackTitle: 'Lobby',
      }}
    />
    <Stack.Screen 
      name="GameBoard" 
      component={GameBoardScreen}
      options={{ 
        title: 'Game Board',
        headerBackTitle: 'Room',
        headerLeft: null, // Prevent back navigation during game
      }}
    />
  </Stack.Navigator>
);

// Main App Navigator
const AppNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      {isAuthenticated ? <GameStack /> : <AuthStack />}
    </NavigationContainer>
  );
};

// Main App Component with Providers
export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <GameProvider>
          <TournamentProvider>
            <AppNavigator />
          </TournamentProvider>
        </GameProvider>
      </SocketProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
});