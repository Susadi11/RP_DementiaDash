/**
 * API Service Layer
 * Connects the React dashboard to the FastAPI backend
 */
import axios from 'axios';

// Base URL for the backend API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth tokens
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ============================================================================
// GAME API ENDPOINTS
// ============================================================================

/**
 * Get user's game statistics
 * @param {string} userId - User ID
 * @returns {Promise} User stats (total sessions, avg SAC/IES, risk level)
 */
export const getUserStats = async (userId) => {
  try {
    const response = await apiClient.get(`/game/stats/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user stats:', error);
    throw error;
  }
};

/**
 * Get user's game session history
 * @param {string} userId - User ID
 * @param {number} limit - Number of sessions to retrieve (default: 20)
 * @returns {Promise} Session history
 */
export const getSessionHistory = async (userId, limit = 20) => {
  try {
    const response = await apiClient.get(`/game/history/${userId}`, {
      params: { limit },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching session history:', error);
    throw error;
  }
};

/**
 * Get user's motor baseline
 * @param {string} userId - User ID
 * @returns {Promise} Motor baseline data
 */
export const getMotorBaseline = async (userId) => {
  try {
    const response = await apiClient.get(`/game/motor-baseline/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching motor baseline:', error);
    throw error;
  }
};

/**
 * Submit motor baseline calibration
 * @param {string} userId - User ID
 * @param {number[]} tapTimes - Array of tap times in seconds
 * @returns {Promise} Calibration result
 */
export const submitCalibration = async (userId, tapTimes) => {
  try {
    const response = await apiClient.post('/game/calibration', {
      userId,
      tapTimes,
    });
    return response.data;
  } catch (error) {
    console.error('Error submitting calibration:', error);
    throw error;
  }
};

/**
 * Submit a game session for processing
 * @param {Object} sessionData - Game session data
 * @returns {Promise} Session analysis result
 */
export const submitGameSession = async (sessionData) => {
  try {
    const response = await apiClient.post('/game/session', sessionData);
    return response.data;
  } catch (error) {
    console.error('Error submitting game session:', error);
    throw error;
  }
};

// ============================================================================
// RISK PREDICTION API ENDPOINTS
// ============================================================================

/**
 * Predict dementia risk for a user
 * @param {string} userId - User ID
 * @param {number} N - Window size (number of past sessions, default: 10)
 * @returns {Promise} Risk assessment
 */
export const predictRisk = async (userId, N = 10) => {
  try {
    const response = await apiClient.post(`/risk/predict/${userId}`, null, {
      params: { N },
    });
    return response.data;
  } catch (error) {
    console.error('Error predicting risk:', error);
    throw error;
  }
};

/**
 * Get risk prediction history for a user
 * @param {string} userId - User ID
 * @returns {Promise} Risk history
 */
export const getRiskHistory = async (userId) => {
  try {
    const response = await apiClient.get(`/risk/history/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching risk history:', error);
    throw error;
  }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Health check endpoint
 * @returns {Promise} API health status
 */
export const checkHealth = async () => {
  try {
    const response = await apiClient.get('/health');
    return response.data;
  } catch (error) {
    console.error('Error checking health:', error);
    throw error;
  }
};

/**
 * Test the model prediction (for debugging)
 * @returns {Promise} Model test result
 */
export const testModel = async () => {
  try {
    const response = await apiClient.get('/game/test-model');
    return response.data;
  } catch (error) {
    console.error('Error testing model:', error);
    throw error;
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format risk level for display
 * @param {string} riskLevel - Risk level (LOW, MEDIUM, HIGH)
 * @returns {Object} Color and label
 */
export const formatRiskLevel = (riskLevel) => {
  const riskMap = {
    LOW: { color: 'green', label: 'Low Risk', bgColor: 'bg-green-100', textColor: 'text-green-800' },
    MEDIUM: { color: 'yellow', label: 'Medium Risk', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' },
    HIGH: { color: 'red', label: 'High Risk', bgColor: 'bg-red-100', textColor: 'text-red-800' },
  };
  return riskMap[riskLevel] || { color: 'gray', label: 'Unknown', bgColor: 'bg-gray-100', textColor: 'text-gray-800' };
};

/**
 * Format date for display
 * @param {string} isoDate - ISO date string
 * @returns {string} Formatted date
 */
export const formatDate = (isoDate) => {
  const date = new Date(isoDate);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default apiClient;
