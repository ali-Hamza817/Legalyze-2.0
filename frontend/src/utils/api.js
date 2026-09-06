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

// Response interceptor - Handle errors globally
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response) {
            // Server responded with error status
            const { status, data } = error.response;

            // Handle specific status codes
            if (status === 401) {
                // Unauthorized - clear token and redirect to login
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                
                // STOPPING AUTO-REDIRECT TO DEBUG LOGIN LOOP
                // if (!window.location.pathname.includes('/signin') && 
                //     !window.location.pathname.includes('/signup')) {
                //     window.location.href = '/signin';
                // }
                console.warn('Unauthorized (401) received. Session cleared.');
            }

            // Return formatted error
            return Promise.reject({
                message: data.message || 'An error occurred',
                errors: data.errors || [],
                status
            });
        } else if (error.request) {
            // Request made but no response received
            return Promise.reject({
                message: 'No response from server. Please check your connection.',
                status: 0
            });
        } else {
            // Something else happened
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
