import React, { useEffect, useState } from 'react';
import { Grid, Paper, Typography, Box, Card, CardContent, CircularProgress } from '@mui/material';
import { PeopleAlt, Gavel, Storage, TrendingUp } from '@mui/icons-material';
import api from '../../utils/api'; // Use centralized api instance

const StatCard = ({ title, value, icon, color }) => (
    <Card sx={{ height: '100%', borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden' }}>
        <Box sx={{ position: 'absolute', right: -20, top: -20, opacity: 0.1, transform: 'rotate(15deg)' }}>
            {React.cloneElement(icon, { sx: { fontSize: 120, color } })}
        </Box>
        <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: `${color}20`, color: color, mr: 2 }}>
                    {icon}
                </Box>
                <Typography variant="subtitle2" color="text.secondary" fontWeight="bold" textTransform="uppercase">
                    {title}
                </Typography>
            </Box>
            <Typography variant="h3" fontWeight="800" sx={{ mb: 1 }}>
                {value}
            </Typography>
            <Typography variant="body2" color="success.main" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <TrendingUp fontSize="small" /> Live Data
            </Typography>
        </CardContent>
    </Card>
);

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        users: { total: 0, active: 0 },
        knowledgeBase: { total: 0, pending: 0 },
        apiUsage: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/admin/stats');
                setStats(res.data);
            } catch (err) {
                console.error('Error fetching admin stats:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;

    return (
        <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
                System Overview
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Welcome back, Super Admin. Here's what's happening today.
            </Typography>

            <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard title="Total Users" value={stats.users.total} icon={<PeopleAlt fontSize="large" />} color="#133E87" />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard title="Active Users" value={stats.users.active} icon={<Gavel fontSize="large" />} color="#954C2E" />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard title="Knowledge Base" value={stats.knowledgeBase.total} icon={<Storage fontSize="large" />} color="#1A5F7A" />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard title="API Requests" value={stats.apiUsage.toLocaleString()} icon={<TrendingUp fontSize="large" />} color="#2E8B57" />
                </Grid>
            </Grid>

            {/* Add more widgets here later */}
        </Box>
    );
};

export default AdminDashboard;
