import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import './GameRoomScreen.css';

const GameRoomScreen = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const [isReady, setIsReady] = useState(false);
  const [gameSettings, setGameSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const { leaveGame } = useGame();
  const { isConnected } = useSocket();
  const { user } = useAuth();

  const loadGameData = useCallback(async () => {
    try {
      // TODO: Implement API call to get game data
      // For now, using mock data
      setGameSettings({
        bestOfSeries: 3,
        turnTimeLimit: 30,
        maxHealth: 6,
        gameMode: 'standard',
        gameName: 'Partie de test'
      });

      setPlayers([
        {
          id: user?.id,
          username: user?.username,
          isReady: false,
          isHost: true
        },
        {
          id: '2',
          username: 'En attente...',
          isReady: false,
          isHost: false
        }
      ]);

      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement de la partie:', error);
      setLoading(false);
    }
  }, [user?.id, user?.username]);

  useEffect(() => {
    if (!gameId) {
      navigate('/');
      return;
    }

    loadGameData();
  }, [gameId, navigate, loadGameData]);

  const handleToggleReady = () => {
    setIsReady(!isReady);
    // TODO: Emit socket event for ready status
    console.log('Toggle ready status:', !isReady);
  };

  const handleLeaveGame = () => {
    if (window.confirm('Êtes-vous sûr de vouloir quitter cette partie ?')) {
      leaveGame();
      navigate('/');
    }
  };

  const handleStartGame = () => {
    if (players.length === 2 && players.every(p => p.isReady || p.id === user?.id)) {
      navigate(`/game/${gameId}/board`);
    }
  };

  if (loading) {
    return (
      <div className="game-room-screen loading">
        <div className="loading-spinner"></div>
        <p>Chargement de la salle de jeu...</p>
      </div>
    );
  }

  const isHost = players.find(p => p.id === user?.id)?.isHost;
  const allPlayersReady = players.length === 2 && players.every(p => p.isReady || p.isHost);

  return (
    <div className="game-room-screen">
      <div className="game-room-header">
        <h1>{gameSettings.gameName || 'Salle de jeu'}</h1>
        <div className="connection-status">
          <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></span>
          {isConnected ? 'Connecté' : 'Déconnecté'}
        </div>
      </div>

      <div className="game-room-content">
        <div className="game-settings">
          <h2>Paramètres de la partie</h2>
          <div className="settings-grid">
            <div className="setting-item">
              <span className="setting-label">Mode de jeu :</span>
              <span className="setting-value">{gameSettings.gameMode}</span>
            </div>
            <div className="setting-item">
              <span className="setting-label">Meilleur de :</span>
              <span className="setting-value">{gameSettings.bestOfSeries}</span>
            </div>
            <div className="setting-item">
              <span className="setting-label">Temps par tour :</span>
              <span className="setting-value">{gameSettings.turnTimeLimit}s</span>
            </div>
            <div className="setting-item">
              <span className="setting-label">Santé max :</span>
              <span className="setting-value">{gameSettings.maxHealth}</span>
            </div>
          </div>
        </div>

        <div className="players-section">
          <h2>Joueurs ({players.length}/2)</h2>
          <div className="players-list">
            {players.map((player) => (
              <div key={player.id} className="player-card">
                <div className="player-info">
                  <span className="player-name">
                    {player.username}
                    {player.isHost && <span className="host-badge">Hôte</span>}
                  </span>
                  <span className={`player-status ${player.isReady ? 'ready' : 'not-ready'}`}>
                    {player.username === 'En attente...' ? 'En attente...' : player.isReady ? 'Prêt' : 'En attente'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="game-room-actions">
        <button
          className="leave-button"
          onClick={handleLeaveGame}
        >
          Quitter la partie
        </button>

        <button
          className={`ready-button ${isReady ? 'ready' : 'not-ready'}`}
          onClick={handleToggleReady}
        >
          {isReady ? 'Annuler' : 'Prêt'}
        </button>

        {isHost && (
          <button
            className={`start-button ${allPlayersReady ? 'enabled' : 'disabled'}`}
            onClick={handleStartGame}
            disabled={!allPlayersReady}
          >
            Commencer la partie
          </button>
        )}
      </div>
    </div>
  );
};

export default GameRoomScreen;