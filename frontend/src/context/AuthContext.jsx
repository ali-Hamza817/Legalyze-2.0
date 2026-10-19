import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../utils/api';

const AuthContext = createContext({});

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Initialize auth state from localStorage with validation
    useEffect(() => {
        const initAuth = async () => {
            const storedToken = localStorage.getItem('token');
            const storedUser = localStorage.getItem('user');

            if (storedToken) {
                // Optimistically set state for fast UI
                setToken(storedToken);
                if (storedUser && storedUser !== 'undefined') {
                    try {
                        setUser(JSON.parse(storedUser));
                    } catch (e) {
                        console.error('Failed to parse stored user:', e);
                        localStorage.removeItem('user');
                    }
                }

                // Verify with backend
                try {
                    const response = await authAPI.getCurrentUser();
                    const freshUser = response?.data?.user;
                    if (response.success && freshUser) {
                        setUser(freshUser);
                        // Optional: Update stored user with fresh data
                        localStorage.setItem('user', JSON.stringify(freshUser));
                    } else {
                        throw new Error('Verification failed');
                    }
                } catch (err) {
                    console.error('Session validation failed:', err);
                    
                    // CRITICAL FIX: Only logout if explicit 401/403 (Auth failed)
                    // Do NOT logout on 500 (Server Error) or 503 (Maintenance)
                    if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                        console.warn('Authentication invalid, logging out...');
                        setToken(null);
                        setUser(null);
                        localStorage.removeItem('token');
                        localStorage.removeItem('refreshToken');
                        localStorage.removeItem('user');
                    } else {
                        console.warn('Transient error during session check, keeping session alive:', err.message);
                        // Keep the optimistic user state
                    }
                }
            }
            setLoading(false);
        };

        initAuth();
    }, []);

    // Login function
    const login = async (email, password) => {
        try {
            setError(null);
            setLoading(true);

            const response = await authAPI.login({ email, password });

            if (response.success) {
                const { user: userData, token: userToken, refreshToken } = response.data;

                // Store in state
                setUser(userData);
                setToken(userToken);

                // Store in localStorage (short-lived access token + long-lived refresh token)
                localStorage.setItem('token', userToken);
                if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
                localStorage.setItem('user', JSON.stringify(userData));

                return { success: true, user: userData };
            }
        } catch (err) {
            const errorMessage = err.message || 'Login failed. Please try again.';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    // Login with an existing JWT (used by the Google OAuth callback page).
    // The backend has already verified the Google identity and issued this token;
    // we just need to hydrate the user profile from /api/auth/me.
    const loginWithToken = async (authToken, refreshToken) => {
        try {
            setError(null);
            setLoading(true);

            if (!authToken) {
                throw new Error('No authentication token received');
            }

            localStorage.setItem('token', authToken);
            if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
            setToken(authToken);

            const response = await authAPI.getCurrentUser();
            const userData = response?.data?.user;

            if (response.success && userData) {
                setUser(userData);
                localStorage.setItem('user', JSON.stringify(userData));
                return { success: true, user: userData };
            }

            throw new Error('Could not load your profile');
        } catch (err) {
            // Roll back partial state so the app doesn't get stuck "half logged in"
            setToken(null);
            setUser(null);
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            const errorMessage = err.message || 'Google sign-in failed. Please try again.';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    // Signup function
    // Signup function
    const signup = async (userData) => {
        try {
            setError(null);
            setLoading(true);

            const response = await authAPI.signup(userData);

            if (response.success) {
                // Don't auto-login, just return success
                return { success: true, message: response.message };
            }
        } catch (err) {
            const errorMessage = err.message || 'Signup failed. Please try again.';
            const errors = err.errors || [];
            setError(errorMessage);
            return { success: false, error: errorMessage, errors };
        } finally {
            setLoading(false);
        }
    };

    // Logout function
    const logout = async () => {
        try {
            // Call logout API (optional, for logging purposes)
            await authAPI.logout();
        } catch (err) {
            console.error('Logout API error:', err);
        } finally {
            // Clear state
            setUser(null);
            setToken(null);
            setError(null);

            // Clear localStorage
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
        }
    };

    // Verify email function
    const verifyEmail = async (token) => {
        try {
            setLoading(true);
            const response = await authAPI.verifyEmail(token);
            return { success: true, message: response.message };
        } catch (err) {
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    };

    // Resend verification email function
    const resendVerification = async (email) => {
        try {
            setLoading(true);
            const response = await authAPI.resendVerification(email);
            return { success: true, message: response.message };
        } catch (err) {
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    };

    // Check if user is authenticated
    const isAuthenticated = () => {
        return !!token && !!user;
    };

    // Refresh user data (sync restrictions, etc)
    const refreshUser = async () => {
        try {
            const response = await authAPI.getCurrentUser();
            const freshUser = response?.data?.user;
            if (response.success && freshUser) {
                setUser(freshUser);
                localStorage.setItem('user', JSON.stringify(freshUser));
                return { success: true };
            }
        } catch (err) {
            console.error('Failed to refresh user:', err);
            return { success: false };
        }
    };

    const value = {
        user,
        token,
        loading,
        error,
        login,
        loginWithToken,
        signup,
        logout,
        verifyEmail,
        resendVerification,
        isAuthenticated,
        setError,
        refreshUser
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
