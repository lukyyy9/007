import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';

// Context Providers
import { AuthProvider, GameProvider, TournamentProvider, SocketProvider } from './context';
import { useAuth } from './context/AuthContext';

// Screens
import { 
  LoginScreen, 
  RegisterScreen, 
  LobbyScreen,
  ProfileScreen,
  GameRoomScreen,
  GameBoardScreen,
  TournamentScreen,
  TournamentBracketScreen
} from './screens';

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
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
};

// Routes component (needs to be inside Router to use useNavigate)
const AppRoutes = () => {
  const navigate = useNavigate();

  const handleNavigateToGame = (gameId) => {
    navigate(`/game/${gameId}`);
  };

  const handleNavigateToTournament = (tournamentId) => {
    navigate(`/tournament/${tournamentId}`);
  };

  const handleNavigateToProfile = () => {
    navigate('/profile');
  };

  return (
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
        
        {/* Profile Route */}
        <Route path="/profile" element={<ProfileScreen />} />
        
        {/* Game Routes */}
        <Route path="/game/:gameId" element={<GameRoomScreen />} />
        <Route path="/game/:gameId/board" element={<GameBoardScreen />} />
        
        {/* Tournament Routes */}
        <Route path="/tournament" element={<TournamentScreen />} />
        <Route path="/tournament/:tournamentId" element={<TournamentBracketScreen />} />
        <Route path="/tournament/:tournamentId/bracket" element={<TournamentBracketScreen />} />
        
        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthWrapper>
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