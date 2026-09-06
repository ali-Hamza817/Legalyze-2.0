import React, { useEffect, useState } from 'react';
import { 
    Box, Typography, Paper, Table, TableBody, TableCell, 
    TableContainer, TableHead, TableRow, Chip, IconButton, 
    CircularProgress, Avatar, Pagination, TextField, InputAdornment,
    Button, Dialog, DialogTitle, DialogContent, DialogActions,
    FormControl, InputLabel, Select, MenuItem, Switch, FormControlLabel,
    Alert
} from '@mui/material';
import { Block, CheckCircle, Search, PersonAdd, Security, Close } from '@mui/icons-material';
import api from '../../utils/api';

const UserManagement = () => {
    // ... Data States
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // ... Modal States
    const [openRegister, setOpenRegister] = useState(false);
    const [openPermissions, setOpenPermissions] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'user' });
    const [actionLoading, setActionLoading] = useState(false);
    const [message, setMessage] = useState(null);

    // Fetch Users
    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/admin/users?page=${page}&limit=10&search=${search}&status=${statusFilter}`);
            setUsers(res.data.users);
            setTotalPages(res.data.totalPages);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => { fetchUsers(); }, 500);
        return () => clearTimeout(timer);
    }, [page, search, statusFilter]);

    // Handlers
    const handleSuspend = async (userId, currentStatus) => {
        if(window.confirm(`Are you sure you want to ${currentStatus ? 'suspend' : 'activate'} this user?`)) {
            try {
                await api.put(`/admin/users/${userId}/suspend`);
                fetchUsers(); 
            } catch (err) { alert('Action failed'); }
        }
    };

    const handleRegisterUser = async () => {
        setActionLoading(true);
        try {
            await api.post('/auth/register-user', newUser);
            setMessage({ type: 'success', text: 'User registered successfully!' });
            setNewUser({ name: '', email: '', password: '', role: 'user' });
            setOpenRegister(false);
            fetchUsers();
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Registration failed' });
        } finally {
            setActionLoading(false);
        }
    };

    const handlePermissionToggle = async (feature, isEnabled) => {
         try {
            const res = await api.put(`/admin/users/${selectedUser._id}/permissions`, { feature, isEnabled });
            // Update local state to reflect change immediately
            setSelectedUser(prev => ({
                ...prev,
                disabledFeatures: res.data.disabledFeatures
            }));
            fetchUsers(); // Refresh main list too
        } catch (err) {
            alert('Failed to update permission');
        }
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <div>
                    <Typography variant="h4" fontWeight="bold" gutterBottom>User Management</Typography>
                    <Typography variant="body1" color="text.secondary">
                        View and manage registered users.
                    </Typography>
                </div>
                <Button 
                    variant="contained" 
                    startIcon={<PersonAdd />} 
                    size="large"
                    onClick={() => setOpenRegister(true)}
                >
                    Register User
                </Button>
            </Box>

            {message && <Alert severity={message.type} onClose={() => setMessage(null)} sx={{ mb: 2 }}>{message.text}</Alert>}

            {/* Filter Bar */}
            <Box sx={{ 
                display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap', alignItems: 'center', p: 3,
                bgcolor: 'background.paper', borderRadius: 4, boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
                border: '1px solid rgba(255, 255, 255, 0.18)'
            }}>
                <Box sx={{ position: 'relative', flexGrow: 1, maxWidth: 500 }}>
                    <TextField 
                        fullWidth size="medium" placeholder="Search by name, email or ID..."
                        value={search} onChange={(e) => setSearch(e.target.value)}
                        sx={{
                            '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: 'rgba(255,255,255,0.05)' }
                        }}
                        InputProps={{
                            startAdornment: (<InputAdornment position="start"><Search color="primary" /></InputAdornment>),
                        }}
                    />
                </Box>
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                    {['all', 'active', 'suspended'].map((status) => (
                        <Chip key={status} label={status.toUpperCase()} onClick={() => setStatusFilter(status)}
                            color={statusFilter === status ? 'primary' : 'default'} variant={statusFilter === status ? 'filled' : 'outlined'}
                            sx={{ borderRadius: 2 }}
                        />
                    ))}
                </Box>
            </Box>

            {/* User List */}
            {loading ? <CircularProgress /> : (
                <>
                    <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>User</TableCell>
                                    <TableCell>Email</TableCell>
                                    <TableCell>Role</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Restrictions</TableCell>
                                    <TableCell align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {users.map((user) => (
                                    <TableRow key={user._id} hover>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Avatar>{user.firstName[0]}</Avatar>
                                                <Typography variant="body2" fontWeight="600">
                                                    {user.firstName} {user.lastName}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>
                                            <Chip label={user.role} size="small" variant="outlined" color={user.role === 'superadmin' ? 'secondary' : 'default'} />
                                        </TableCell>
                                        <TableCell>
                                            <Chip label={user.isActive ? 'Active' : 'Suspended'} color={user.isActive ? 'success' : 'error'} size="small" />
                                        </TableCell>
                                        <TableCell>
                                            {user.disabledFeatures && user.disabledFeatures.length > 0 ? (
                                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                    {user.disabledFeatures.map(f => (
                                                        <Chip key={f} label={f} size="small" color="error" variant="outlined" />
                                                    ))}
                                                </Box>
                                            ) : (
                                                <Typography variant="caption" color="text.secondary">None</Typography>
                                            )}
                                        </TableCell>
                                        <TableCell align="right">
                                            {user.role !== 'superadmin' && (
                                                <Box>
                                                    <IconButton title="Manage Permissions" onClick={() => { setSelectedUser(user); setOpenPermissions(true); }}>
                                                        <Security />
                                                    </IconButton>
                                                    <IconButton 
                                                        color={user.isActive ? 'error' : 'success'} 
                                                        onClick={() => handleSuspend(user._id, user.isActive)}
                                                        title={user.isActive ? "Suspend User" : "Activate User"}
                                                    >
                                                        {user.isActive ? <Block /> : <CheckCircle />}
                                                    </IconButton>
                                                </Box>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                        <Pagination count={totalPages} page={page} onChange={(e, v) => setPage(v)} color="primary" />
                    </Box>
                </>
            )}

            {/* REGISTER USER MODAL */}
            <Dialog open={openRegister} onClose={() => setOpenRegister(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Register New User</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        <TextField fullWidth label="Full Name" value={newUser.name} onChange={(e) => setNewUser({...newUser, name: e.target.value})} />
                        <TextField fullWidth label="Email Address" type="email" value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})} />
                        <TextField fullWidth label="Password" type="password" value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})} />
                        <FormControl fullWidth>
                            <InputLabel>Role</InputLabel>
                            <Select value={newUser.role} label="Role" onChange={(e) => setNewUser({...newUser, role: e.target.value})}>
                                <MenuItem value="user">User</MenuItem>
                                <MenuItem value="admin">Admin</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenRegister(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleRegisterUser} disabled={actionLoading}>{actionLoading ? 'Creating...' : 'Create Account'}</Button>
                </DialogActions>
            </Dialog>

            {/* MANAGE PERMISSIONS MODAL */}
            <Dialog open={openPermissions} onClose={() => setOpenPermissions(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    Manage Permissions: {selectedUser?.firstName}
                    <IconButton aria-label="close" onClick={() => setOpenPermissions(false)} sx={{ position: 'absolute', right: 8, top: 8 }}>
                        <Close />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" mb={3}>
                        Enable or disable specific features for this user. Disabled features will be inaccessible.
                    </Typography>
                    
                    {['compliance', 'chat', 'case_builder', 'documents'].map((feature) => {
                        const isDisabled = selectedUser?.disabledFeatures?.includes(feature);
                        return (
                            <Box key={feature} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, p: 2, border: '1px solid #eee', borderRadius: 2 }}>
                                <Typography fontWeight="600" sx={{ textTransform: 'capitalize' }}>
                                    {feature.replace('_', ' ')}
                                </Typography>
                                <FormControlLabel
                                    control={
                                        <Switch 
                                            checked={!isDisabled} 
                                            onChange={(e) => handlePermissionToggle(feature, e.target.checked)}
                                        />
                                    }
                                    label={isDisabled ? "Disabled" : "Enabled"}
                                />
                            </Box>
                        )
                    })}
                </DialogContent>
            </Dialog>
        </Box>
    );
};

export default UserManagement;
