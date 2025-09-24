import React from 'react';
import './ActionButton.css';

const ActionButton = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'medium', 
  disabled = false,
  loading = false,
  className = '',
  ...props 
}) => {
  return (
    <button
      className={`action-button action-button--${variant} action-button--${size} ${loading ? 'action-button--loading' : ''} ${className}`}
      onClick={onClick}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span className="action-button__spinner" />}
      <span className={`action-button__content ${loading ? 'action-button__content--hidden' : ''}`}>
        {children}
      </span>
    </button>
  );
};

export default ActionButton;