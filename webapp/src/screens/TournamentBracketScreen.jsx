import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTournament } from '../context/TournamentContext';
import './TournamentBracketScreen.css';

const TournamentBracketScreen = () => {
  const { tournamentId } = useParams();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState(null);
  const [bracket, setBracket] = useState(null);
  const [loading, setLoading] = useState(true);
  const { leaveTournament } = useTournament();

  const loadTournamentData = useCallback(async () => {
    try {
      // TODO: Implement API call to get tournament and bracket data
      // For now, using mock data
      const mockTournament = {
        id: tournamentId,
        name: 'Tournoi du Weekend',
        type: 'single-elimination',
        status: 'in-progress',
        maxPlayers: 8,
        currentPlayers: 8
      };

      const mockBracket = {
        rounds: [
          {
            id: 'round-1',
            name: 'Quarts de finale',
            matches: [
              {
                id: 'match-1',
                player1: { id: '1', username: 'Joueur1' },
                player2: { id: '2', username: 'Joueur2' },
                winner: { id: '1', username: 'Joueur1' },
                status: 'completed',
                gameId: 'game-1'
              },
              {
                id: 'match-2',
                player1: { id: '3', username: 'Joueur3' },
                player2: { id: '4', username: 'Joueur4' },
                winner: { id: '3', username: 'Joueur3' },
                status: 'completed',
                gameId: 'game-2'
              },
              {
                id: 'match-3',
                player1: { id: '5', username: 'Joueur5' },
                player2: { id: '6', username: 'Joueur6' },
                winner: null,
                status: 'in-progress',
                gameId: 'game-3'
              },
              {
                id: 'match-4',
                player1: { id: '7', username: 'Joueur7' },
                player2: { id: '8', username: 'Joueur8' },
                winner: null,
                status: 'waiting',
                gameId: null
              }
            ]
          },
          {
            id: 'round-2',
            name: 'Demi-finales',
            matches: [
              {
                id: 'match-5',
                player1: { id: '1', username: 'Joueur1' },
                player2: { id: '3', username: 'Joueur3' },
                winner: null,
                status: 'waiting',
                gameId: null
              },
              {
                id: 'match-6',
                player1: null,
                player2: null,
                winner: null,
                status: 'waiting',
                gameId: null
              }
            ]
          },
          {
            id: 'round-3',
            name: 'Finale',
            matches: [
              {
                id: 'match-7',
                player1: null,
                player2: null,
                winner: null,
                status: 'waiting',
                gameId: null
              }
            ]
          }
        ]
      };

      setTournament(mockTournament);
      setBracket(mockBracket);
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement du tournoi:', error);
      setLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    if (!tournamentId) {
      navigate('/tournament');
      return;
    }

    loadTournamentData();
  }, [tournamentId, navigate, loadTournamentData]);

  const handleMatchClick = (match) => {
    if (match.gameId && match.status === 'in-progress') {
      navigate(`/game/${match.gameId}`);
    } else if (match.status === 'completed' && match.gameId) {
      // Show match details or replay
      console.log('Voir détails du match:', match);
    }
  };

  const handleLeaveTournament = () => {
    if (window.confirm('Êtes-vous sûr de vouloir quitter ce tournoi ?')) {
      leaveTournament(tournamentId);
      navigate('/tournament');
    }
  };

  if (loading) {
    return (
      <div className="tournament-bracket-screen loading">
        <div className="loading-spinner"></div>
        <p>Chargement du bracket...</p>
      </div>
    );
  }

  if (!tournament || !bracket) {
    return (
      <div className="tournament-bracket-screen error">
        <h2>Erreur</h2>
        <p>Impossible de charger le tournoi.</p>
        <button onClick={() => navigate('/tournament')}>Retour aux tournois</button>
      </div>
    );
  }

  const getMatchClass = (match) => {
    let className = 'match-card';
    if (match.status === 'completed') className += ' completed';
    if (match.status === 'in-progress') className += ' in-progress';
    if (match.status === 'waiting') className += ' waiting';
    return className;
  };

  const getPlayerClass = (player, match) => {
    if (!player) return 'player-slot empty';
    let className = 'player-slot';
    if (match.winner && match.winner.id === player.id) className += ' winner';
    return className;
  };

  return (
    <div className="tournament-bracket-screen">
      <div className="bracket-header">
        <div className="tournament-info">
          <h1>{tournament.name}</h1>
          <div className="tournament-status">
            <span className={`status ${tournament.status}`}>
              {tournament.status === 'waiting' ? 'En attente' : 
               tournament.status === 'in-progress' ? 'En cours' : 'Terminé'}
            </span>
            <span className="player-count">
              {tournament.currentPlayers}/{tournament.maxPlayers} joueurs
            </span>
          </div>
        </div>
        <div className="bracket-actions">
          <button 
            className="back-button"
            onClick={() => navigate('/tournament')}
          >
            ← Retour aux tournois
          </button>
          <button 
            className="leave-button"
            onClick={handleLeaveTournament}
          >
            Quitter le tournoi
          </button>
        </div>
      </div>

      <div className="bracket-container">
        {bracket.rounds.map((round) => (
          <div key={round.id} className="bracket-round">
            <h3 className="round-title">{round.name}</h3>
            <div className="matches-container">
              {round.matches.map((match) => (
                <div 
                  key={match.id} 
                  className={getMatchClass(match)}
                  onClick={() => handleMatchClick(match)}
                  style={{ cursor: match.gameId ? 'pointer' : 'default' }}
                >
                  <div className="match-header">
                    <span className="match-status">
                      {match.status === 'completed' ? '✓' :
                       match.status === 'in-progress' ? '⏳' : '⏸️'}
                    </span>
                  </div>
                  <div className="match-players">
                    <div className={getPlayerClass(match.player1, match)}>
                      {match.player1 ? match.player1.username : 'En attente...'}
                    </div>
                    <div className="vs-divider">VS</div>
                    <div className={getPlayerClass(match.player2, match)}>
                      {match.player2 ? match.player2.username : 'En attente...'}
                    </div>
                  </div>
                  {match.winner && (
                    <div className="match-winner">
                      Gagnant: {match.winner.username}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {tournament.status === 'completed' && bracket.rounds[bracket.rounds.length - 1].matches[0].winner && (
        <div className="tournament-winner">
          <h2>🏆 Champion du tournoi</h2>
          <div className="winner-name">
            {bracket.rounds[bracket.rounds.length - 1].matches[0].winner.username}
          </div>
        </div>
      )}
    </div>
  );
};

export default TournamentBracketScreen;