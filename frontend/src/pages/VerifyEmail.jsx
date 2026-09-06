import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container,
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    CircularProgress,
    Alert
} from '@mui/material';
import { CheckCircle, Error as ErrorIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useColorMode } from '../App';

const VerifyEmail = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const { verifyEmail } = useAuth();
    const { mode } = useColorMode();
    
    const [status, setStatus] = useState('verifying'); // verifying, success, error
    const [message, setMessage] = useState('');

    useEffect(() => {
        const verify = async () => {
            if (!token) {
                setStatus('error');
                setMessage('Invalid verification link.');
                return;
            }

            const result = await verifyEmail(token);
            
            if (result.success) {
                setStatus('success');
                setMessage(result.message);
                // Redirect to login after 3 seconds
                setTimeout(() => {
                    navigate('/signin');
                }, 3000);
            } else {
                setStatus('error');
                setMessage(result.error || 'Verification failed. The link may be invalid or expired.');
            }
        };

        verify();
    }, [token, verifyEmail, navigate]);

    return (
        <Box
            sx={{
                minHeight: '100vh',
                background: mode === 'dark' 
                    ? 'linear-gradient(135deg, #222831 0%, #31363F 50%, #222831 100%)'
                    : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f8fafc 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                py: 4
            }}
        >
            <Container maxWidth="sm">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <Card className="glass" sx={{ p: 4, textAlign: 'center' }}>
                        <CardContent>
                            {status === 'verifying' && (
                                <Box>
                                    <CircularProgress size={60} sx={{ mb: 3 }} />
                                    <Typography variant="h5" gutterBottom>
                                        Verifying your email...
                                    </Typography>
                                    <Typography color="text.secondary">
                                        Please wait while we verify your account.
                                    </Typography>
                                </Box>
                            )}

                            {status === 'success' && (
                                <Box>
                                    <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
                                    <Typography variant="h4" gutterBottom>
                                        Email Verified!
                                    </Typography>
                                    <Alert severity="success" sx={{ mb: 3, justifyContent: 'center' }}>
                                        {message}
                                    </Alert>
                                    <Typography color="text.secondary" sx={{ mb: 3 }}>
                                        Redirecting to login page...
                                    </Typography>
                                    <Button 
                                        variant="contained" 
                                        onClick={() => navigate('/signin')}
                                        fullWidth
                                    >
                                        Go to Login
                                    </Button>
                                </Box>
                            )}

                            {status === 'error' && (
                                <Box>
                                    <ErrorIcon sx={{ fontSize: 80, color: 'error.main', mb: 2 }} />
                                    <Typography variant="h4" gutterBottom>
                                        Verification Failed
                                    </Typography>
                                    <Alert severity="error" sx={{ mb: 3, justifyContent: 'center' }}>
                                        {message}
                                    </Alert>
                                    <Button 
                                        variant="contained" 
                                        onClick={() => navigate('/signin')}
                                        fullWidth
                                    >
                                        Back to Login
                                    </Button>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            </Container>
        </Box>
    );
};

export default VerifyEmail;
