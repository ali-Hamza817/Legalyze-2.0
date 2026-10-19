import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
    baseURL: `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api`,
    headers: {
        'Content-Type': 'application/json'
    },
    timeout: 300000 // 5 minutes timeout for long RAG operations
});

// Request interceptor - Add JWT token to requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// ---- Automatic access-token refresh on 401 ----
const AUTH_BASE = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api`;
let refreshPromise = null; // single-flight: all queued 401s share one refresh call

async function refreshAccessToken() {
    const rt = localStorage.getItem('refreshToken');
    if (!rt) throw new Error('No refresh token');
    if (!refreshPromise) {
        refreshPromise = axios
            .post(`${AUTH_BASE}/auth/refresh`, { refreshToken: rt })
            .then((res) => {
                const data = (res.data && res.data.data) || {};
                if (data.token) localStorage.setItem('token', data.token);
                if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
                return data.token;
            })
            .finally(() => { refreshPromise = null; });
    }
    return refreshPromise;
}

function forceLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    const path = window.location.pathname;
    if (!path.includes('/signin') && !path.includes('/signup')) {
        window.location.href = '/signin';
    }
}

// Response interceptor - transparently refresh the access token on expiry, then retry
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const original = error.config || {};
        if (error.response) {
            const { status, data } = error.response;
            const url = String(original.url || '');
            const isAuthCall = url.includes('/auth/login') || url.includes('/auth/refresh') || url.includes('/auth/signup');

            // Access token expired/invalid → try a one-time refresh, then replay the request.
            if (status === 401 && !original._retry && !isAuthCall && localStorage.getItem('refreshToken')) {
                original._retry = true;
                try {
                    const newToken = await refreshAccessToken();
                    if (newToken) {
                        original.headers = original.headers || {};
                        original.headers.Authorization = `Bearer ${newToken}`;
                        return api(original);
                    }
                } catch (e) {
                    forceLogout();
                }
                forceLogout(); // refresh returned no token → session is dead
            }

            return Promise.reject({
                message: (data && data.message) || 'An error occurred',
                errors: (data && data.errors) || [],
                status
            });
        } else if (error.request) {
            return Promise.reject({
                message: 'No response from server. Please check your connection.',
                status: 0
            });
        } else {
            return Promise.reject({
                message: error.message || 'An unexpected error occurred',
                status: 0
            });
        }
    }
);

// Auth API endpoints
export const authAPI = {
    // Sign up new user
    signup: async (userData) => {
        const response = await api.post('/auth/signup', userData);
        return response.data;
    },

    // Login user
    login: async (credentials) => {
        const response = await api.post('/auth/login', credentials);
        return response.data;
    },

    // Get current user
    getCurrentUser: async () => {
        const response = await api.get('/auth/me');
        return response.data;
    },

    // Logout user
    logout: async () => {
        const response = await api.post('/auth/logout');
        return response.data;
    },

    // Verify email
    verifyEmail: async (token) => {
        const response = await api.get(`/auth/verify-email/${token}`);
        return response.data;
    },

    // Resend verification email
    resendVerification: async (email) => {
        const response = await api.post('/auth/resend-verification', { email });
        return response.data;
    },

    // Get system settings (including announcements)
    getSystemSettings: async () => {
        const response = await api.get('/auth/system-settings');
        return response.data;
    }
};

// Chat API endpoints
export const chatAPI = {
    // Send message and get AI response
    sendMessage: async (message, conversationId = null, documentIds = [], files = []) => {
        const response = await api.post('/chat', {
            message,
            conversationId,
            documentIds,
            files
        });
        return response.data;
    },

    // Get all conversations
    getConversations: async () => {
        const response = await api.get('/chat/conversations');
        return response.data;
    },

    // Get conversation by ID
    getConversation: async (id) => {
        const response = await api.get(`/chat/conversations/${id}`);
        return response.data;
    },

    // Delete conversation
    deleteConversation: async (id) => {
        const response = await api.delete(`/chat/conversations/${id}`);
        return response.data;
    }
};

// International Law API endpoints (Legalyze 2.0 engine)
export const internationalAPI = {
    // Ask the Legalyze 2.0 international-law engine a question.
    ask: async (question) => {
        const response = await api.post('/international', { question });
        return response.data;
    },

    // Check whether the 2.0 engine service is running.
    health: async () => {
        const response = await api.get('/international/health');
        return response.data;
    }
};

// Document API endpoints
export const documentAPI = {
    // Upload document
    upload: async (file, chatId, onProgress) => {
        const formData = new FormData();
        formData.append('document', file);
        if (chatId) {
            formData.append('chatId', chatId);
        }

        const response = await api.post('/documents/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            },
            onUploadProgress: (progressEvent) => {
                if (onProgress) {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    onProgress(percentCompleted);
                }
            }
        });
        return response.data;
    },

    // Get all documents
    list: async () => {
        const response = await api.get('/documents');
        return response.data;
    },

    // Get document by ID
    get: async (id) => {
        const response = await api.get(`/documents/${id}`);
        return response.data;
    },

    // Delete document
    delete: async (id) => {
        const response = await api.delete(`/documents/${id}`);
        return response.data;
    },

    // Get signed download URL
    getDownloadUrl: async (id) => {
        const response = await api.get(`/documents/${id}/download`);
        return response.data;
    },

    // Constitutional Compliance check on uploaded legal document
    constitutionalComplianceCheck: async (file, onProgress) => {
        const formData = new FormData();
        formData.append('document', file);

        const response = await api.post('/constitutional-compliance/check', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            },
            timeout: 600000, // 10 minutes for constitutional analysis
            onUploadProgress: (progressEvent) => {
                if (onProgress) {
                    const percent = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
                    onProgress(percent);
                }
            }
        });
        return response.data;
    }
};

// Contact API endpoints
export const contactAPI = {
    // Send contact form message
    sendMessage: async (contactData) => {
        const response = await api.post('/contact', contactData);
        return response.data;
    },

    // Subscribe to newsletter
    subscribe: async (email) => {
        const response = await api.post('/contact/subscribe', { email });
        return response.data;
    }
};

// Document Generation API endpoints
// Document Generation API endpoints
export const generateAPI = {
    // Generate House Rent Agreement
    generateRentAgreement: async (formData) => {
        const response = await api.post('/generate/rent-agreement', formData);
        return response.data;
    },

    // Generic Document Generation (handles all types)
    generateDocument: async (type, formData) => {
        // Use the smart generation endpoint which handles all types
        const response = await api.post('/smart-generate/generate', {
            documentType: type,
            fieldOverrides: formData,
            allowMissingFields: true
        });
        return response; // Return full response as DocumentForm expects response.data
    },

    // Get all generated documents
    getDocuments: async () => {
        const response = await api.get('/generate/documents');
        return response.data;
    },

    // Get specific document
    getDocument: async (id) => {
        const response = await api.get(`/generate/documents/${id}`);
        return response.data;
    },

    // Delete document
    deleteDocument: async (id) => {
        const response = await api.delete(`/generate/documents/${id}`);
        return response.data;
    }
};

// Smart Generation API endpoints
export const smartGenerateAPI = {
    // Analyze user's extracted facts for a document type
    analyze: async (documentType) => {
        const response = await api.post('/smart-generate/analyze', { documentType });
        return response.data;
    },

    // Generate document with auto-filled fields
    generate: async (documentType, fieldOverrides = {}, allowMissingFields = false) => {
        const response = await api.post('/smart-generate/generate', {
            documentType,
            fieldOverrides,
            allowMissingFields
        });
        return response.data;
    },

    // Get user's extracted facts
    getFacts: async () => {
        const response = await api.get('/smart-generate/facts');
        return response.data;
    },

    // Update user's extracted facts
    updateFacts: async (extractedFacts) => {
        const response = await api.put('/smart-generate/facts', { extractedFacts });
        return response.data;
    },

    // Clear user's extracted facts
    clearFacts: async () => {
        const response = await api.delete('/smart-generate/facts');
        return response.data;
    }
};

export default api;
