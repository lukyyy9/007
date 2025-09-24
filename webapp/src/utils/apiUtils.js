/**
 * API utility functions for the webapp
 */

/**
 * Handle API response errors
 */
export const handleApiError = (error) => {
  console.error('API Error:', error);

  if (error.message.includes('401')) {
    // Unauthorized - redirect to login
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    window.location.href = '/login';
    return;
  }

  if (error.message.includes('403')) {
    // Forbidden
    throw new Error('Access denied');
  }

  if (error.message.includes('404')) {
    throw new Error('Resource not found');
  }

  if (error.message.includes('500')) {
    throw new Error('Server error - please try again later');
  }

  throw error;
};

/**
 * Make authenticated API request
 */
export const makeAuthenticatedRequest = async (url, options = {}) => {
  const token = localStorage.getItem('authToken');
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    handleApiError(error);
  }
};

/**
 * Format error messages for UI display
 */
export const formatErrorMessage = (error) => {
  if (typeof error === 'string') {
    return error;
  }

  if (error?.message) {
    return error.message;
  }

  return 'An unexpected error occurred';
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
  const token = localStorage.getItem('authToken');
  const user = localStorage.getItem('authUser');
  return !!(token && user);
};

/**
 * Get current user from localStorage
 */
export const getCurrentUser = () => {
  try {
    const userString = localStorage.getItem('authUser');
    return userString ? JSON.parse(userString) : null;
  } catch {
    return null;
  }
};

/**
 * Clear authentication data
 */
export const clearAuth = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('authUser');
};