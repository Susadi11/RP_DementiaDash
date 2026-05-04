/**
 * API Service for Caregiver Operations
 * Handles all API calls to the backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL;

/**
 * Get authorization header with JWT token
 */
const getAuthHeader = () => {
  const token = localStorage.getItem('access_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

/**
 * Handle API response
 */
const handleResponse = async (response) => {
  const data = await response.json();

  if (!response.ok) {
    // If token expired, try to refresh
    if (response.status === 401) {
      const refreshed = await refreshAccessToken();
      if (!refreshed) {
        // Redirect to login if refresh failed
        localStorage.clear();
        window.location.href = '/login';
      }
      throw new Error(data.detail || 'Unauthorized');
    }
    // FastAPI validation errors return detail as an array of objects
    let errorMessage = 'API request failed';
    if (data.detail) {
      if (Array.isArray(data.detail)) {
        errorMessage = data.detail.map(e => e.msg).join(', ');
      } else {
        errorMessage = data.detail;
      }
    }
    throw new Error(errorMessage);
  }

  return data;
};

/**
 * Refresh access token using refresh token
 */
export const refreshAccessToken = async () => {
  try {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) return false;

    const response = await fetch(`${API_BASE_URL}/api/caregiver/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken })
    });

    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('access_token', data.access_token);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Token refresh failed:', error);
    return false;
  }
};

/**
 * Register a new caregiver
 */
export const registerCaregiver = async (caregiverData) => {
  const response = await fetch(`${API_BASE_URL}/api/caregiver/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(caregiverData)
  });

  return handleResponse(response);
};

/**
 * Login caregiver
 */
export const loginCaregiver = async (email, password) => {
  const response = await fetch(`${API_BASE_URL}/api/caregiver/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await handleResponse(response);

  // Store tokens and caregiver info
  if (data.access_token) {
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    localStorage.setItem('caregiver_id', data.caregiver.caregiver_id);
    localStorage.setItem('caregiver_name', `${data.caregiver.first_name} ${data.caregiver.last_name}`);

    // Store profile photo if available
    if (data.caregiver.profile_photo) {
      localStorage.setItem('profile_photo', data.caregiver.profile_photo);
    }

    // Sync patients: ensure users who have this caregiver_id set on their
    // account (e.g. linked via mobile app) appear in caregivers.patient_ids
    try {
      await fetch(`${API_BASE_URL}/api/caregiver/sync-patients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${data.access_token}` }
      });
    } catch (_) {
      // Non-critical — dashboard still works, just may not show new users yet
    }
  }

  return data;
};

/**
 * Logout caregiver
 */
export const logoutCaregiver = () => {
  localStorage.clear();
  window.location.href = '/login';
};

/**
 * Get current caregiver profile
 */
export const getCaregiverProfile = async () => {
  const response = await fetch(`${API_BASE_URL}/api/caregiver/profile`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    }
  });

  return handleResponse(response);
};

/**
 * Update caregiver profile
 */
export const updateCaregiverProfile = async (updateData) => {
  const response = await fetch(`${API_BASE_URL}/api/caregiver/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    },
    body: JSON.stringify(updateData)
  });

  return handleResponse(response);
};

/**
 * Change password
 */
export const changePassword = async (oldPassword, newPassword, confirmNewPassword) => {
  const response = await fetch(`${API_BASE_URL}/api/caregiver/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    },
    body: JSON.stringify({
      old_password: oldPassword,
      new_password: newPassword,
      confirm_new_password: confirmNewPassword
    })
  });

  return handleResponse(response);
};

/**
 * Delete caregiver account
 */
export const deleteCaregiverAccount = async () => {
  const response = await fetch(`${API_BASE_URL}/api/caregiver/profile`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    }
  });

  return handleResponse(response);
};

/**
 * Link patient to caregiver
 */
export const linkPatient = async (patientId) => {
  const response = await fetch(`${API_BASE_URL}/api/caregiver/link-patient`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    },
    body: JSON.stringify({ patient_id: patientId })
  });

  return handleResponse(response);
};

/**
 * Unlink patient from caregiver
 */
export const unlinkPatient = async (patientId) => {
  const response = await fetch(`${API_BASE_URL}/api/caregiver/unlink-patient`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    },
    body: JSON.stringify({ patient_id: patientId })
  });

  return handleResponse(response);
};

/**
 * Get linked patients
 */
export const getLinkedPatients = async () => {
  const response = await fetch(`${API_BASE_URL}/api/caregiver/patients`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    }
  });

  return handleResponse(response);
};

/**
 * Get linked patients with full details
 */
export const getLinkedPatientsDetails = async () => {
  const response = await fetch(`${API_BASE_URL}/api/caregiver/patients/details`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    }
  });

  return handleResponse(response);
};

/**
 * Get patient profile photo URL
 */
export const getPatientProfilePhotoUrl = (userId) => {
  return `${API_BASE_URL}/api/user/profile-photo/${userId}`;
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
  return !!localStorage.getItem('access_token');
};

/**
 * Get current caregiver ID
 */
export const getCurrentCaregiverId = () => {
  return localStorage.getItem('caregiver_id');
};

/**
 * Get patient chat sessions for a date range
 */
export const getPatientSessions = async (userId, startDate, endDate) => {
  const params = new URLSearchParams();
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);

  const response = await fetch(`${API_BASE_URL}/api/detection/sessions/${userId}?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    }
  });

  return handleResponse(response);
};

/**
 * Get weekly risk for a patient
 */
export const getWeeklyRisk = async (userId, weekStart) => {
  const response = await fetch(`${API_BASE_URL}/api/detection/weekly-risk?user_id=${userId}&week_start=${weekStart}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    }
  });

  return handleResponse(response);
};

/**
 * Get a specific session by ID
 */
export const getSessionById = async (sessionId) => {
  const response = await fetch(`${API_BASE_URL}/api/detection/session/${sessionId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    }
  });

  return handleResponse(response);
};

// ============================================
// CAREGIVER DASHBOARD API ENDPOINTS
// ============================================

/**
 * Get patient dashboard overview
 * Includes compliance rate, behavior analysis, cognitive risk, and recommendations
 */
export const getPatientDashboard = async (patientId) => {
  const response = await fetch(`${API_BASE_URL}/api/caregiver/dashboard/${patientId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    }
  });

  return handleResponse(response);
};

/**
 * Get ALL reminders for a patient from the reminders service
 * This is the real endpoint used by the mobile app — returns every reminder
 * regardless of status (active, completed, missed, snoozed)
 * @param {string} patientId - Patient user ID
 */
export const getUserRemindersAll = async (patientId) => {
  const response = await fetch(`${API_BASE_URL}/api/reminders/user/${patientId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    }
  });

  return handleResponse(response);
};

/**
 * Get all reminders for a patient with optional filtering
 * @param {string} patientId - Patient user ID
 * @param {Object} filters - Optional filters { status, category, days }
 */
export const getPatientReminders = async (patientId, filters = {}) => {
  const params = new URLSearchParams();
  if (filters.status) params.append('status', filters.status);
  if (filters.category) params.append('category', filters.category);
  if (filters.days) params.append('days', filters.days);

  const queryString = params.toString();
  const url = `${API_BASE_URL}/api/caregiver/reminders/${patientId}${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    }
  });

  return handleResponse(response);
};

/**
 * Get missed reminders for a patient (UI-ready format)
 * @param {string} patientId - Patient user ID
 * @param {number} days - Number of days to check (default: 7)
 */
export const getMissedReminders = async (patientId, days = 7) => {
  const response = await fetch(`${API_BASE_URL}/api/caregiver/reminders/${patientId}/missed?days=${days}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    }
  });

  return handleResponse(response);
};

/**
 * Get activity completion rates for a patient
 * @param {string} patientId - Patient user ID
 * @param {number} days - Analysis period (default: 7)
 */
export const getActivityCompletion = async (patientId, days = 7) => {
  const response = await fetch(`${API_BASE_URL}/api/caregiver/activity-completion/${patientId}?days=${days}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    }
  });

  return handleResponse(response);
};

/**
 * Get medication schedule for a patient
 * @param {string} patientId - Patient user ID
 * @param {number} days - Number of days (default: 7)
 */
export const getMedicationSchedule = async (patientId, days = 7) => {
  const response = await fetch(`${API_BASE_URL}/api/caregiver/medication-schedule/${patientId}?days=${days}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    }
  });

  return handleResponse(response);
};

/**
 * Get ML-powered behavior analysis for a patient
 * @param {string} patientId - Patient user ID
 * @param {number} days - Analysis period (default: 30)
 */
export const getBehaviorAnalysis = async (patientId, days = 30) => {
  const response = await fetch(`${API_BASE_URL}/api/caregiver/behavior-analysis/${patientId}?days=${days}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    }
  });

  return handleResponse(response);
};

/**
 * Get comprehensive weekly report for a patient
 * @param {string} patientId - Patient user ID
 * @param {string} endDate - End date (YYYY-MM-DD), defaults to today
 */
export const getWeeklyReport = async (patientId, endDate = null) => {
  const url = endDate
    ? `${API_BASE_URL}/api/caregiver/weekly-report/${patientId}?end_date=${endDate}`
    : `${API_BASE_URL}/api/caregiver/weekly-report/${patientId}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    }
  });

  return handleResponse(response);
};

/**
 * Get the full weekly reminder report from the reminders service
 * @param {string} userId - Patient user ID
 */
export const getReminderWeeklyReport = async (userId) => {
  const response = await fetch(`${API_BASE_URL}/api/reminders/reports/weekly/${userId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    }
  });

  return handleResponse(response);
};

/**
 * Get caregiver alerts for a patient
 * @param {string} patientId - Patient user ID
 * @param {Object} filters - Optional filters { priority, resolved, days }
 */
export const getCaregiverAlerts = async (patientId, filters = {}) => {
  const params = new URLSearchParams();
  if (filters.priority) params.append('priority', filters.priority);
  if (filters.resolved !== undefined) params.append('resolved', filters.resolved);
  if (filters.days) params.append('days', filters.days);

  const queryString = params.toString();
  const url = `${API_BASE_URL}/api/caregiver/alerts/${patientId}${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    }
  });

  return handleResponse(response);
};

/**
 * Get alerts across ALL linked patients for the logged-in caregiver (for navbar bell)
 * @param {number} days - Number of days to look back (default: 3)
 */
export const getMyAlerts = async (days = 3) => {
  const response = await fetch(`${API_BASE_URL}/api/caregiver/my-alerts?days=${days}&resolved=false`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() }
  });
  return handleResponse(response);
};

/**
 * Get snoozed reminders for a patient
 * @param {string} patientId - Patient user ID
 * @param {number} days - Number of days to look back (default: 7)
 */
export const getSnoozedReminders = async (patientId, days = 7) => {
  const response = await fetch(`${API_BASE_URL}/api/caregiver/reminders/${patientId}/snoozed?days=${days}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    }
  });

  return handleResponse(response);
};

/**
 * Get all reminders grouped by status (active / completed / missed / snoozed)
 * Ideal for a tabbed/filtered reminder list in the dashboard
 * @param {string} patientId - Patient user ID
 * @param {number} days - Number of days to look back (default: 7)
 */
export const getAllRemindersGrouped = async (patientId, days = 7) => {
  const response = await fetch(`${API_BASE_URL}/api/caregiver/reminders/${patientId}/grouped?days=${days}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    }
  });

  return handleResponse(response);
};

/**
 * Get comprehensive adherence + final risk score using ML models
 * Returns adherence_score, cognitive_risk_score, wellness_score, risk_level,
 * behavior_trend, category_breakdown, urgency, and recommendations
 * @param {string} patientId - Patient user ID
 * @param {number} days - Analysis period (default: 30)
 */
export const getAdherenceRiskScore = async (patientId, days = 30) => {
  const response = await fetch(`${API_BASE_URL}/api/caregiver/adherence-risk/${patientId}?days=${days}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    }
  });

  return handleResponse(response);
};

/**
 * Get all reminders across all linked patients, grouped by status
 * Uses the caregiver dashboard endpoint (no patient_id needed)
 * @param {number} days - Number of days to look back (default: 7)
 */
export const getCaregiverDashboardReminders = async (days = 7) => {
  const response = await fetch(`${API_BASE_URL}/api/caregiver/dashboard/reminders/all?days=${days}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    }
  });

  return handleResponse(response);
};

/**
 * Resolve a caregiver alert
 * @param {string} alertId - Alert ID
 */
export const resolveAlert = async (alertId) => {
  const response = await fetch(`${API_BASE_URL}/api/caregiver/alerts/${alertId}/resolve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    }
  });

  return handleResponse(response);
};

// ============================================
// MMSE ASSESSMENT API ENDPOINTS
// ============================================

/**
 * Get all patients with their assessments for a specific caregiver
 * @param {string} caregiverId - Caregiver ID
 */
export const getCaregiverPatientsMMSE = async (caregiverId) => {
  const response = await fetch(`${API_BASE_URL}/api/mmse/caregiver/${caregiverId}/patients`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    }
  });

  return handleResponse(response);
};

/**
 * Get all assessments for a specific patient
 * @param {string} userId - Patient User ID
 */
export const getPatientAssessmentsMMSE = async (userId) => {
  const response = await fetch(`${API_BASE_URL}/api/mmse/user/${userId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    }
  });

  return handleResponse(response);
};

// ============================================
// GAME API ENDPOINTS
// ============================================

/**
 * Get game statistics for a patient
 * @param {string} userId - Patient User ID
 */
export const getGameStats = async (userId) => {
  const response = await fetch(`${API_BASE_URL}/game/stats/${userId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    }
  });

  return handleResponse(response);
};

/**
 * Get game session history for a patient
 * @param {string} userId - Patient User ID
 * @param {number} limit - Max sessions to return (default: 20)
 */
export const getGameHistory = async (userId, limit = 20) => {
  const response = await fetch(`${API_BASE_URL}/game/history/${userId}?limit=${limit}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    }
  });

  return handleResponse(response);
};

// ============================================
// RISK PREDICTION API ENDPOINTS
// ============================================

/**
 * Trigger a standalone risk prediction using the last N game sessions
 * Calls POST /risk/predict/{userId}
 * Returns: { user_id, window_size, features_used, prediction: { prob_low, prob_medium, prob_high, label, risk_score_0_100 }, created_at }
 * @param {string} userId - Patient User ID
 * @param {number} n - Window size (number of past sessions, default: 10)
 */
export const getRiskPrediction = async (userId, n = 10) => {
  const response = await fetch(`${API_BASE_URL}/risk/predict/${userId}?N=${n}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    }
  });

  return handleResponse(response);
};

/**
 * Get the full history of standalone risk predictions for a patient
 * Calls GET /risk/history/{userId}
 * Returns: { user_id, total_predictions, history: [...] }
 * @param {string} userId - Patient User ID
 */
export const getRiskHistory = async (userId) => {
  const response = await fetch(`${API_BASE_URL}/risk/history/${userId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    }
  });

  return handleResponse(response);
};

/**
 * Get daily final scores for a patient
 * @param {string} patientId - Patient user ID
 * @param {number} days - Number of days to retrieve (default: 7)
 */
export const getDailyScores = async (patientId, days = 7) => {
  const response = await fetch(`${API_BASE_URL}/api/caregiver/daily-scores/${patientId}?days=${days}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    }
  });

  return handleResponse(response);
};

/**
 * Get crisis alerts for a patient
 * @param {string} patientId - Patient user ID
 * @param {Object} filters - Optional filters { acknowledged }
 */
export const getCrisisAlerts = async (patientId, filters = {}) => {
  const params = new URLSearchParams();
  if (filters.acknowledged !== undefined) params.append('acknowledged', filters.acknowledged);

  const queryString = params.toString();
  const url = `${API_BASE_URL}/api/caregiver/crisis-alerts/${patientId}${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    }
  });

  return handleResponse(response);
};

/**
 * Acknowledge a crisis alert
 * @param {string} alertId - Crisis alert ID
 */
export const acknowledgeCrisisAlert = async (alertId) => {
  const response = await fetch(`${API_BASE_URL}/api/caregiver/crisis-alerts/${alertId}/acknowledge`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    }
  });

  return handleResponse(response);
};
