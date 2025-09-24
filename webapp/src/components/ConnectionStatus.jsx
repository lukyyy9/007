import React from 'react';
import './ConnectionStatus.css';

const ConnectionStatus = ({ isConnected, reconnectAttempts = 0 }) => {
  const getStatusInfo = () => {
    if (isConnected) {
      return {
        status: 'connected',
        text: 'Connecté',
        className: 'connection-status--connected'
      };
    }
    
    if (reconnectAttempts > 0) {
      return {
        status: 'reconnecting',
        text: `Reconnexion... (${reconnectAttempts})`,
        className: 'connection-status--reconnecting'
      };
    }
    
    return {
      status: 'disconnected',
      text: 'Déconnecté',
      className: 'connection-status--disconnected'
    };
  };

  const statusInfo = getStatusInfo();

  return (
    <div className={`connection-status ${statusInfo.className}`}>
      <div className="connection-status__indicator" />
      <span className="connection-status__text">{statusInfo.text}</span>
    </div>
  );
};

export default ConnectionStatus;