import React, { useEffect, useState } from 'react';
import { 
    Box, Typography, Paper, TextField, Button, Grid, CircularProgress, 
    Alert, Dialog, DialogTitle, DialogContent, DialogActions, Chip 
} from '@mui/material';
import { Save, Lock, RestartAlt } from '@mui/icons-material';
import api from '../../utils/api';

const PromptEngineering = () => {
    const [prompts, setPrompts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);
    
    // Security States
    const [isVerified, setIsVerified] = useState(false);
    const [secretCode, setSecretCode] = useState('');
    const [showAuthDialog, setShowAuthDialog] = useState(true);
    const [authError, setAuthError] = useState('');

    const fetchPrompts = async () => {
        try {
            setLoading(true);
            const res = await api.get('/admin/prompts');
            setPrompts(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isVerified) {
            fetchPrompts();
        }
    }, [isVerified]);

    const handleVerify = async () => {
        try {
            // Validate code with backend
            const res = await api.post('/admin/verify-secret', { code: secretCode });
            if (res.data.success) {
                setIsVerified(true);
                setShowAuthDialog(false);
            }
        } catch (err) {
            setAuthError('Invalid Secret Code. Access Denied.');
        }
    };

    const handleSeed = async () => {
        if (!window.confirm('Are you sure? This will overwrite existing system prompts with defaults.')) return;
        try {
            setLoading(true);
            await api.post('/admin/seed-prompts');
            await fetchPrompts();
            setMessage({ type: 'success', text: 'System prompts reset to defaults!' });
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to seed prompts.' });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (id, field, value) => {
        setPrompts(prompts.map(p => p._id === id ? { ...p, [field]: value } : p));
    };

    const handleSave = async (id) => {
        setSaving(true);
        const prompt = prompts.find(p => p._id === id);
        try {
            await api.put(`/admin/prompts/${id}`, { content: prompt.content, description: prompt.description });
            setMessage({ type: 'success', text: `Updated ${prompt.key} successfully!` });
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to update prompt.' });
        } finally {
            setSaving(false);
            setTimeout(() => setMessage(null), 3000);
        }
    };

    // Auth Dialog Component
    if (!isVerified) {
        return (
            <Dialog open={true} maxWidth="xs" fullWidth disableEscapeKeyDown>
                <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold' }}>
                    <Lock sx={{ fontSize: 40, color: 'primary.main', mb: 1, display: 'block', mx: 'auto' }} />
                    Restricted Access
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" align="center" sx={{ mb: 3 }}>
                        Prompt Engineering allows altering the core AI behavior. Please enter the Admin Secret Code to proceed.
                    </Typography>
                    <TextField
                        autoFocus
                        fullWidth
                        type="password"
                        label="Secret Code"
                        value={secretCode}
                        onChange={(e) => setSecretCode(e.target.value)}
                        error={!!authError}
                        helperText={authError}
                    />
                </DialogContent>
                <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
                    <Button variant="contained" onClick={handleVerify} size="large" sx={{ px: 4 }}>
                        Unlock Console
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }

    return (
        <Box maxWidth={1200} mx="auto">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                 <Box>
                    <Typography variant="h4" fontWeight="bold">Prompt Engineering</Typography>
                    <Typography variant="body1" color="text.secondary">
                         Fine-tune AI personas and behavior. Changes affect the live system immediately.
                    </Typography>
                 </Box>
                 <Button 
                    variant="outlined" 
                    color="warning" 
                    startIcon={<RestartAlt />} 
                    onClick={handleSeed}
                >
                    Reset Defaults
                 </Button>
            </Box>

             {message && <Alert severity={message.type} sx={{ mb: 3 }}>{message.text}</Alert>}

             {loading ? <CircularProgress /> : (
                 <Grid container spacing={3}>
                     {prompts.length === 0 && <Alert severity="info" sx={{width: '100%'}}>No prompts found. Click "Reset Defaults" to initialize.</Alert>}
                     
                     {prompts.map((prompt) => (
                         <Grid item xs={12} key={prompt._id}>
                             <Paper sx={{ p: 4, borderRadius: 3, border: '1px solid config.borderColor' }}>
                                 <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Box>
                                        <Typography variant="h6" fontWeight="bold" color="primary">{prompt.key}</Typography>
                                        <Typography variant="subtitle2" fontWeight="bold">{prompt.title}</Typography>
                                    </Box>
                                    <Chip label="Core System" size="small" color="default" />
                                 </Box>
                                 
                                 <TextField
                                     fullWidth
                                     label="Description (Admin Internal Use)"
                                     value={prompt.description || ''}
                                     onChange={(e) => handleChange(prompt._id, 'description', e.target.value)}
                                     sx={{ mb: 2 }}
                                     size="small"
                                 />

                                 <TextField
                                     fullWidth
                                     multiline
                                     minRows={6}
                                     maxRows={20}
                                     label="System Prompt Content"
                                     value={prompt.content}
                                     onChange={(e) => handleChange(prompt._id, 'content', e.target.value)}
                                     sx={{ 
                                         mb: 2, 
                                         fontFamily: 'monospace',
                                         bgcolor: 'action.hover'
                                     }}
                                 />

                                 <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                                    <Typography variant="caption" sx={{ alignSelf: 'center', mr: 'auto', color: 'text.secondary' }}>
                                        Last Updated: {new Date(prompt.lastUpdated).toLocaleString()}
                                    </Typography>
                                    <Button 
                                         variant="contained" 
                                         startIcon={<Save />} 
                                         onClick={() => handleSave(prompt._id)}
                                         disabled={saving}
                                     >
                                         {saving ? 'Saving...' : 'Update Live Prompt'}
                                     </Button>
                                 </Box>
                             </Paper>
                         </Grid>
                     ))}
                 </Grid>
             )}
        </Box>
    );
};

export default PromptEngineering;
