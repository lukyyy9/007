import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ActionButton } from '../components';
import { formatErrorMessage } from '../utils';
import './LoginScreen.css';

const LoginScreen = ({ onSwitchToRegister }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await login(formData);
    } catch (err) {
      setError(formatErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-screen__container">
        <div className="login-screen__header">
          <h1 className="login-screen__title">Tactical Card Game</h1>
          <p className="login-screen__subtitle">Connectez-vous pour commencer</p>
        </div>

        <form className="login-screen__form" onSubmit={handleSubmit}>
          {error && (
            <div className="login-screen__error" role="alert">
              {error}
            </div>
          )}

          <div className="login-screen__field">
            <label htmlFor="email" className="login-screen__label">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              className="login-screen__input"
              placeholder="votre@email.com"
              disabled={isLoading}
              autoComplete="email"
              required
            />
          </div>

          <div className="login-screen__field">
            <label htmlFor="password" className="login-screen__label">
              Mot de passe
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              className="login-screen__input"
              placeholder="Votre mot de passe"
              disabled={isLoading}
              autoComplete="current-password"
              required
            />
          </div>

          <ActionButton
            type="submit"
            variant="primary"
            size="large"
            loading={isLoading}
            className="login-screen__submit"
          >
            Se connecter
          </ActionButton>
        </form>

        <div className="login-screen__footer">
          <p className="login-screen__switch">
            Pas encore de compte ?{' '}
            <button
              type="button"
              className="login-screen__link"
              onClick={onSwitchToRegister}
              disabled={isLoading}
            >
              S'inscrire
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;