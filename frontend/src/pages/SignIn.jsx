import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Box,
    Card,
    CardContent,
    Typography,
    TextField,
    Button,
    Divider,
    Grid,
    IconButton,
    InputAdornment,
    Checkbox,
    FormControlLabel,
    useTheme,
    Alert,
    CircularProgress
} from '@mui/material';
import {
    Visibility,
    VisibilityOff,
    ArrowBack,
    Brightness4,
    Brightness7
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { fadeIn } from '../utils/animations';
import { isValidEmail } from '../utils/helpers';
import { useColorMode } from '../App';
import ThemeSwitcher from '../components/ThemeSwitcher';
import { useAuth } from '../context/AuthContext';

// Social Icons Components
const GoogleIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
);

const AppleIcon = () => (
    <svg width="20" height="20" viewBox="0 0 384 512" xmlns="http://www.w3.org/2000/svg">
        <path fill="#fff" d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 52.3-11.4 69.5-34.3z" />
    </svg>
);

const FacebookIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="#1877F2" />
    </svg>
);

const LinkedInIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" fill="#0077B5" />
    </svg>
);

const SignIn = () => {
    const navigate = useNavigate();
    const theme = useTheme();
    const { mode, toggleColorMode } = useColorMode();
    const { login, loading } = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [errors, setErrors] = useState({});
    const [apiError, setApiError] = useState('');
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        if (errors[e.target.name]) {
            setErrors({
                ...errors,
                [e.target.name]: ''
            });
        }
        setApiError(''); // Clear API error when user types
    };

    const validateForm = () => {
        const newErrors = {};
        if (!isValidEmail(formData.email)) newErrors.email = 'Invalid email address';
        if (!formData.password) newErrors.password = 'Password is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setApiError('');
        
        if (validateForm()) {
            const result = await login(formData.email, formData.password);
            
            if (result.success) {
                // If user is admin/superadmin, redirect to admin dashboard
                if (result.user.role === 'admin' || result.user.role === 'superadmin') {
                    navigate('/admin/analytics');
                } else {
                    navigate('/chat');
                }
            } else {
                // Show error message
                const errorMsg = result.error || 'Login failed. Please try again.';
                setApiError(errorMsg);
                
                // If maintenance mode, we can optionally clear form or redirect, but showing the alert is enough.
                if (result.status === 503 || errorMsg.includes('maintenance')) {
                    setApiError('We apologize we are currently in the maintenance phase please try again later');
                }
            }
        }
    };

    const handleSocialSignIn = (provider) => {
        const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
        if (provider === 'Google') {
            // Redirect to Google OAuth
            window.location.href = `${API_BASE}/api/auth/google`;
        } else {
            // Other social logins not yet implemented
            setApiError(`${provider} sign-in is coming soon. Please use email/password or Google for now.`);
        }
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                background: theme.palette.background.default,
                display: 'flex',
                alignItems: 'center',
                py: 4,
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            {/* Animated background */}
            <Box
                sx={{
                    position: 'absolute',
                    top: '20%',
                    left: '10%',
                    width: '300px',
                    height: '300px',
                    background: 'radial-gradient(circle, rgba(6, 182, 212, 0.2) 0%, transparent 70%)',
                    borderRadius: '50%',
                    filter: 'blur(60px)',
                    animation: 'float 8s ease-in-out infinite'
                }}
            />

            <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={fadeIn}
                >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <IconButton
                            onClick={() => navigate('/')}
                            sx={{ color: 'text.secondary' }}
                        >
                            <ArrowBack /> <Typography sx={{ ml: 1 }}>Back to Home</Typography>
                        </IconButton>
                        <ThemeSwitcher variant="icon" />
                    </Box>

                    <Card className="glass" sx={{ p: 4 }}>
                        <CardContent>
                            <Typography
                                variant="h3"
                                align="center"
                                gutterBottom
                                fontWeight={700}
                            >
                                Welcome Back
                            </Typography>
                            <Typography
                                variant="body1"
                                align="center"
                                color="text.secondary"
                                sx={{ mb: 4 }}
                            >
                                Sign in to continue to Legalyzing
                            </Typography>

                            <Grid container spacing={2} sx={{ mb: 3 }} justifyContent="center">
                                <Grid item xs={12}>
                                    <Button
                                        fullWidth
                                        variant="outlined"
                                        onClick={() => handleSocialSignIn('Google')}
                                        sx={{
                                            py: 1.5,
                                            borderColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
                                            '&:hover': {
                                                borderColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.2)',
                                                background: mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
                                            }
                                        }}
                                    >
                                        <Box sx={{ mr: 1, display: 'flex' }}>
                                            <GoogleIcon />
                                        </Box>
                                        Sign in with Google
                                    </Button>
                                </Grid>
                            </Grid>

                            <Divider sx={{ my: 3 }}>
                                <Typography color="text.secondary">OR</Typography>
                            </Divider>

                            {/* Error Alert */}
                            {apiError && (
                                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setApiError('')}>
                                    {apiError}
                                </Alert>
                            )}

                            {/* Email/Password Sign In Form */}
                            <form onSubmit={handleSubmit}>
                                <TextField
                                    fullWidth
                                    label="Email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    error={!!errors.email}
                                    helperText={errors.email}
                                    required
                                    sx={{ mb: 2 }}
                                />

                                <TextField
                                    fullWidth
                                    label="Password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    error={!!errors.password}
                                    helperText={errors.password}
                                    required
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    edge="end"
                                                >
                                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                                </IconButton>
                                            </InputAdornment>
                                        )
                                    }}
                                />

                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={rememberMe}
                                                onChange={(e) => setRememberMe(e.target.checked)}
                                                color="primary"
                                            />
                                        }
                                        label="Remember me"
                                    />
                                    <Button
                                        sx={{ textTransform: 'none' }}
                                        onClick={() => alert('Password reset functionality coming soon!')}
                                    >
                                        Forgot Password?
                                    </Button>
                                </Box>

                                <Button
                                    type="submit"
                                    fullWidth
                                    variant="contained"
                                    size="large"
                                    disabled={loading}
                                    sx={{
                                        mt: 3,
                                        py: 1.5,
                                        background: mode === 'dark' ? '#76ABAE' : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                                        '&:hover': {
                                            background: mode === 'dark' ? '#5F8A8D' : 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                                        }
                                    }}
                                >
                                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
                                </Button>
                            </form>

                            <Typography align="center" sx={{ mt: 3 }} color="text.secondary">
                                Don't have an account?{' '}
                                <Button
                                    onClick={() => navigate('/signup')}
                                    sx={{ textTransform: 'none', fontWeight: 600 }}
                                >
                                    Sign Up
                                </Button>
                            </Typography>
                        </CardContent>
                    </Card>
                </motion.div>
            </Container>
        </Box>
    );
};

export default SignIn;
