import React, { useState } from 'react';
import { 
    Box, Typography, Paper, Grid, Button, 
    Card, CardContent, Divider, List, ListItem, 
    ListItemText, ListItemIcon, CircularProgress,
    alpha, useTheme
} from '@mui/material';
import { 
    Download, Assessment, Description, 
    Timeline, Group, Block, Storage, 
    TrendingUp, PictureAsPdf
} from '@mui/icons-material';
import api from '../../utils/api';
import html2pdf from 'html2pdf.js';

const REPORT_TYPES = [
    { 
        id: 'users', 
        title: 'Complete User Registry', 
        desc: 'Detailed report of all registered users with roles and status.',
        icon: <Group />,
        color: '#1976d2'
    },
    { 
        id: 'suspended', 
        title: 'Suspended Accounts', 
        desc: 'Comprehensive list of all inactive or suspended user accounts.',
        icon: <Block />,
        color: '#d32f2f'
    },
    { 
        id: 'resources', 
        title: 'System Resources', 
        desc: 'Usage stats for chats, compliance checks, and case buildups.',
        icon: <Storage />,
        color: '#2e7d32'
    },
    { 
        id: 'knowledge-base', 
        title: 'Knowledge Base Audit', 
        desc: 'Summary of indexed legal documents grouped by category.',
        icon: <Description />,
        color: '#ed6c02'
    },
    { 
        id: 'activity', 
        title: 'User Activity Trends', 
        desc: 'Login history and registration engagement metrics.',
        icon: <TrendingUp />,
        color: '#9c27b0'
    }
];

const Reports = () => {
    const theme = useTheme();
    const [loading, setLoading] = useState(false);
    const [activeReport, setActiveReport] = useState(null);
    const [reportData, setReportData] = useState(null);

    const generateReport = async (type) => {
        setLoading(true);
        setActiveReport(type);
        setReportData(null);
        try {
            const res = await api.get(`/admin/reports/${type.id}`);
            setReportData(res.data);
        } catch (err) {
            console.error(err);
            alert('Failed to generate report');
        } finally {
            setLoading(false);
        }
    };

    const downloadPDF = () => {
        const element = document.getElementById('report-render');
        const opt = {
            margin: [0.5, 0.5],
            filename: `Legalyze_${activeReport.id}_Report_${new Date().toISOString().split('T')[0]}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };
        html2pdf().set(opt).from(element).save();
    };

    const renderReportContent = () => {
        if (!reportData) return null;

        switch (activeReport.id) {
            case 'users':
            case 'suspended':
                return (
                    <Box>
                        <Typography variant="h6" gutterBottom sx={{ borderBottom: '2px solid #eee', pb: 1, mb: 3 }}>
                            {activeReport.id === 'users' ? 'Registered Users List' : 'Suspended Accounts Registry'}
                        </Typography>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#f5f5f5', textAlign: 'left' }}>
                                    <th style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>Name</th>
                                    <th style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>Email</th>
                                    <th style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>Role</th>
                                    <th style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>Registration Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reportData.map((user, idx) => (
                                    <tr key={user._id} style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                                        <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>{user.firstName} {user.lastName}</td>
                                        <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>{user.email}</td>
                                        <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>{user.role}</td>
                                        <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>{new Date(user.createdAt).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Box>
                );
            case 'resources':
                return (
                    <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" gutterBottom sx={{ mb: 4 }}>System Utilization Summary</Typography>
                        <Grid container spacing={4}>
                            <Grid item xs={6}>
                                <Paper variant="outlined" sx={{ p: 4 }}>
                                    <Typography variant="h2" color="primary" fontWeight="bold">{reportData.totalChats}</Typography>
                                    <Typography variant="subtitle1">Total Chats Created</Typography>
                                </Paper>
                            </Grid>
                            <Grid item xs={6}>
                                <Paper variant="outlined" sx={{ p: 4 }}>
                                    <Typography variant="h2" color="secondary" fontWeight="bold">{reportData.complianceChecks}</Typography>
                                    <Typography variant="subtitle1">Compliance Checks Runs</Typography>
                                </Paper>
                            </Grid>
                            <Grid item xs={6}>
                                <Paper variant="outlined" sx={{ p: 4 }}>
                                    <Typography variant="h2" color="success.main" fontWeight="bold">{reportData.caseBuildups}</Typography>
                                    <Typography variant="subtitle1">Case Buildups Initiated</Typography>
                                </Paper>
                            </Grid>
                            <Grid item xs={6}>
                                <Paper variant="outlined" sx={{ p: 4 }}>
                                    <Typography variant="h2" color="info.main" fontWeight="bold">{reportData.totalUsers}</Typography>
                                    <Typography variant="subtitle1">Active Platform Users</Typography>
                                </Paper>
                            </Grid>
                        </Grid>
                    </Box>
                );
            case 'knowledge-base':
                return (
                    <Box>
                        <Typography variant="h6" gutterBottom>Knowledge Base Categorization</Typography>
                        <Box sx={{ mb: 4, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                            {reportData.summary.map(cat => (
                                <Paper key={cat._id} sx={{ p: 2, minWidth: 150, textAlign: 'center', bgcolor: 'action.hover' }}>
                                    <Typography variant="h5" fontWeight="bold">{cat.count}</Typography>
                                    <Typography variant="caption">{cat._id || 'Unsorted'}</Typography>
                                </Paper>
                            ))}
                        </Box>
                        <Typography variant="subtitle2" gutterBottom>File Registry</Typography>
                        {reportData.docs.map((doc, idx) => (
                            <Box key={doc._id} sx={{ p: 1.5, borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2">{idx + 1}. {doc.title}</Typography>
                                <Typography variant="caption" color="text.secondary">{doc.category}</Typography>
                            </Box>
                        ))}
                    </Box>
                );
            case 'activity':
                return (
                    <Box>
                        <Typography variant="h6" gutterBottom>Engagement & Trends</Typography>
                        <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>Recent System Access (Live Logs)</Typography>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', marginBottom: '20px' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#f1f1f1' }}>
                                    <th style={{ padding: '8px', border: '1px solid #ddd' }}>User</th>
                                    <th style={{ padding: '8px', border: '1px solid #ddd' }}>Email</th>
                                    <th style={{ padding: '8px', border: '1px solid #ddd' }}>Login Time</th>
                                    <th style={{ padding: '8px', border: '1px solid #ddd' }}>IP Address</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reportData.recentLogins.map(log => (
                                    <tr key={log._id}>
                                        <td style={{ padding: '8px', border: '1px solid #eee' }}>{log.userId ? `${log.userId.firstName} ${log.userId.lastName}` : 'System'}</td>
                                        <td style={{ padding: '8px', border: '1px solid #eee' }}>{log.userId?.email || '-'}</td>
                                        <td style={{ padding: '8px', border: '1px solid #eee' }}>{new Date(log.loginTime).toLocaleString()}</td>
                                        <td style={{ padding: '8px', border: '1px solid #eee' }}>{log.ipAddress || 'Unknown'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        
                        <Typography variant="subtitle2" sx={{ mt: 4, mb: 1 }}>Registration Trend (Last 30 Days)</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, height: 100 }}>
                            {reportData.registrationTrends.slice().reverse().map(day => (
                                <Box key={day._id} sx={{ 
                                    flex: 1, 
                                    height: `${(day.count / Math.max(...reportData.registrationTrends.map(d => d.count), 1)) * 100}%`,
                                    bgcolor: 'primary.light',
                                    borderRadius: '2px 2px 0 0'
                                }} title={`${day._id}: ${day.count}`} />
                            ))}
                        </Box>
                    </Box>
                );
            default:
                return null;
        }
    };

    return (
        <Box sx={{ p: 4, maxWidth: 1400, mx: 'auto' }}>
            <Box sx={{ mb: 6 }}>
                <Typography variant="h3" fontWeight="900" gutterBottom sx={{ 
                    background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '-1px'
                }}>
                    System Reports
                </Typography>
                <Typography variant="h6" color="text.secondary" fontWeight="400">
                    Select a report type to generate a detailed audit of system performance and data.
                </Typography>
            </Box>

            <Grid container spacing={3}>
                {/* Report Selection Sidebar */}
                <Grid item xs={12} md={4}>
                    <Typography variant="overline" sx={{ fontWeight: 'bold', mb: 2, display: 'block', color: 'text.secondary' }}>
                        AVAILABLE DATASETS
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {REPORT_TYPES.map((type) => (
                            <Card 
                                key={type.id}
                                component={Button}
                                onClick={() => generateReport(type)}
                                sx={{ 
                                    p: 0,
                                    borderRadius: 4,
                                    textAlign: 'left',
                                    justifyContent: 'flex-start',
                                    textTransform: 'none',
                                    border: activeReport?.id === type.id ? `2px solid ${type.color}` : '1px solid transparent',
                                    boxShadow: activeReport?.id === type.id ? `0 8px 24px ${alpha(type.color, 0.2)}` : theme.shadows[1],
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    '&:hover': {
                                        transform: 'translateX(8px)',
                                        borderColor: alpha(type.color, 0.5)
                                    }
                                }}
                            >
                                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: '16px !important', width: '100%' }}>
                                    <Box sx={{ 
                                        p: 1.5, 
                                        borderRadius: 3, 
                                        bgcolor: alpha(type.color, 0.1), 
                                        color: type.color 
                                    }}>
                                        {type.icon}
                                    </Box>
                                    <Box sx={{ flexGrow: 1 }}>
                                        <Typography variant="subtitle1" fontWeight="bold" color="text.primary">{type.title}</Typography>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.2 }}>{type.desc}</Typography>
                                    </Box>
                                </CardContent>
                            </Card>
                        ))}
                    </Box>
                </Grid>

                {/* Report Preview & Formatting Area */}
                <Grid item xs={12} md={8}>
                    {loading ? (
                        <Box sx={{ height: '500px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                            <CircularProgress size={60} thickness={4} />
                            <Typography sx={{ mt: 3 }} color="text.secondary">Fetching system data...</Typography>
                        </Box>
                    ) : reportData ? (
                        <Box>
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2, gap: 2 }}>
                                <Button 
                                    variant="contained" 
                                    startIcon={<PictureAsPdf />}
                                    onClick={downloadPDF}
                                    sx={{ borderRadius: 2 }}
                                >
                                    Export PDF
                                </Button>
                            </Box>
                            <Paper sx={{ 
                                p: 6, 
                                borderRadius: 4, 
                                minHeight: '600px',
                                background: '#fff',
                                color: '#333'
                            }}>
                                <Box id="report-render">
                                    <Box sx={{ 
                                        display: 'flex', 
                                        justifyContent: 'space-between', 
                                        alignItems: 'flex-start',
                                        mb: 6,
                                        borderBottom: '4px solid #000',
                                        pb: 4
                                    }}>
                                        <Box>
                                            <Typography variant="h4" fontWeight="900" sx={{ letterSpacing: '-1px' }}>LEGALIZE</Typography>
                                            <Typography variant="overline" color="text.secondary">Internal Audit Service</Typography>
                                        </Box>
                                        <Box sx={{ textAlign: 'right' }}>
                                            <Typography variant="h6" fontWeight="bold">{activeReport.title}</Typography>
                                            <Typography variant="body2" color="text.secondary">Ref: {activeReport.id.toUpperCase()}-{new Date().getTime().toString().slice(-6)}</Typography>
                                            <Typography variant="body2" color="text.secondary">Generated: {new Date().toLocaleString()}</Typography>
                                        </Box>
                                    </Box>

                                    {renderReportContent()}

                                    <Box sx={{ mt: 8, pt: 4, borderTop: '1px solid #eee', textAlign: 'center' }}>
                                        <Typography variant="caption" color="text.secondary">
                                            This report is automatically generated from the Legalyze Master Database. 
                                            Confidential - Authorized Admin Personnel Only.
                                        </Typography>
                                        <Box sx={{ mt: 1 }}>
                                            <Typography variant="caption" fontWeight="bold">© 2025 Legalyze AI - Legal Intelligence Platform</Typography>
                                        </Box>
                                    </Box>
                                </Box>
                            </Paper>
                        </Box>
                    ) : (
                        <Paper sx={{ 
                            height: '500px', 
                            display: 'flex', 
                            flexDirection: 'column', 
                            justifyContent: 'center', 
                            alignItems: 'center',
                            borderRadius: 4,
                            border: '2px dashed',
                            borderColor: 'divider',
                            bgcolor: 'rgba(0,0,0,0.02)'
                        }}>
                            <Assessment sx={{ fontSize: 80, color: 'divider', mb: 2 }} />
                            <Typography variant="h6" color="text.secondary">No Data Selected</Typography>
                            <Typography variant="body2" color="text.secondary">Choose a report from the left to begin generation.</Typography>
                        </Paper>
                    )}
                </Grid>
            </Grid>
        </Box>
    );
};

export default Reports;

