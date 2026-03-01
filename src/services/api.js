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
    throw new Error(data.detail || 'API request failed');
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
