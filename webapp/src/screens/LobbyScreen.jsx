import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { ActionButton, ConnectionStatus } from '../components';
import { GameAPI, TournamentAPI } from '../services';
import './LobbyScreen.css';

const LobbyScreen = ({ onNavigateToGame, onNavigateToTournament, onNavigateToProfile }) => {
  const [availableGames, setAvailableGames] = useState([]);
  const [availableTournaments, setAvailableTournaments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { user, logout } = useAuth();
  const { isConnected, reconnectAttempts } = useSocket();

  const gameAPI = new GameAPI();
  const tournamentAPI = new TournamentAPI();

  useEffect(() => {
    const loadDataAsync = async () => {
      setIsLoading(true);
      try {
        const [gamesResponse, tournamentsResponse] = await Promise.all([
          gameAPI.getAvailableGames().catch(() => ({ games: [] })),
          tournamentAPI.getAvailableTournaments().catch(() => ({ tournaments: [] }))
        ]);
        setAvailableGames(gamesResponse.games || []);
        setAvailableTournaments(tournamentsResponse.tournaments || []);
      } catch {
        setError('Erreur lors du chargement des données');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadDataAsync();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [gamesResponse, tournamentsResponse] = await Promise.all([
        gameAPI.getAvailableGames().catch(() => ({ games: [] })),
        tournamentAPI.getAvailableTournaments().catch(() => ({ tournaments: [] }))
      ]);
      setAvailableGames(gamesResponse.games || []);
      setAvailableTournaments(tournamentsResponse.tournaments || []);
    } catch (err) {
      setError('Erreur lors du chargement des données');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateGame = async () => {
    try {
      setIsLoading(true);
      const gameConfig = {
        maxPlayers: 2,
        turnTimeLimit: 30,
        bestOfSeries: 1
      };
      const game = await gameAPI.createGame(gameConfig);
      onNavigateToGame(game.gameId);
    } catch {
      setError('Erreur lors de la création de la partie');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinGame = async (gameId) => {
    try {
      setIsLoading(true);
      await gameAPI.joinGame(gameId);
      onNavigateToGame(gameId);
    } catch {
      setError('Erreur lors de la connexion à la partie');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTournament = async () => {
    try {
      setIsLoading(true);
      const tournamentConfig = {
        name: `Tournoi de ${user.username}`,
        maxParticipants: 8,
        type: 'single-elimination'
      };
      const tournament = await tournamentAPI.createTournament(tournamentConfig);
      onNavigateToTournament(tournament.tournamentId);
    } catch {
      setError('Erreur lors de la création du tournoi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinTournament = async (tournamentId) => {
    try {
      setIsLoading(true);
      await tournamentAPI.joinTournament(tournamentId);
      onNavigateToTournament(tournamentId);
    } catch {
      setError('Erreur lors de la connexion au tournoi');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="lobby-screen">
      <header className="lobby-screen__header">
        <div className="lobby-screen__header-left">
          <h1 className="lobby-screen__title">Tactical Card Game</h1>
          <ConnectionStatus isConnected={isConnected} reconnectAttempts={reconnectAttempts} />
        </div>
        <div className="lobby-screen__header-right">
          <span className="lobby-screen__welcome">Bienvenue, {user?.username}</span>
          <ActionButton variant="secondary" size="small" onClick={onNavigateToProfile}>
            Profil
          </ActionButton>
          <ActionButton variant="danger" size="small" onClick={logout}>
            Déconnexion
          </ActionButton>
        </div>
      </header>

      {error && (
        <div className="lobby-screen__error">
          {error}
          <button onClick={() => setError('')} className="lobby-screen__error-close">×</button>
        </div>
      )}

      <main className="lobby-screen__content">
        <div className="lobby-screen__section">
          <div className="lobby-screen__section-header">
            <h2 className="lobby-screen__section-title">Parties rapides</h2>
            <ActionButton 
              variant="primary" 
              onClick={handleCreateGame}
              loading={isLoading}
            >
              Créer une partie
            </ActionButton>
          </div>

          {availableGames.length > 0 ? (
            <div className="lobby-screen__games-grid">
              {availableGames.map(game => (
                <div key={game.gameId} className="lobby-screen__game-card">
                  <div className="lobby-screen__game-info">
                    <h3 className="lobby-screen__game-title">Partie de {game.host?.username}</h3>
                    <p className="lobby-screen__game-details">
                      {game.currentPlayers}/{game.maxPlayers} joueurs
                    </p>
                    <p className="lobby-screen__game-details">
                      Temps par tour: {game.turnTimeLimit}s
                    </p>
                  </div>
                  <ActionButton 
                    variant="secondary" 
                    onClick={() => handleJoinGame(game.gameId)}
                    disabled={isLoading || game.currentPlayers >= game.maxPlayers}
                  >
                    Rejoindre
                  </ActionButton>
                </div>
              ))}
            </div>
          ) : (
            <div className="lobby-screen__empty">
              <p>Aucune partie disponible pour le moment</p>
              <ActionButton variant="primary" onClick={loadData} loading={isLoading}>
                Actualiser
              </ActionButton>
            </div>
          )}
        </div>

        <div className="lobby-screen__section">
          <div className="lobby-screen__section-header">
            <h2 className="lobby-screen__section-title">Tournois</h2>
            <ActionButton 
              variant="primary" 
              onClick={handleCreateTournament}
              loading={isLoading}
            >
              Créer un tournoi
            </ActionButton>
          </div>

          {availableTournaments.length > 0 ? (
            <div className="lobby-screen__tournaments-grid">
              {availableTournaments.map(tournament => (
                <div key={tournament.tournamentId} className="lobby-screen__tournament-card">
                  <div className="lobby-screen__tournament-info">
                    <h3 className="lobby-screen__tournament-title">{tournament.name}</h3>
                    <p className="lobby-screen__tournament-details">
                      {tournament.currentParticipants}/{tournament.maxParticipants} participants
                    </p>
                    <p className="lobby-screen__tournament-details">
                      Type: {tournament.type}
                    </p>
                    <span className={`lobby-screen__tournament-status lobby-screen__tournament-status--${tournament.status}`}>
                      {tournament.status === 'waiting' && 'En attente'}
                      {tournament.status === 'active' && 'En cours'}
                      {tournament.status === 'completed' && 'Terminé'}
                    </span>
                  </div>
                  <ActionButton 
                    variant="secondary" 
                    onClick={() => handleJoinTournament(tournament.tournamentId)}
                    disabled={isLoading || tournament.currentParticipants >= tournament.maxParticipants || tournament.status !== 'waiting'}
                  >
                    Rejoindre
                  </ActionButton>
                </div>
              ))}
            </div>
          ) : (
            <div className="lobby-screen__empty">
              <p>Aucun tournoi disponible pour le moment</p>
              <ActionButton variant="primary" onClick={loadData} loading={isLoading}>
                Actualiser
              </ActionButton>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default LobbyScreen;