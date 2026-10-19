import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAuth } from '../context/AuthContext';

const GoogleAuthSuccess = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { loginWithToken } = useAuth();
    const [message, setMessage] = useState('Completing Sign In with Google...');
    const handled = useRef(false);

    useEffect(() => {
        // React 18 StrictMode double-invokes effects in dev; guard against a double run.
        if (handled.current) return;
        handled.current = true;

        const token = searchParams.get('token');
        const refreshToken = searchParams.get('refreshToken');
        const oauthError = searchParams.get('error');

        if (oauthError || !token) {
            navigate('/signin?error=google_auth_failed', { replace: true });
            return;
        }

        (async () => {
            // The access token resolves the user via /api/auth/me; the refresh token
            // keeps the session alive after the access token expires.
            const result = await loginWithToken(token, refreshToken);
            if (result.success) {
                navigate('/chat', { replace: true });
            } else {
                setMessage('Sign in failed. Redirecting...');
                navigate('/signin?error=google_auth_failed', { replace: true });
            }
        })();
    }, [searchParams, navigate, loginWithToken]);

    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            gap: 3
        }}>
            <CircularProgress size={60} />
            <Typography variant="h5" fontWeight={600}>
                {message}
            </Typography>
            <Typography variant="body2" color="text.secondary">
                Please wait while we set up your account
            </Typography>
        </Box>
    );
};

export default GoogleAuthSuccess;
