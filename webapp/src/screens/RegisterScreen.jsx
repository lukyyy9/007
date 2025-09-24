import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ActionButton } from '../components';
import { formatErrorMessage } from '../utils';
import './RegisterScreen.css';

const RegisterScreen = ({ onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { register } = useAuth();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const validateForm = () => {
    if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
      return 'Veuillez remplir tous les champs';
    }

    if (formData.username.length < 3) {
      return 'Le nom d\'utilisateur doit contenir au moins 3 caractères';
    }

    if (formData.password.length < 6) {
      return 'Le mot de passe doit contenir au moins 6 caractères';
    }

    if (formData.password !== formData.confirmPassword) {
      return 'Les mots de passe ne correspondent pas';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return 'Veuillez entrer un email valide';
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await register({
        username: formData.username,
        email: formData.email,
        password: formData.password
      });
    } catch (err) {
      setError(formatErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-screen">
      <div className="register-screen__container">
        <div className="register-screen__header">
          <h1 className="register-screen__title">Tactical Card Game</h1>
          <p className="register-screen__subtitle">Créez votre compte</p>
        </div>

        <form className="register-screen__form" onSubmit={handleSubmit}>
          {error && (
            <div className="register-screen__error" role="alert">
              {error}
            </div>
          )}

          <div className="register-screen__field">
            <label htmlFor="username" className="register-screen__label">
              Nom d'utilisateur
            </label>
            <input
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleInputChange}
              className="register-screen__input"
              placeholder="Votre nom d'utilisateur"
              disabled={isLoading}
              autoComplete="username"
              required
            />
          </div>

          <div className="register-screen__field">
            <label htmlFor="email" className="register-screen__label">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              className="register-screen__input"
              placeholder="votre@email.com"
              disabled={isLoading}
              autoComplete="email"
              required
            />
          </div>

          <div className="register-screen__field">
            <label htmlFor="password" className="register-screen__label">
              Mot de passe
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              className="register-screen__input"
              placeholder="Votre mot de passe"
              disabled={isLoading}
              autoComplete="new-password"
              required
            />
          </div>

          <div className="register-screen__field">
            <label htmlFor="confirmPassword" className="register-screen__label">
              Confirmer le mot de passe
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className="register-screen__input"
              placeholder="Confirmez votre mot de passe"
              disabled={isLoading}
              autoComplete="new-password"
              required
            />
          </div>

          <ActionButton
            type="submit"
            variant="primary"
            size="large"
            loading={isLoading}
            className="register-screen__submit"
          >
            S'inscrire
          </ActionButton>
        </form>

        <div className="register-screen__footer">
          <p className="register-screen__switch">
            Déjà un compte ?{' '}
            <button
              type="button"
              className="register-screen__link"
              onClick={onSwitchToLogin}
              disabled={isLoading}
            >
              Se connecter
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterScreen;