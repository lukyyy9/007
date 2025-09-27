import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Context Providers
import { AuthProvider, GameProvider, TournamentProvider, SocketProvider } from './context';
import { useAuth } from './context/AuthContext';

// Screens
import { LoginScreen, RegisterScreen, LobbyScreen } from './screens';

// Global styles
import './App.css';

// Loading component
const LoadingScreen = () => (
  <div className="loading-screen">
    <div className="loading-spinner"></div>
    <p>Chargement...</p>
  </div>
);

// Auth wrapper component
const AuthWrapper = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <AuthScreens />;
  }

  return children;
};

// Authentication screens component
const AuthScreens = () => {
  const [isLoginMode, setIsLoginMode] = useState(true);

  return (
    <>
      {isLoginMode ? (
        <LoginScreen onSwitchToRegister={() => setIsLoginMode(false)} />
      ) : (
        <RegisterScreen onSwitchToLogin={() => setIsLoginMode(true)} />
      )}
    </>
  );
};

// Main app component
const AppContent = () => {
  const handleNavigateToGame = (gameId) => {
    // TODO: Implement navigation to game screen
    console.log('Navigate to game:', gameId);
  };

  const handleNavigateToTournament = (tournamentId) => {
    // TODO: Implement navigation to tournament screen
    console.log('Navigate to tournament:', tournamentId);
  };

  const handleNavigateToProfile = () => {
    // TODO: Implement navigation to profile screen
    console.log('Navigate to profile');
  };

  return (
    <Router>
      <AuthWrapper>
        <Routes>
          <Route 
            path="/" 
            element={
              <LobbyScreen 
                onNavigateToGame={handleNavigateToGame}
                onNavigateToTournament={handleNavigateToTournament}
                onNavigateToProfile={handleNavigateToProfile}
              />
            } 
          />
          <Route path="/lobby" element={<Navigate to="/" replace />} />
          {/* TODO: Add more routes for game, tournament, profile screens */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthWrapper>
    </Router>
  );
};

// Root app component with all providers
function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <GameProvider>
          <TournamentProvider>
            <AppContent />
          </TournamentProvider>
        </GameProvider>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;