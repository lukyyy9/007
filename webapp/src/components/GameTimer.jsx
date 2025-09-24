import React from 'react';
import './GameTimer.css';

const GameTimer = ({ timeLeft, totalTime = 30, isActive = false }) => {
  const percentage = (timeLeft / totalTime) * 100;
  const isLowTime = timeLeft <= 10;
  const isVeryLowTime = timeLeft <= 5;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : secs.toString();
  };

  return (
    <div className={`game-timer ${isActive ? 'game-timer--active' : ''} ${isLowTime ? 'game-timer--low' : ''} ${isVeryLowTime ? 'game-timer--very-low' : ''}`}>
      <div className="game-timer__background">
        <div 
          className="game-timer__fill" 
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="game-timer__text">
        {formatTime(timeLeft)}
      </div>
    </div>
  );
};

export default GameTimer;