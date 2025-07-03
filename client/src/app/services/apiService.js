/**
 * API Service for handling all API calls to the backend
 */

// Base API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1';

/**
 * Common headers for API requests
 * @param {string} token - JWT token for authentication
 * @returns {Object} - Headers object
 */
const getHeaders = (token) => {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

/**
 * Process API response
 * @param {Response} response - Fetch API response
 * @returns {Promise} - Resolved with data or rejected with error
 */
const processResponse = async (response) => {
  if (!response.ok) {
    // Try to get error message from response
    try {
      const errorData = await response.json();
      throw new Error(errorData.message || 'API request failed');
    } catch (error) {
      throw new Error(`API request failed with status ${response.status}`);
    }
  }

  return await response.json();
};

/**
 * API methods for notebooks
 */
const notebookApi = {
  /**
   * Get all notebooks
   * @param {string} token - JWT token
   * @returns {Promise} - Notebooks data
   */
  getAllNotebooks: async (token) => {
    const response = await fetch(`${API_URL}/notebooks`, {
      headers: getHeaders(token)
    });
    
    return processResponse(response);
  },

  /**
   * Get notebook by ID
   * @param {string} token - JWT token
   * @param {string} notebookId - Notebook ID
   * @returns {Promise} - Notebook data
   */
  getNotebook: async (token, notebookId) => {
    const response = await fetch(`${API_URL}/notebooks/${notebookId}`, {
      headers: getHeaders(token)
    });
    
    return processResponse(response);
  },

  /**
   * Get raw content of a notebook
   * @param {string} token - JWT token
   * @param {string} rawContentID - Notebook ID
   * @returns {Promise} - Raw content data
   */
  getNotebookRawContent: async (token, rawContentID) => {
    if (!token || !rawContentID || rawContentID === 'home') {
      return Promise.resolve({ status: 'success', data: { rawContent: '' } });
    }
    const response = await fetch(`${API_URL}/raw-inputs/${rawContentID}`, {
      headers: getHeaders(token)
    });
    
    return processResponse(response);
  },

  /**
   * Create a new notebook
   * @param {string} token - JWT token
   * @param {Object} notebookData - Notebook data
   * @returns {Promise} - Created notebook data
   */
  createNotebook: async (token, notebookData) => {
    const response = await fetch(`${API_URL}/notebooks`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(notebookData)
    });
    
    return processResponse(response);
  },

  /**
   * Update a notebook
   * @param {string} token - JWT token
   * @param {string} notebookId - Notebook ID
   * @param {Object} notebookData - Updated notebook data
   * @returns {Promise} - Updated notebook data
   */
  updateNotebook: async (token, notebookId, notebookData) => {
    const response = await fetch(`${API_URL}/notebooks/${notebookId}`, {
      method: 'PATCH',
      headers: getHeaders(token),
      body: JSON.stringify(notebookData)
    });
    
    return processResponse(response);
  },

  /**
   * Delete a notebook
   * @param {string} token - JWT token
   * @param {string} notebookId - Notebook ID
   * @returns {Promise} - Success status
   */
  deleteNotebook: async (token, notebookId) => {
    const response = await fetch(`${API_URL}/notebooks/${notebookId}`, {
      method: 'DELETE',
      headers: getHeaders(token)
    });
    
    if (!response.ok) {
      return processResponse(response);
    }
    
    return { status: 'success' };
  }
};

/**
 * API methods for notes
 */
const noteApi = {
  /**
   * Get all notes
   * @param {string} token - JWT token
   * @param {string} [notebookId] - Optional notebook ID to filter notes
   * @returns {Promise} - Notes data
   */
  getAllNotes: async (token, notebookId) => {
    let url = `${API_URL}/notes`;
    if (notebookId && notebookId !== 'home') {
      url += `?notebook=${notebookId}`;
    }
    
    const response = await fetch(url, {
      headers: getHeaders(token)
    });
    
    return processResponse(response);
  },

  /**
   * Get note by ID
   * @param {string} token - JWT token
   * @param {string} noteId - Note ID
   * @returns {Promise} - Note data
   */
  getNote: async (token, noteId) => {
    const response = await fetch(`${API_URL}/notes/${noteId}`, {
      headers: getHeaders(token)
    });
    
    return processResponse(response);
  },

  /**
   * Create a new note
   * @param {string} token - JWT token
   * @param {Object} noteData - Note data
   * @returns {Promise} - Created note data
   */
  createNote: async (token, noteData) => {
    const response = await fetch(`${API_URL}/notes`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(noteData)
    });
    
    return processResponse(response);
  },

  /**
   * Update a note
   * @param {string} token - JWT token
   * @param {string} noteId - Note ID
   * @param {Object} noteData - Updated note data
   * @returns {Promise} - Updated note data
   */
  updateNote: async (token, noteId, noteData) => {
    const response = await fetch(`${API_URL}/notes/${noteId}`, {
      method: 'PATCH',
      headers: getHeaders(token),
      body: JSON.stringify(noteData)
    });
    
    return processResponse(response);
  },

  /**
   * Delete a note
   * @param {string} token - JWT token
   * @param {string} noteId - Note ID
   * @returns {Promise} - Success status
   */
  deleteNote: async (token, noteId) => {
    const response = await fetch(`${API_URL}/notes/${noteId}`, {
      method: 'DELETE',
      headers: getHeaders(token)
    });
    
    if (!response.ok) {
      return processResponse(response);
    }
    
    return { status: 'success' };
  },

  /**
   * Delete a Q&A entry
   * @param {string} token - JWT token
   * @param {string} noteId - Note ID
   * @param {string} qaId - Q&A ID
   * @returns {Promise} - Success status
   */
  deleteQA: async (token, noteId, qaId) => {
    const response = await fetch(`${API_URL}/notes/${noteId}/qa/${qaId}`, {
      method: 'DELETE',
      headers: getHeaders(token)
    });
    
    if (!response.ok) {
      return processResponse(response);
    }
    
    return { status: 'success' };
  }
};

/**
 * API methods for raw inputs
 */
const rawInputApi = {
  /**
   * Get all raw inputs
   * @param {string} token - JWT token
   * @param {string} [notebookId] - Optional notebook ID to filter raw inputs
   * @returns {Promise} - Raw inputs data
   */
  getAllRawInputs: async (token, notebookId) => {
    let url = `${API_URL}/raw-inputs`;
    console.log(url, "//////////////////////////////////");
    if (notebookId && notebookId !== 'home') {
      url += `?notebook=${notebookId}`;
    }
    
    const response = await fetch(url, {
      headers: getHeaders(token)
    });
    
    return processResponse(response);
  },

  /**
   * Get raw input by ID
   * @param {string} token - JWT token
   * @param {string} rawInputId - Raw input ID
   * @returns {Promise} - Raw input data
   */
  getRawInput: async (token, rawInputId) => {
    const response = await fetch(`${API_URL}/raw-inputs/${rawInputId}`, {
      headers: getHeaders(token)
    });
    
    return processResponse(response);
  },

  /**
   * Create a new raw input
   * @param {string} token - JWT token
   * @param {Object} rawInputData - Raw input data
   * @returns {Promise} - Created raw input data
   */
  createRawInput: async (token, rawInputData) => {
    const response = await fetch(`${API_URL}/raw-inputs`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(rawInputData)
    });
    
    return processResponse(response);
  },

  /**
   * Delete a raw input
   * @param {string} token - JWT token
   * @param {string} rawInputId - Raw input ID
   * @returns {Promise} - Success status
   */
  deleteRawInput: async (token, rawInputId) => {
    const response = await fetch(`${API_URL}/raw-inputs/${rawInputId}`, {
      method: 'DELETE',
      headers: getHeaders(token)
    });
    
    if (!response.ok) {
      return processResponse(response);
    }
    
    return { status: 'success' };
  }
};

/**
 * API methods for authentication
 */
const authApi = {
  /**
   * Login user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise} - Authentication data with token
   */
  login: async (email, password) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, password })
    });
    
    return processResponse(response);
  },

  /**
   * Register user
   * @param {string} name - User name
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise} - Authentication data with token
   */
  register: async (name, email, password) => {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ name, email, password })
    });
    
    return processResponse(response);
  },

  /**
   * Get current user profile
   * @param {string} token - JWT token
   * @returns {Promise} - User profile data
   */
  getProfile: async (token) => {
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: getHeaders(token)
    });
    
    return processResponse(response);
  },

  updateViewPreference: async (token, viewPreference) => {
    try {
      const response = await fetch(`${API_URL}/auth/update-view-preference`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ viewPreference })
      });

      if (!response.ok) {
        throw new Error('Failed to update view preference');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error updating view preference:', error);
      throw error;
    }
  }
};

// Export all API methods
const api = {
  notebook: notebookApi,
  note: noteApi,
  rawInput: rawInputApi,
  auth: authApi
};

export default api; 