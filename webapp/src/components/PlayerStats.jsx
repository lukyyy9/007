import React from 'react';
import './PlayerStats.css';

const PlayerStats = ({ player, isCurrentPlayer = false }) => {
  if (!player) return null;

  const {
    username,
    health = 0,
    maxHealth = 6,
    cardsInHand = 0,
    wins = 0,
    losses = 0,
    avatar
  } = player;

  const healthPercentage = (health / maxHealth) * 100;
  const winRate = wins + losses > 0 ? Math.round((wins / (wins + losses)) * 100) : 0;

  return (
    <div className={`player-stats ${isCurrentPlayer ? 'player-stats--current' : ''}`}>
      <div className="player-stats__header">
        <div className="player-stats__avatar">
          {avatar ? (
            <img src={avatar} alt={username} />
          ) : (
            <div className="player-stats__avatar-placeholder">
              {username.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="player-stats__info">
          <h3 className="player-stats__name">{username}</h3>
          <div className="player-stats__record">
            {wins}W - {losses}L ({winRate}%)
          </div>
        </div>
      </div>
      
      <div className="player-stats__health">
        <div className="player-stats__health-label">
          Santé: {health}/{maxHealth}
        </div>
        <div className="player-stats__health-bar">
          <div 
            className="player-stats__health-fill" 
            style={{ width: `${healthPercentage}%` }}
          />
        </div>
      </div>
      
      <div className="player-stats__cards">
        <span className="player-stats__cards-count">{cardsInHand}</span>
        <span className="player-stats__cards-label">cartes</span>
      </div>
    </div>
  );
};

export default PlayerStats;