import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAuth } from '../context/AuthContext';

const GoogleAuthSuccess = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { login } = useAuth();

    useEffect(() => {
        const handleGoogleAuth = async () => {
            const token = searchParams.get('token');
            const userId = searchParams.get(' userId');

            if (token && userId) {
                // Store token and redirect to dashboard
                localStorage.setItem('token', token);
                localStorage.setItem('userId', userId);

                // Update auth context
                await login({ token, userId });

                // Redirect to chat
                setTimeout(() => {
                    navigate('/chat');
                }, 1000);
            } else {
                // If no token, redirect to sign in with error
                navigate('/signin?error=google_auth_failed');
            }
        };

        handleGoogleAuth();
    }, [searchParams, navigate, login]);

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
                Completing Sign In with Google...
            </Typography>
            <Typography variant="body2" color="text.secondary">
                Please wait while we set up your account
            </Typography>
        </Box>
    );
};

export default GoogleAuthSuccess;
