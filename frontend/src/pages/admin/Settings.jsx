import React, { useState, useEffect } from 'react';
import { 
    Box, Typography, Paper, Grid, TextField, Button, 
    Tabs, Tab, Alert, Card, InputAdornment, Switch, FormControlLabel,
    Divider, IconButton
} from '@mui/material';
import { 
    Palette, Settings as SettingsIcon, ColorLens, 
    Save, Security, Campaign, Announcement, Layers
} from '@mui/icons-material';
import { useColorMode } from '../../context/ThemeContext';
import { generatePalette } from '../../styles/themeConfig';
import api from '../../utils/api';

const TabPanel = (props) => {
    const { children, value, index, ...other } = props;
    return (
        <div role="tabpanel" hidden={value !== index} {...other}>
            {value === index && (<Box sx={{ p: 3 }}>{children}</Box>)}
        </div>
    );
};

const Settings = () => {
    const [tabIndex, setTabIndex] = useState(0);
    const { setCustomTheme } = useColorMode();
    const [message, setMessage] = useState(null);

    // Advanced Theme State
    const [themeConfig, setThemeConfig] = useState({
        primary: '#1976d2',
        secondary: '#9c27b0',
        accent: '#ed6c02',
        background: '#f5f5f5',
        surface: '#ffffff',
        textMain: '#000000'
    });

    // System Settings State
    const [systemSettings, setSystemSettings] = useState({
        globalAnnouncement: { message: '', isActive: false, type: 'info' },
        maintenanceMode: false,
        disabledThemes: []
    });

    // Load System Settings
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await api.get('/admin/system-settings');
                // Ensure we have default structure even if DB is fresh
                setSystemSettings(prev => ({ ...prev, ...res.data }));
            } catch (err) { console.error('Failed to load settings'); }
        };
        fetchSettings();
    }, []);

    const handleTabChange = (event, newValue) => {
        setTabIndex(newValue);
    };

    const handleGenerateAdvancedTheme = () => {
        const palette = generatePalette(themeConfig, 'My Pro Theme');
        setCustomTheme(palette);
        setMessage({ type: 'success', text: 'Advanced Theme Applied!' });
    };

    const handleSaveSystemSettings = async () => {
        try {
            await api.put('/admin/system-settings', systemSettings);
            setMessage({ type: 'success', text: 'System Configuration Saved!' });
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to save settings' });
        }
    };

    const ColorInput = ({ label, field }) => (
        <TextField
            fullWidth
            label={label}
            value={themeConfig[field]}
            onChange={(e) => setThemeConfig({ ...themeConfig, [field]: e.target.value })}
            sx={{ mb: 2 }}
            InputProps={{
                startAdornment: (
                    <InputAdornment position="start">
                        <Box sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: themeConfig[field], border: '1px solid #ddd' }} />
                    </InputAdornment>
                ),
            }}
        />
    );

    return (
        <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>Settings</Typography>
            
            <Paper sx={{ width: '100%', mb: 2, borderRadius: 2 }}>
                <Tabs value={tabIndex} onChange={handleTabChange} indicatorColor="primary" textColor="primary">
                    <Tab icon={<Palette />} label="Theme Studio" iconPosition="start" />
                    <Tab icon={<SettingsIcon />} label="System Controls" iconPosition="start" />
                </Tabs>
            </Paper>

            {message && <Alert severity={message.type} sx={{ mb: 3 }} onClose={() => setMessage(null)}>{message.text}</Alert>}

            {/* THEME STUDIO TAB */}
            <TabPanel value={tabIndex} index={0}>
                <Grid container spacing={4}>
                    <Grid item xs={12} md={7}>
                        <Paper sx={{ p: 4, borderRadius: 3 }}>
                            <Typography variant="h6" fontWeight="bold" gutterBottom>
                                <ColorLens sx={{ mr: 1, verticalAlign: 'middle' }} />
                                Advanced Theme Studio
                            </Typography>
                            <Typography variant="body2" color="text.secondary" mb={3}>
                                Define every aspect of your brand's identity.
                            </Typography>

                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}><ColorInput label="Primary Color" field="primary" /></Grid>
                                <Grid item xs={12} sm={6}><ColorInput label="Secondary Color" field="secondary" /></Grid>
                                <Grid item xs={12} sm={6}><ColorInput label="Accent Color" field="accent" /></Grid>
                                <Grid item xs={12} sm={6}><ColorInput label="Main Text Color" field="textMain" /></Grid>
                                <Grid item xs={12} sm={6}><ColorInput label="Background Color" field="background" /></Grid>
                                <Grid item xs={12} sm={6}><ColorInput label="Surface / Card Color" field="surface" /></Grid>
                            </Grid>

                            <Button 
                                variant="contained" 
                                size="large" 
                                fullWidth 
                                startIcon={<Save />}
                                onClick={handleGenerateAdvancedTheme}
                                sx={{ mt: 2 }}
                            >
                                Apply Custom Theme
                            </Button>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} md={5}>
                        <Typography variant="subtitle2" gutterBottom>Live Preview</Typography>
                        <Card sx={{ 
                            p: 3, 
                            bgcolor: themeConfig.surface, 
                            borderRadius: 2,
                            border: `1px solid ${themeConfig.textMain}22` 
                        }}>
                            <Typography variant="h5" sx={{ color: themeConfig.primary, mb: 2, fontWeight: 'bold' }}>
                                Headings Look Like This
                            </Typography>
                            <Typography sx={{ color: themeConfig.textMain, mb: 3 }}>
                                This is standard body text. It sits on the surface color. 
                                <span style={{ color: themeConfig.secondary, fontWeight: 'bold' }}> Secondary highlights appear here.</span>
                            </Typography>
                            
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button variant="contained" sx={{ bgcolor: themeConfig.primary, color: '#fff' }}>Primary</Button>
                                <Button variant="contained" sx={{ bgcolor: themeConfig.secondary, color: '#fff' }}>Secondary</Button>
                                <Button variant="outlined" sx={{ 
                                    borderColor: themeConfig.accent, 
                                    color: themeConfig.accent 
                                }}>Accent</Button>
                            </Box>

                            <Box sx={{ mt: 3, p: 2, bgcolor: themeConfig.background, borderRadius: 1 }}>
                                <Typography sx={{ color: themeConfig.textMain }}>
                                    App Background Area
                                </Typography>
                            </Box>
                        </Card>
                    </Grid>
                </Grid>
            </TabPanel>

            {/* SYSTEM CONTROLS TAB */}
            <TabPanel value={tabIndex} index={1}>
                <Grid container spacing={4}>
                    {/* Announcements */}
                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 4, borderRadius: 3, height: '100%' }}>
                            <Typography variant="h6" fontWeight="bold" gutterBottom>
                                <Campaign sx={{ mr: 1, verticalAlign: 'middle' }} />
                                Global Announcement
                            </Typography>
                            <Typography variant="body2" color="text.secondary" mb={3}>
                                Broadcast a message to all users (e.g., Downtime, Maintenance).
                            </Typography>
                            
                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                label="Announcement Message"
                                value={systemSettings.globalAnnouncement?.message || ''}
                                onChange={(e) => setSystemSettings(prev => ({
                                    ...prev,
                                    globalAnnouncement: { ...prev.globalAnnouncement, message: e.target.value }
                                }))}
                                sx={{ mb: 2 }}
                            />
                            
                            <FormControlLabel
                                control={
                                    <Switch 
                                        checked={systemSettings.globalAnnouncement?.isActive || false}
                                        onChange={(e) => setSystemSettings(prev => ({
                                            ...prev,
                                            globalAnnouncement: { ...prev.globalAnnouncement, isActive: e.target.checked }
                                        }))}
                                    />
                                }
                                label="Show Announcement Banner"
                            />
                        </Paper>
                    </Grid>

                    {/* Maintenance & Security */}
                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 4, borderRadius: 3, height: '100%' }}>
                            <Typography variant="h6" fontWeight="bold" gutterBottom>
                                <Security sx={{ mr: 1, verticalAlign: 'middle' }} />
                                Core Operations
                            </Typography>
                            <Typography variant="body2" color="text.secondary" mb={3}>
                                Critical system-wide controls. Use with caution.
                            </Typography>

                            <Box sx={{ p: 2, border: '1px solid #ff4444', borderRadius: 2, bgcolor: '#fff0f0' }}>
                                <FormControlLabel
                                    control={
                                        <Switch 
                                            color="error"
                                            checked={systemSettings.maintenanceMode || false}
                                            onChange={(e) => setSystemSettings(prev => ({
                                                ...prev,
                                                maintenanceMode: e.target.checked
                                            }))}
                                        />
                                    }
                                    label={<Typography fontWeight="bold" color="error">Enable Maintenance Mode</Typography>}
                                />
                                <Typography variant="caption" display="block" color="error">
                                    This will block access/login for all non-admin users.
                                </Typography>
                            </Box>
                        </Paper>
                    </Grid>

                    {/* Save Button */}
                    <Grid item xs={12}>
                         <Button 
                            variant="contained" 
                            size="large" 
                            startIcon={<Save />}
                            onClick={handleSaveSystemSettings}
                            sx={{ px: 4, py: 1.5 }}
                        >
                            Save System Configuration
                        </Button>
                    </Grid>
                </Grid>
            </TabPanel>
        </Box>
    );
};

export default Settings;
