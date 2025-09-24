import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { useAuth } from '../context/AuthContext';
import './GameBoardScreen.css';

const GameBoardScreen = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const [gameState, setGameState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState(null);
  const { user } = useAuth();
  const { leaveGame } = useGame();

  const loadGameBoard = useCallback(async () => {
    try {
      // TODO: Implement API call to get game board state
      // For now, using mock data
      setGameState({
        gameId,
        currentTurn: 'player1',
        players: {
          player1: {
            id: user?.id,
            username: user?.username,
            health: 6,
            maxHealth: 6,
            hand: [
              { id: '1', name: 'Attaque Rapide', cost: 2, damage: 3 },
              { id: '2', name: 'Défense', cost: 1, defense: 2 },
              { id: '3', name: 'Sort de Feu', cost: 3, damage: 4 },
            ]
          },
          player2: {
            id: '2',
            username: 'Adversaire',
            health: 5,
            maxHealth: 6,
            handSize: 3
          }
        },
        turnTimeRemaining: 25,
        phase: 'planning' // planning, action, resolution
      });

      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement du plateau de jeu:', error);
      setLoading(false);
    }
  }, [gameId, user?.id, user?.username]);

  useEffect(() => {
    if (!gameId) {
      navigate('/');
      return;
    }

    loadGameBoard();
  }, [gameId, navigate, loadGameBoard]);

  const handleCardSelect = (card) => {
    if (gameState.currentTurn === 'player1') {
      setSelectedCard(selectedCard?.id === card.id ? null : card);
    }
  };

  const handlePlayCard = () => {
    if (selectedCard && gameState.currentTurn === 'player1') {
      // TODO: Emit socket event to play card
      console.log('Playing card:', selectedCard);
      setSelectedCard(null);
    }
  };

  const handleForfeit = () => {
    if (window.confirm('Êtes-vous sûr de vouloir abandonner cette partie ?')) {
      leaveGame();
      navigate('/');
    }
  };

  if (loading) {
    return (
      <div className="game-board-screen loading">
        <div className="loading-spinner"></div>
        <p>Chargement du plateau de jeu...</p>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="game-board-screen error">
        <h2>Erreur</h2>
        <p>Impossible de charger la partie.</p>
        <button onClick={() => navigate('/')}>Retour au lobby</button>
      </div>
    );
  }

  const currentPlayer = gameState.players.player1;
  const opponent = gameState.players.player2;
  const isMyTurn = gameState.currentTurn === 'player1';

  return (
    <div className="game-board-screen">
      {/* Opponent Section */}
      <div className="opponent-section">
        <div className="player-info">
          <div className="player-name">{opponent.username}</div>
          <div className="health-bar">
            <div className="health-text">{opponent.health}/{opponent.maxHealth}</div>
            <div className="health-bar-bg">
              <div 
                className="health-bar-fill" 
                style={{ width: `${(opponent.health / opponent.maxHealth) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
        <div className="opponent-hand">
          {Array.from({ length: opponent.handSize }, (_, i) => (
            <div key={i} className="card card-back">?</div>
          ))}
        </div>
      </div>

      {/* Game Info */}
      <div className="game-info">
        <div className="turn-info">
          <div className={`turn-indicator ${isMyTurn ? 'my-turn' : 'opponent-turn'}`}>
            {isMyTurn ? 'Votre tour' : `Tour de ${opponent.username}`}
          </div>
          <div className="timer">
            <span className="timer-text">{gameState.turnTimeRemaining}s</span>
            <div className="timer-bar">
              <div 
                className="timer-fill" 
                style={{ width: `${(gameState.turnTimeRemaining / 30) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
        <div className="phase-indicator">
          Phase: {gameState.phase === 'planning' ? 'Planification' : 
                  gameState.phase === 'action' ? 'Action' : 'Résolution'}
        </div>
      </div>

      {/* Player Section */}
      <div className="player-section">
        <div className="player-info">
          <div className="player-name">{currentPlayer.username} (Vous)</div>
          <div className="health-bar">
            <div className="health-text">{currentPlayer.health}/{currentPlayer.maxHealth}</div>
            <div className="health-bar-bg">
              <div 
                className="health-bar-fill player" 
                style={{ width: `${(currentPlayer.health / currentPlayer.maxHealth) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
        
        <div className="player-hand">
          {currentPlayer.hand.map((card) => (
            <div 
              key={card.id} 
              className={`card ${selectedCard?.id === card.id ? 'selected' : ''} ${!isMyTurn ? 'disabled' : ''}`}
              onClick={() => handleCardSelect(card)}
            >
              <div className="card-name">{card.name}</div>
              <div className="card-cost">Coût: {card.cost}</div>
              {card.damage && <div className="card-damage">Dégâts: {card.damage}</div>}
              {card.defense && <div className="card-defense">Défense: {card.defense}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Action Bar */}
      <div className="action-bar">
        <button className="forfeit-button" onClick={handleForfeit}>
          Abandonner
        </button>
        
        {selectedCard && isMyTurn && (
          <button className="play-card-button" onClick={handlePlayCard}>
            Jouer {selectedCard.name}
          </button>
        )}
        
        {!isMyTurn && (
          <div className="waiting-message">
            En attente du tour de l'adversaire...
          </div>
        )}
      </div>
    </div>
  );
};

export default GameBoardScreen;