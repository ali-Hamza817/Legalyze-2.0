import React, { useEffect, useState } from 'react';
import { 
    Box, Typography, Paper, Grid, Button, IconButton, 
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Chip, LinearProgress, Alert, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import { CloudUpload, Delete, Description, Refresh, CheckCircle, Error as ErrorIcon } from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import api from '../../utils/api';

const KnowledgeBase = () => {
    const [documents, setDocuments] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
    const [category, setCategory] = useState('General');

    const CATEGORIES = [
        'General',
        'Constitution',
        'Authoritative Laws',
        'Statutory Laws',
        'Case Law',
        'International Law'
    ];

    const fetchDocuments = async () => {
        try {
            const res = await api.get('/admin/knowledge-base');
            setDocuments(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, []);

    const onDrop = async (acceptedFiles) => {
        const file = acceptedFiles[0];
        if (!file) return;

        setUploading(true);
        setError(null);
        
        const formData = new FormData();
        formData.append('document', file);
        formData.append('category', category);

        try {
            await api.post('/admin/knowledge-base', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            fetchDocuments(); // Refresh list to see "Indexing" status
        } catch (err) {
            console.error(err);
            setError('Upload failed. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'application/pdf': ['.pdf'] }, multiple: false });

    const handleDelete = async (id) => {
        if(window.confirm('Are you sure you want to delete this document?')) {
            try {
                await api.delete(`/admin/knowledge-base/${id}`);
                setDocuments(documents.filter(d => d._id !== id));
            } catch (err) {
                alert('Delete failed');
            }
        }
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h4" fontWeight="bold">RAG Knowledge Base</Typography>
                    <Typography variant="body1" color="text.secondary">
                        Manage global legal documents indexed in Pinecone.
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button 
                        startIcon={<CheckCircle />} 
                        variant="contained" 
                        color="secondary"
                        onClick={async () => {
                            try {
                                const res = await api.post('/admin/seed-knowledge-base');
                                alert(res.data.message);
                                fetchDocuments();
                            } catch (e) {
                                alert('Sync failed');
                            }
                        }}
                    >
                        Sync Authoritative Laws
                    </Button>
                    <Button startIcon={<Refresh />} variant="outlined" onClick={fetchDocuments}>Refresh</Button>
                </Box>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
                        <Typography variant="h6" gutterBottom>Upload New Document</Typography>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
                            <FormControl size="small" sx={{ minWidth: 200 }}>
                                <InputLabel>Category / Namespace</InputLabel>
                                <Select
                                    value={category}
                                    label="Category / Namespace"
                                    onChange={(e) => setCategory(e.target.value)}
                                >
                                    {CATEGORIES.map(cat => (
                                        <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <Typography variant="caption" color="text.secondary">
                                Documents will be indexed under this namespace for targeted RAG search.
                            </Typography>
                        </Box>
                        <Box 
                            {...getRootProps()}
                            sx={{ 
                                p: 4, 
                                border: '2px dashed', 
                                borderColor: isDragActive ? 'primary.main' : 'divider',
                                bgcolor: isDragActive ? 'action.hover' : 'background.paper',
                                borderRadius: 4,
                                textAlign: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            <input {...getInputProps()} />
                            <CloudUpload sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                            <Typography variant="body1" fontWeight="bold">
                                {isDragActive ? "Drop PDF here..." : "Click or Drag & Drop PDF Legal Documents"}
                            </Typography>
                        </Box>
                    </Paper>
                </Grid>

                {uploading && (
                    <Grid item xs={12}>
                        <Box sx={{ width: '100%' }}>
                            <Typography variant="caption" mb={1}>Uploading & Indexing...</Typography>
                            <LinearProgress sx={{ height: 8, borderRadius: 4 }} />
                        </Box>
                    </Grid>
                )}

                {/* Documents List */}
                <Grid item xs={12}>
                    <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Document Name</TableCell>
                                    <TableCell>Category</TableCell>
                                    <TableCell>Size</TableCell>
                                    <TableCell>Date Added</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {documents.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center">No documents indexed yet.</TableCell>
                                    </TableRow>
                                )}
                                {documents.map((doc) => (
                                    <TableRow key={doc._id} hover>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Description color="action" />
                                                <Typography variant="body2" fontWeight="500">{doc.title}</Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Chip label={doc.category || 'General'} size="small" variant="outlined" />
                                        </TableCell>
                                        <TableCell>{doc.fileSize}</TableCell>
                                        <TableCell>{new Date(doc.uploadDate).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            <Chip 
                                                icon={doc.status === 'Indexed' ? <CheckCircle sx={{ fontSize: '14px !important' }} /> : (doc.status === 'Failed' ? <ErrorIcon sx={{ fontSize: '14px !important' }} /> : undefined)}
                                                label={doc.status} 
                                                size="small" 
                                                color={doc.status === 'Indexed' ? 'success' : (doc.status === 'Failed' ? 'error' : 'warning')} 
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            <IconButton color="error" size="small" onClick={() => handleDelete(doc._id)}>
                                                <Delete />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Grid>
            </Grid>
        </Box>
    );
};

export default KnowledgeBase;
