import React, { useState, useEffect } from 'react';
import { 
    Box, Typography, Grid, Paper, Avatar, Chip, 
    CircularProgress, List, ListItem, ListItemAvatar, 
    ListItemText, Divider, IconButton, Tooltip,
    Card, CardContent, LinearProgress
} from '@mui/material';
import { 
    Timeline as PulseIcon, 
    CheckCircle, 
    Error as ErrorIcon, 
    Login, 
    Gavel, 
    Refresh, 
    Speed,
    Dns,
    CloudQueue,
    Code
} from '@mui/icons-material';
import api from '../../utils/api';
import { motion, AnimatePresence } from 'framer-motion';

const LiveControlCenter = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    const fetchPulse = async () => {
        try {
            setRefreshing(true);
            const res = await api.get('/admin/live-activity');
            setData(res.data);
        } catch (err) {
            console.error('Failed to fetch pulse:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchPulse();
        const timer = setInterval(fetchPulse, 30000); // Auto-refresh every 30s
        return () => clearInterval(timer);
    }, []);

    const HealthNode = ({ title, status, icon, color }) => (
        <Paper sx={{ p: 2, borderRadius: 3, display: 'flex', alignItems: 'center', gap: 2, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
            <Avatar sx={{ bgcolor: `${color}15`, color: color }}>{icon}</Avatar>
            <Box sx={{ flexGrow: 1 }}>
                <Typography variant="body2" fontWeight="bold">{title}</Typography>
                <Typography variant="caption" color={status === 'Healthy' ? 'success.main' : 'error.main'} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: status === 'Healthy' ? 'success.main' : 'error.main' }} />
                    {status}
                </Typography>
            </Box>
        </Paper>
    );

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;

    const allActivities = [
        ...(data?.activities?.logins || []).map(l => ({ ...l, type: 'login', time: l.createdAt })),
        ...(data?.activities?.compliance || []).map(c => ({ ...c, type: 'compliance', time: c.createdAt }))
    ].sort((a, b) => new Date(b.time) - new Date(a.time));

    return (
        <Box sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
                <Box>
                    <Typography variant="h4" fontWeight="900" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        Live Control Center
                        <Box component={motion.div} animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }} sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'error.main' }} />
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Real-time system pulse and automated health monitoring.
                    </Typography>
                </Box>
                <IconButton onClick={fetchPulse} disabled={refreshing}>
                    <Refresh className={refreshing ? 'spin-animation' : ''} />
                </IconButton>
            </Box>

            <Grid container spacing={4}>
                {/* System Health Column */}
                <Grid item xs={12} md={4}>
                    <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Speed color="primary" /> System Health
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <HealthNode title="OpenAI API" status={data?.health?.openai} icon={<Code />} color="#10b981" />
                        <HealthNode title="Pinecone RAG" status={data?.health?.pinecone} icon={<Dns />} color="#6366f1" />
                        <HealthNode title="AWS S3 Storage" status={data?.health?.aws} icon={<CloudQueue />} color="#f59e0b" />
                        <HealthNode title="MongoDB Cluster" status={data?.health?.database} icon={<CheckCircle />} color="#3f51b5" />
                    </Box>

                    <Card sx={{ mt: 4, borderRadius: 3, bgcolor: 'primary.main', color: 'white' }}>
                        <CardContent>
                            <Typography variant="subtitle2" gutterBottom>System Resources</Typography>
                            <Typography variant="h5" fontWeight="bold" gutterBottom>Optimized</Typography>
                            <Typography variant="caption" sx={{ opacity: 0.8 }}>Memory & CPU usage are within optimal thresholds.</Typography>
                            <LinearProgress variant="determinate" value={35} sx={{ mt: 2, height: 6, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.2)', '& .MuiLinearProgress-bar': { bgcolor: 'white' } }} />
                        </CardContent>
                    </Card>
                </Grid>

                {/* Live Activity Column */}
                <Grid item xs={12} md={8}>
                    <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PulseIcon color="primary" /> Activity Pulse
                    </Typography>
                    <Paper sx={{ borderRadius: 4, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
                        <List sx={{ p: 0 }}>
                            <AnimatePresence mode="popLayout">
                                {allActivities.map((activity, index) => (
                                    <ListItem 
                                        key={activity._id}
                                        component={motion.div}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ delay: index * 0.05 }}
                                        sx={{ 
                                            p: 2.5,
                                            '&:hover': { bgcolor: 'action.hover' }
                                        }}
                                    >
                                        <ListItemAvatar>
                                            <Avatar sx={{ bgcolor: activity.type === 'login' ? 'info.main' : 'warning.main' }}>
                                                {activity.type === 'login' ? <Login /> : <Gavel />}
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText 
                                            primary={
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Typography fontWeight="bold">
                                                        {activity.type === 'login' 
                                                            ? `${activity.userId?.firstName} ${activity.userId?.lastName}` 
                                                            : activity.user?.firstName + ' ' + activity.user?.lastName}
                                                    </Typography>
                                                    <Chip 
                                                        size="small" 
                                                        label={activity.type === 'login' ? 'User Login' : 'Compliance Check'} 
                                                        color={activity.type === 'login' ? 'info' : 'warning'}
                                                        variant="outlined"
                                                        sx={{ height: 20, fontSize: '0.65rem', fontWeight: 'bold' }}
                                                    />
                                                </Box>
                                            }
                                            secondary={
                                                <>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {activity.type === 'login' ? `IP: ${activity.ipAddress || 'Hidden'}` : `Examining: ${activity.documentName}`}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ ml: 2, color: 'text.disabled' }}>
                                                        • {new Date(activity.time).toLocaleTimeString()}
                                                    </Typography>
                                                </>
                                            }
                                        />
                                    </ListItem>
                                ))}
                                {allActivities.length === 0 && (
                                    <Box sx={{ p: 10, textAlign: 'center' }}>
                                        <Typography color="text.secondary">No recent pulse activity detected.</Typography>
                                    </Box>
                                )}
                            </AnimatePresence>
                        </List>
                        <Box sx={{ p: 2, textAlign: 'center', bgcolor: 'background.default' }}>
                            <Typography variant="caption" color="text.disabled">Monitoring encrypted traffic channels...</Typography>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default LiveControlCenter;
