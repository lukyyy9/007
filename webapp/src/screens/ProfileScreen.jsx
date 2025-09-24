import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './ProfileScreen.css';

const ProfileScreen = () => {
  const [stats, setStats] = useState({
    gamesPlayed: 0,
    gamesWon: 0,
    tournamentsPlayed: 0,
    tournamentsWon: 0,
    winRate: 0,
  });
  const [recentMatches, setRecentMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();

  useEffect(() => {
    loadUserStats();
    loadRecentMatches();
  }, []);

  const loadUserStats = async () => {
    try {
      // TODO: Implement API call to get user stats
      // For now, using mock data
      setStats({
        gamesPlayed: 15,
        gamesWon: 8,
        tournamentsPlayed: 3,
        tournamentsWon: 1,
        winRate: 53
      });
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
      setLoading(false);
    }
  };

  const loadRecentMatches = async () => {
    try {
      // TODO: Implement API call to get recent matches
      // For now, using mock data
      setRecentMatches([
        { id: '1', opponent: 'Joueur1', result: 'Victoire', date: '2024-01-15' },
        { id: '2', opponent: 'Joueur2', result: 'Défaite', date: '2024-01-14' },
        { id: '3', opponent: 'Joueur3', result: 'Victoire', date: '2024-01-13' },
      ]);
    } catch (error) {
      console.error('Erreur lors du chargement des matches récents:', error);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      logout();
    }
  };

  if (loading) {
    return (
      <div className="profile-screen loading">
        <div className="loading-spinner"></div>
        <p>Chargement du profil...</p>
      </div>
    );
  }

  return (
    <div className="profile-screen">
      <div className="profile-header">
        <div className="profile-info">
          <h1>Profil de {user?.username}</h1>
          <p className="user-email">{user?.email}</p>
        </div>
        <button className="logout-button" onClick={handleLogout}>
          Déconnexion
        </button>
      </div>

      <div className="profile-content">
        <div className="stats-section">
          <h2>Statistiques</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-number">{stats.gamesPlayed}</div>
              <div className="stat-label">Parties jouées</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{stats.gamesWon}</div>
              <div className="stat-label">Victoires</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{stats.winRate}%</div>
              <div className="stat-label">Taux de victoire</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{stats.tournamentsPlayed}</div>
              <div className="stat-label">Tournois</div>
            </div>
          </div>
        </div>

        <div className="recent-matches-section">
          <h2>Matches récents</h2>
          <div className="matches-list">
            {recentMatches.length > 0 ? (
              recentMatches.map((match) => (
                <div key={match.id} className="match-item">
                  <div className="match-opponent">{match.opponent}</div>
                  <div className={`match-result ${match.result.toLowerCase()}`}>
                    {match.result}
                  </div>
                  <div className="match-date">{match.date}</div>
                </div>
              ))
            ) : (
              <p className="no-matches">Aucun match récent</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileScreen;