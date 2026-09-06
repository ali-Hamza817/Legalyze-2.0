import React, { useState } from 'react';
import { Box, Drawer, List, ListItem, ListItemIcon, ListItemText, Typography, IconButton, useTheme, Divider, Avatar } from '@mui/material';
import { 
    Dashboard as DashboardIcon, 
    Storage as StorageIcon, // For Knowledge Base
    People as PeopleIcon, 
    Settings as SettingsIcon,
    Description as DescriptionIcon,
    Analytics as AnalyticsIcon,
    ExitToApp as LogoutIcon,
    Menu as MenuIcon,
    Assessment,
    Dns,
    Timeline as PulseIcon,
    MenuBook as BookIcon
} from '@mui/icons-material';


import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useColorMode } from '../context/ThemeContext'; // Updated import

const DRAWER_WIDTH = 280;

const AdminLayout = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const { logout, user } = useAuth();
    const { mode } = useColorMode();
    const [mobileOpen, setMobileOpen] = useState(false);

    const menuItems = [
        { text: 'System Overview', icon: <AnalyticsIcon />, path: '/admin/analytics' },
        { text: 'User Management', icon: <PeopleIcon />, path: '/admin/users' },
        { text: 'Knowledge Base (RAG)', icon: <StorageIcon />, path: '/admin/knowledge-base' },
        { text: 'Live Control Center', icon: <Assessment />, path: '/admin/live-control' },
        { text: 'System Reports', icon: <Assessment />, path: '/admin/reports' },
        { text: 'System Information', icon: <BookIcon />, path: '/admin/system-info' },
        { text: 'Settings', icon: <SettingsIcon />, path: '/admin/settings' },
    ];

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const handleLogout = () => {
        logout();
        navigate('/signin');
    };

    const drawerContent = (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper', borderRight: '1px solid', borderColor: 'divider' }}>
            {/* Admin Profile Section */}
            <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }}>
                <Avatar sx={{ bgcolor: 'secondary.main', width: 48, height: 48 }}>
                    {user?.firstName?.[0] || 'A'}
                </Avatar>
                <Box>
                    <Typography variant="subtitle1" fontWeight="bold">
                        {user?.firstName} {user?.lastName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>
                        Super Admin
                    </Typography>
                </Box>
            </Box>
            
            <Divider />

            {/* Navigation Items */}
            <List sx={{ flexGrow: 1, px: 2, py: 2 }}>
                {menuItems.map((item) => (
                    <ListItem 
                        button 
                        key={item.text} 
                        onClick={() => navigate(item.path)}
                        selected={location.pathname === item.path}
                        sx={{ 
                            mb: 1, 
                            borderRadius: '8px',
                            '&.Mui-selected': {
                                bgcolor: 'primary.main',
                                color: 'primary.contrastText',
                                '& .MuiListItemIcon-root': { color: 'primary.contrastText' },
                                '&:hover': { bgcolor: 'primary.dark' }
                            }
                        }}
                    >
                        <ListItemIcon sx={{ minWidth: 40, color: location.pathname === item.path ? 'inherit' : 'text.secondary' }}>
                            {item.icon}
                        </ListItemIcon>
                        <ListItemText primary={item.text} primaryTypographyProps={{ fontWeight: 500 }} />
                    </ListItem>
                ))}
            </List>

            <Divider />
            
            <List sx={{ px: 2 }}>
                <ListItem button onClick={handleLogout} sx={{ borderRadius: '8px', color: 'error.main' }}>
                    <ListItemIcon sx={{ minWidth: 40, color: 'error.main' }}>
                        <LogoutIcon />
                    </ListItemIcon>
                    <ListItemText primary="Logout" />
                </ListItem>
            </List>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
            {/* Mobile Header */}
            <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ mr: 2, display: { sm: 'none' }, position: 'fixed', top: 10, left: 10, zIndex: 1100 }}
            >
                <MenuIcon />
            </IconButton>

            {/* Sidebar */}
            <Box component="nav" sx={{ width: { sm: DRAWER_WIDTH }, flexShrink: { sm: 0 } }}>
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{ keepMounted: true }}
                    sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH } }}
                >
                    {drawerContent}
                </Drawer>
                <Drawer
                    variant="permanent"
                    sx={{ display: { xs: 'none', sm: 'block' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH, border: 'none' } }}
                    open
                >
                    {drawerContent}
                </Drawer>
            </Box>

            {/* Main Content Area */}
            <Box component="main" sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` }, pt: { xs: 8, sm: 3 } }}>
                <Outlet />
            </Box>
        </Box>
    );
};

export default AdminLayout;
