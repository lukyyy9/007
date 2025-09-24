import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTournament } from '../context/TournamentContext';
import './TournamentScreen.css';

const TournamentScreen = () => {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTournament, setNewTournament] = useState({
    name: '',
    maxPlayers: 8,
    tournamentType: 'single-elimination'
  });
  const { createTournament, joinTournament } = useTournament();

  useEffect(() => {
    loadTournaments();
  }, []);

  const loadTournaments = async () => {
    try {
      // TODO: Implement API call to get tournaments
      // For now, using mock data
      setTournaments([
        {
          id: '1',
          name: 'Tournoi du Weekend',
          status: 'waiting',
          currentPlayers: 4,
          maxPlayers: 8,
          type: 'single-elimination',
          createdBy: 'Organisateur1',
          createdAt: '2024-01-20T10:00:00Z'
        },
        {
          id: '2',
          name: 'Champion League',
          status: 'in-progress',
          currentPlayers: 8,
          maxPlayers: 8,
          type: 'double-elimination',
          createdBy: 'Admin',
          createdAt: '2024-01-19T15:30:00Z'
        },
        {
          id: '3',
          name: 'Tournoi Express',
          status: 'completed',
          currentPlayers: 4,
          maxPlayers: 4,
          type: 'single-elimination',
          createdBy: 'Joueur123',
          createdAt: '2024-01-18T20:00:00Z',
          winner: 'Champion'
        }
      ]);

      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement des tournois:', error);
      setLoading(false);
    }
  };

  const handleCreateTournament = async () => {
    try {
      // TODO: Implement API call to create tournament
      const tournament = await createTournament(newTournament);
      console.log('Tournoi créé:', tournament);
      setShowCreateModal(false);
      setNewTournament({ name: '', maxPlayers: 8, tournamentType: 'single-elimination' });
      loadTournaments();
    } catch (error) {
      console.error('Erreur lors de la création du tournoi:', error);
    }
  };

  const handleJoinTournament = async (tournamentId) => {
    try {
      await joinTournament(tournamentId);
      navigate(`/tournament/${tournamentId}`);
    } catch (error) {
      console.error('Erreur lors de la participation au tournoi:', error);
    }
  };

  const handleViewTournament = (tournamentId) => {
    navigate(`/tournament/${tournamentId}`);
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'waiting': return 'En attente';
      case 'in-progress': return 'En cours';
      case 'completed': return 'Terminé';
      default: return status;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'waiting': return 'waiting';
      case 'in-progress': return 'in-progress';
      case 'completed': return 'completed';
      default: return '';
    }
  };

  if (loading) {
    return (
      <div className="tournament-screen loading">
        <div className="loading-spinner"></div>
        <p>Chargement des tournois...</p>
      </div>
    );
  }

  return (
    <div className="tournament-screen">
      <div className="tournament-header">
        <h1>Tournois</h1>
        <button 
          className="create-tournament-button"
          onClick={() => setShowCreateModal(true)}
        >
          Créer un Tournoi
        </button>
      </div>

      <div className="tournaments-grid">
        {tournaments.map((tournament) => (
          <div key={tournament.id} className="tournament-card">
            <div className="tournament-info">
              <h3>{tournament.name}</h3>
              <div className="tournament-details">
                <div className="detail-row">
                  <span>Status:</span>
                  <span className={`status ${getStatusClass(tournament.status)}`}>
                    {getStatusText(tournament.status)}
                  </span>
                </div>
                <div className="detail-row">
                  <span>Joueurs:</span>
                  <span>{tournament.currentPlayers}/{tournament.maxPlayers}</span>
                </div>
                <div className="detail-row">
                  <span>Type:</span>
                  <span>{tournament.type === 'single-elimination' ? 'Élimination simple' : 'Double élimination'}</span>
                </div>
                <div className="detail-row">
                  <span>Organisateur:</span>
                  <span>{tournament.createdBy}</span>
                </div>
                {tournament.winner && (
                  <div className="detail-row">
                    <span>Gagnant:</span>
                    <span className="winner">{tournament.winner}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="tournament-actions">
              {tournament.status === 'waiting' && tournament.currentPlayers < tournament.maxPlayers && (
                <button 
                  className="join-button"
                  onClick={() => handleJoinTournament(tournament.id)}
                >
                  Rejoindre
                </button>
              )}
              <button 
                className="view-button"
                onClick={() => handleViewTournament(tournament.id)}
              >
                {tournament.status === 'completed' ? 'Voir résultats' : 'Voir détails'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {tournaments.length === 0 && (
        <div className="no-tournaments">
          <p>Aucun tournoi disponible pour le moment.</p>
          <button 
            className="create-tournament-button"
            onClick={() => setShowCreateModal(true)}
          >
            Créer le premier tournoi
          </button>
        </div>
      )}

      {/* Create Tournament Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Créer un Tournoi</h2>
              <button 
                className="close-button"
                onClick={() => setShowCreateModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Nom du tournoi:</label>
                <input
                  type="text"
                  value={newTournament.name}
                  onChange={e => setNewTournament({...newTournament, name: e.target.value})}
                  placeholder="Entrez le nom du tournoi"
                />
              </div>
              <div className="form-group">
                <label>Nombre maximum de joueurs:</label>
                <select
                  value={newTournament.maxPlayers}
                  onChange={e => setNewTournament({...newTournament, maxPlayers: parseInt(e.target.value)})}
                >
                  <option value={4}>4 joueurs</option>
                  <option value={8}>8 joueurs</option>
                  <option value={16}>16 joueurs</option>
                </select>
              </div>
              <div className="form-group">
                <label>Type de tournoi:</label>
                <select
                  value={newTournament.tournamentType}
                  onChange={e => setNewTournament({...newTournament, tournamentType: e.target.value})}
                >
                  <option value="single-elimination">Élimination simple</option>
                  <option value="double-elimination">Double élimination</option>
                </select>
              </div>
            </div>
            <div className="modal-actions">
              <button 
                className="cancel-button"
                onClick={() => setShowCreateModal(false)}
              >
                Annuler
              </button>
              <button 
                className="create-button"
                onClick={handleCreateTournament}
                disabled={!newTournament.name.trim()}
              >
                Créer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TournamentScreen;