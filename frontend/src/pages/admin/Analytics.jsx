import React, { useState, useEffect } from 'react';
import { 
    Box, 
    Typography, 
    Grid, 
    Card, 
    CardContent, 
    CircularProgress, 
    useTheme, 
    MenuItem, 
    Select, 
    FormControl, 
    InputLabel,
    Paper,
    Avatar,
    IconButton
} from '@mui/material';
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    AreaChart, Area, BarChart, Bar, Legend, PieChart, Pie, Cell
} from 'recharts';
import { 
    TrendingUp, Group, Storage, ChatBubbleOutline, 
    MoreVert, ArrowUpward, CalendarToday 
} from '@mui/icons-material';
import api from '../../utils/api';
import { motion } from 'framer-motion';

const Analytics = () => {
    const theme = useTheme();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [timeRange, setTimeRange] = useState('7d');

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                setLoading(true);
                const response = await api.get(`/admin/stats?range=${timeRange}`);
                setStats({
                    overview: response.data.overview,
                    history: response.data.history,
                    distributions: response.data.distributions || { docs: [], features: [] }
                });
            } catch (error) {
                console.error('Error fetching analytics:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, [timeRange]);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <CircularProgress size={60} thickness={4} />
            </Box>
        );
    }

    // Colors for Pie Charts
    const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

    const StatCard = ({ title, value, icon, color, delay }) => (
        <Card 
            component={motion.div}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            sx={{ 
                height: '100%', 
                borderRadius: 4, 
                position: 'relative', 
                overflow: 'hidden',
                background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.action.hover} 100%)`,
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                border: '1px solid rgba(255,255,255,0.1)'
            }}
        >
            <Box sx={{ 
                position: 'absolute', 
                top: -20, 
                right: -20, 
                width: 100, 
                height: 100, 
                borderRadius: '50%', 
                bgcolor: color, 
                opacity: 0.1 
            }} />
            <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Avatar sx={{ bgcolor: `${color}22`, color: color, borderRadius: 3 }}>
                        {icon}
                    </Avatar>
                    <IconButton size="small"><MoreVert /></IconButton>
                </Box>
                <Typography variant="h3" fontWeight="800" sx={{ mb: 0.5, color: theme.palette.text.primary }}>
                    {value}
                </Typography>
                <Typography variant="body2" color="text.secondary" fontWeight="500">
                    {title}
                </Typography>
            </CardContent>
        </Card>
    );

    return (
        <Box sx={{ p: 4, maxWidth: 1600, mx: 'auto' }}>
            {/* Header Section */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 5 }}>
                <Box>
                    <Typography variant="overline" color="primary" fontWeight="bold" letterSpacing={1.5}>
                        System Overview
                    </Typography>
                    <Typography variant="h3" fontWeight="900" sx={{ 
                        background: 'linear-gradient(45deg, #111827 30%, #4b5563 90%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent', 
                        mt: 1
                    }}>
                         System Overview
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mt: 1, maxWidth: 600 }}>
                        Real-time command center for monitoring user engagement, resource utilization, and knowledge base integrity.
                    </Typography>
                </Box>
                
                {/* Premium Segmented Control / Tabs */}
                <Box sx={{ 
                    bgcolor: 'background.paper', 
                    borderRadius: 3, 
                    p: 0.5, 
                    display: 'flex', 
                    boxShadow: theme.shadows[1],
                    border: '1px solid',
                    borderColor: 'divider'
                }}>
                    {['24h', '7d', '30d', 'all'].map((range) => (
                        <Box
                            key={range}
                            onClick={() => setTimeRange(range)}
                            sx={{
                                px: 3,
                                py: 1,
                                borderRadius: 2.5,
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                fontSize: '0.875rem',
                                color: timeRange === range ? 'primary.contrastText' : 'text.secondary',
                                bgcolor: timeRange === range ? 'primary.main' : 'transparent',
                                transition: 'all 0.2s',
                                textTransform: 'uppercase',
                                '&:hover': {
                                    bgcolor: timeRange === range ? 'primary.dark' : 'action.hover'
                                }
                            }}
                        >
                            {range}
                        </Box>
                    ))}
                </Box>
            </Box>

            {/* Bento Grid Layout */}
            <Grid container spacing={3}>
                {/* Top Row: Key Metrics */}
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard title="Total Users" value={stats?.overview?.users?.total || 0} icon={<Group />} color="#6366f1" delay={0} />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard title="Compliance Checks" value={stats?.overview?.complianceCount || 0} icon={<TrendingUp />} color="#10b981" delay={0.1} />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard title="Active Chats" value={stats?.overview?.totalChats || 0} icon={<ChatBubbleOutline />} color="#f59e0b" delay={0.2} />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard title="Docs Indexed" value={stats?.overview?.knowledgeBase?.total || 0} icon={<Storage />} color="#ec4899" delay={0.3} />
                </Grid>

                {/* Second Row: Split Charts */}
                <Grid item xs={12} lg={8}>
                    <Paper component={motion.div} initial={{ opacity: 0 }} animate={{ opacity: 1 }} sx={{ p: 3, borderRadius: 4, height: 400, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>Platform Growth & Traffic</Typography>
                        <ResponsiveContainer width="100%" height={320}>
                            <AreaChart data={stats.history}>
                                <defs>
                                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip />
                                <Area type="monotone" dataKey="users" stroke="#6366f1" fillOpacity={1} fill="url(#colorUsers)" />
                                <Area type="monotone" dataKey="requests" stroke="#10b981" fillOpacity={0.3} fill="#10b981" name="Activities" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                <Grid item xs={12} lg={4}>
                    <Paper component={motion.div} initial={{ opacity: 0 }} animate={{ opacity: 1 }} sx={{ p: 3, borderRadius: 4, height: 400, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>Feature Usage Distribution</Typography>
                        <ResponsiveContainer width="100%" height={320}>
                            <PieChart>
                                <Pie
                                    data={stats.distributions.features}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {stats.distributions.features.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                {/* Third Row: Document & Compliance */}
                <Grid item xs={12} lg={6}>
                    <Paper component={motion.div} initial={{ opacity: 0 }} animate={{ opacity: 1 }} sx={{ p: 3, borderRadius: 4, height: 350, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>Knowledge Base Categorization</Typography>
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={stats.distributions.docs} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" width={150} />
                                <Tooltip />
                                <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Documents" />
                            </BarChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>
                
                <Grid item xs={12} lg={6}>
                    <Paper component={motion.div} initial={{ opacity: 0 }} animate={{ opacity: 1 }} sx={{ p: 3, borderRadius: 4, height: 350, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>Compliance & Checkups</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', justifyContent: 'center' }}>
                             {/* Placeholder for line chart of compliance over time, reuse history for now */}
                             <ResponsiveContainer width="100%" height={260}>
                                <LineChart data={stats.history}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="compliance" stroke="#ec4899" strokeWidth={3} dot={{r: 4}} name="Compliance Checks" />
                                </LineChart>
                            </ResponsiveContainer>
                        </Box>
                    </Paper>
                </Grid>

            </Grid>
        </Box>
    );
};

export default Analytics;
