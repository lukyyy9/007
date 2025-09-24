import React, { createContext, useContext, useReducer, useEffect } from 'react';

const AuthContext = createContext();

const initialState = {
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case 'RESTORE_SESSION':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    restoreSession();
  }, []);

  const restoreSession = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Use localStorage instead of AsyncStorage for web
      const token = localStorage.getItem('authToken');
      const userString = localStorage.getItem('authUser');
      
      if (token && userString) {
        const user = JSON.parse(userString);
        dispatch({
          type: 'RESTORE_SESSION',
          payload: { user, token }
        });
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    } catch (error) {
      console.error('Error restoring session:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const login = async (credentials) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Import AuthAPI dynamically to avoid circular dependencies
      const { default: AuthAPI } = await import('../services/AuthAPI');
      const authAPI = new AuthAPI();
      
      const response = await authAPI.login(credentials);
      
      // Store in localStorage
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('authUser', JSON.stringify(response.user));
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: response
      });
      
      return response;
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const { default: AuthAPI } = await import('../services/AuthAPI');
      const authAPI = new AuthAPI();
      
      const response = await authAPI.register(userData);
      
      // Store in localStorage
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('authUser', JSON.stringify(response.user));
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: response
      });
      
      return response;
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const logout = () => {
    // Clear localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    
    dispatch({ type: 'LOGOUT' });
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    restoreSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};