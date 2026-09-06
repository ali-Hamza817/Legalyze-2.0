import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
    Box, 
    Container, 
    Typography, 
    TextField, 
    Button, 
    Paper, 
    Grid, 
    CircularProgress, 
    Snackbar, 
    Alert,
    IconButton,
    useTheme,
    Tooltip,
    Chip,
    Stack
} from '@mui/material';
import { 
    Description, 
    ArrowBack, 
    Download, 
    Brightness4, 
    Brightness7, 
    Visibility,
    OpenInNew,
    CheckCircle,
    PictureAsPdf,
    Add,
    Delete,
    Cancel
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { documentTemplates } from '../utils/mockData';
import { generateAPI } from '../utils/api';
import { useColorMode } from '../App';
import ThemeSwitcher from '../components/ThemeSwitcher';
import html2pdf from 'html2pdf.js';

const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
};

const DocumentForm = () => {
    const { type } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const { mode, toggleColorMode } = useColorMode();
    
    const [template, setTemplate] = useState(null);
    const [fields, setFields] = useState([]);
    const [formData, setFormData] = useState({});
    const [errors, setErrors] = useState({});
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedDoc, setGeneratedDoc] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
    const [isDownloading, setIsDownloading] = useState(false);
    const [tempInputs, setTempInputs] = useState({});

    // Handler for adding items to a list field
    const handleListAdd = (fieldName) => {
        const val = tempInputs[fieldName];
        if (!val || !val.trim()) return;
        
        const currentList = Array.isArray(formData[fieldName]) ? formData[fieldName] : [];
        setFormData(prev => ({
            ...prev,
            [fieldName]: [...currentList, val.trim()]
        }));
        
        // Clear input
        setTempInputs(prev => ({
            ...prev,
            [fieldName]: ''
        }));
    };

    const handleListRemove = (fieldName, index) => {
        const currentList = Array.isArray(formData[fieldName]) ? formData[fieldName] : [];
        setFormData(prev => ({
            ...prev,
            [fieldName]: currentList.filter((_, i) => i !== index)
        }));
    };

    useEffect(() => {
        // Find template based on URL param
        const docTemplate = documentTemplates.find(t => t.id === type);
        
        if (!docTemplate) {
            setNotification({
                open: true,
                message: 'Document template not found',
                severity: 'error'
            });
            setTimeout(() => navigate('/chat'), 2000);
            return;
        }

        setTemplate(docTemplate);
        setFields(docTemplate.fields);

        // Initialize form data
        const initialData = {};
        docTemplate.fields.forEach(field => {
            initialData[field.name] = '';
        });

        // Pre-fill from chat generation if available
        if (location.state?.generationData?.mappedFields) {
            const { mappedFields } = location.state.generationData;
            Object.keys(mappedFields).forEach(key => {
                if (initialData.hasOwnProperty(key)) {
                    initialData[key] = mappedFields[key];
                }
            });
            
            setNotification({
                open: true,
                message: 'Fields auto-filled from your conversation!',
                severity: 'success'
            });
        }

        setFormData(initialData);
    }, [type, location.state, navigate]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        
        fields.forEach(field => {
            if (field.required && !formData[field.name]) {
                newErrors[field.name] = `${field.label} is required`;
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            setNotification({
                open: true,
                message: 'Please fill in all required fields',
                severity: 'error'
            });
            return;
        }

        setIsGenerating(true);
        setGeneratedDoc(null);
        setPreviewUrl(null);

        try {
            // Always use the real API for generation
            const response = await generateAPI.generateDocument(type, formData);
            
            if (response.data.success) {
                const doc = response.data.data.document;
                setGeneratedDoc(doc);
                
                // Use the viewUrl or htmlUrl from the response
                const url = doc.viewUrl || doc.htmlUrl;
                const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
                const htmlUrl = url && url.startsWith('http') ? url : `${API_BASE}${url}`;
                setPreviewUrl(htmlUrl);
                
                setNotification({
                    open: true,
                    message: 'Document generated successfully!',
                    severity: 'success'
                });
            } else {
                throw new Error(response.data.message || 'Generation failed');
            }
        } catch (error) {
            console.error('Generation error:', error);
            setNotification({
                open: true,
                message: error.response?.data?.message || error.message || 'Failed to generate document',
                severity: 'error'
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownload = () => {
        if (previewUrl) {
            window.open(previewUrl, '_blank');
        }
    };

    if (!template) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: theme.palette.background.default, py: 4 }}>
            <Container maxWidth="xl"> {/* Full width container */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Button
                        startIcon={<ArrowBack />}
                        onClick={() => navigate('/chat')}
                        sx={{ color: 'text.secondary' }}
                    >
                        Back to Chat
                    </Button>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="h5" fontWeight={700}>
                            {template.name}
                        </Typography>
                        <ThemeSwitcher variant="icon" />
                    </Box>
                </Box>

                <Grid container spacing={4} sx={{ height: 'calc(100vh - 150px)' }}>
                    {/* Left Column: Form Fields */}
                    <Grid item xs={12} md={6} sx={{ height: '100%', overflow: 'auto' }}>
                        <motion.div
                            initial="initial"
                            animate="animate"
                            variants={fadeIn}
                            style={{ height: '100%' }}
                        >
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 4,
                                    height: '100%',
                                    border: `1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                                    borderRadius: '2px',
                                    background: theme.palette.background.paper,
                                    overflow: 'auto'
                                }}
                            >
                                <Typography variant="h6" gutterBottom fontWeight={600} sx={{ mb: 3 }}>
                                    Document Details
                                </Typography>
                                
                                <form onSubmit={handleSubmit}>
                                    <Grid container spacing={3}>
                                        {fields.map((field) => (
                                            <Grid item xs={12} md={field.type === 'text' && field.name.includes('Address') || field.type === 'textarea' || field.type === 'list' ? 12 : 6} key={field.name}>
                                                {field.type === 'list' ? (
                                                    <Box>
                                                        <Typography variant="subtitle2" gutterBottom color="text.secondary">
                                                            {field.label} {field.required && '*'}
                                                        </Typography>
                                                        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                                                            <TextField
                                                                fullWidth
                                                                size="small"
                                                                placeholder={`Add ${field.label}...`}
                                                                value={tempInputs[field.name] || ''}
                                                                onChange={(e) => setTempInputs(prev => ({ ...prev, [field.name]: e.target.value }))}
                                                                onKeyPress={(e) => {
                                                                    if (e.key === 'Enter') {
                                                                        e.preventDefault();
                                                                        handleListAdd(field.name);
                                                                    }
                                                                }}
                                                            />
                                                            <Button 
                                                                variant="outlined" 
                                                                onClick={() => handleListAdd(field.name)}
                                                                startIcon={<Add />}
                                                            >
                                                                Add
                                                            </Button>
                                                        </Box>
                                                        <Stack direction="row" flexWrap="wrap" gap={1}>
                                                            {(Array.isArray(formData[field.name]) ? formData[field.name] : []).map((item, idx) => (
                                                                <Chip
                                                                    key={idx}
                                                                    label={item}
                                                                    onDelete={() => handleListRemove(field.name, idx)}
                                                                    color="primary"
                                                                    variant="outlined"
                                                                    size="small"
                                                                />
                                                            ))}
                                                            {(!formData[field.name] || formData[field.name].length === 0) && (
                                                                <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                                                                    No items added yet
                                                                </Typography>
                                                            )}
                                                        </Stack>
                                                    </Box>
                                                ) : (
                                                    <TextField
                                                        fullWidth
                                                        label={field.label}
                                                        name={field.name}
                                                        type={field.type === 'textarea' ? 'text' : field.type}
                                                        multiline={field.type === 'textarea'}
                                                        rows={field.type === 'textarea' ? 4 : 1}
                                                        value={formData[field.name] || ''}
                                                        onChange={handleInputChange}
                                                        error={!!errors[field.name]}
                                                        helperText={errors[field.name]}
                                                        required={field.required}
                                                        InputLabelProps={field.type === 'date' ? { shrink: true } : {}}
                                                        size="medium"
                                                        sx={{
                                                            '& .MuiOutlinedInput-root': {
                                                                borderRadius: '2px'
                                                            }
                                                        }}
                                                    />
                                                )}
                                            </Grid>
                                        ))}
                                    </Grid>

                                    <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
                                        <Button
                                            type="submit"
                                            variant="contained"
                                            disabled={isGenerating}
                                            startIcon={isGenerating ? <CircularProgress size={20} color="inherit" /> : <Description />}
                                            sx={{
                                                minWidth: 200,
                                                height: 48,
                                                borderRadius: '2px',
                                                background: mode === 'dark' ? '#76ABAE' : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                                                boxShadow: mode === 'dark' ? '0 4px 12px rgba(118, 171, 174, 0.3)' : '0 4px 12px rgba(16, 185, 129, 0.3)',
                                                '&:hover': {
                                                    background: mode === 'dark' ? '#5F8A8D' : 'linear-gradient(135deg, #4f46e5 0%, #047857 100%)',
                                                    boxShadow: mode === 'dark' ? '0 6px 16px rgba(118, 171, 174, 0.4)' : '0 6px 16px rgba(16, 185, 129, 0.4)',
                                                }
                                            }}
                                        >
                                            {isGenerating ? 'Generating...' : 'Generate Document'}
                                        </Button>
                                    </Box>
                                </form>
                            </Paper>
                        </motion.div>
                    </Grid>

                    {/* Right Column: Preview Section */}
                    <Grid item xs={12} md={6} sx={{ height: '100%' }}>
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            style={{ height: '100%' }}
                        >
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 0,
                                    height: '100%',
                                    border: `1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                                    borderRadius: '2px',
                                    background: theme.palette.background.paper,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    overflow: 'hidden'
                                }}
                            >
                                {/* Preview Header */}
                                <Box sx={{ 
                                    p: 2, 
                                    borderBottom: `1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    bgcolor: mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)'
                                }}>
                                    <Typography variant="subtitle1" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Visibility color="primary" />
                                        Document Preview
                                    </Typography>
                                    
                                    {generatedDoc && (
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <Button
                                                variant="outlined"
                                                startIcon={<OpenInNew />}
                                                href={previewUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                size="small"
                                                sx={{ borderRadius: '2px' }}
                                            >
                                                Open in New Tab
                                            </Button>
                                            <Button
                                                variant="contained"
                                                startIcon={<Download />}
                                                onClick={async () => {
                                                    if (generatedDoc) {
                                                        try {
                                                            setIsDownloading(true);
                                                            // 1. Get the HTML content URL
                                                            const url = generatedDoc.viewUrl || generatedDoc.htmlUrl;
                                                            if (!url) {
                                                                alert('Document URL not found');
                                                                return;
                                                            }
                                                            
                                                            const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
                                                            const fullUrl = url.startsWith('http') ? url : `${API_BASE}${url}`;

                                                            // 2. Fetch the HTML content
                                                            const response = await fetch(fullUrl);
                                                            if (!response.ok) throw new Error('Failed to fetch document content');
                                                            const htmlContent = await response.text();

                                                            // 3. Create a temporary container with strict isolation
                                                            const container = document.createElement('div');
                                                            container.style.position = 'fixed';
                                                            container.style.top = '0';
                                                            container.style.left = '0';
                                                            container.style.width = '0';
                                                            container.style.height = '0';
                                                            container.style.overflow = 'hidden';
                                                            container.style.visibility = 'hidden';
                                                            container.style.zIndex = '-9999';
                                                            container.style.pointerEvents = 'none';
                                                            document.body.appendChild(container);

                                                            // Create the content element inside the container
                                                            const element = document.createElement('div');
                                                            element.innerHTML = htmlContent;
                                                            element.style.width = '210mm'; // A4 width
                                                            container.appendChild(element);
                                                            
                                                            // 4. Generate PDF
                                                            const opt = {
                                                                margin: 10,
                                                                filename: generatedDoc.fileName ? generatedDoc.fileName.replace('.html', '.pdf') : 'document.pdf',
                                                                image: { type: 'jpeg', quality: 0.98 },
                                                                html2canvas: { 
                                                                    scale: 2, 
                                                                    useCORS: true,
                                                                    scrollX: 0,
                                                                    scrollY: 0,
                                                                    windowWidth: document.documentElement.offsetWidth,
                                                                    windowHeight: document.documentElement.offsetHeight
                                                                },
                                                                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                                                            };

                                                            await html2pdf().set(opt).from(element).save();
                                                            
                                                            // 5. Cleanup
                                                            document.body.removeChild(container);
                                                        } catch (error) {
                                                            console.error('PDF generation error:', error);
                                                            alert('Failed to generate PDF');
                                                        } finally {
                                                            setIsDownloading(false);
                                                        }
                                                    }
                                                }}
                                                size="small"
                                                sx={{ borderRadius: '2px' }}
                                            >
                                                Download PDF
                                            </Button>

                                        </Box>
                                    )}
                                </Box>

                                {/* Preview Content */}
                                <Box sx={{ 
                                    flexGrow: 1, 
                                    bgcolor: '#ffffff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}>
                                    {isGenerating ? (
                                        <Box sx={{ 
                                            display: 'flex', 
                                            flexDirection: 'column',
                                            justifyContent: 'center', 
                                            alignItems: 'center',
                                            gap: 2
                                        }}>
                                            <CircularProgress size={48} />
                                            <Typography color="text.secondary">
                                                Generating your document...
                                            </Typography>
                                        </Box>
                                    ) : previewUrl ? (
                                        <iframe
                                            src={previewUrl}
                                            width="100%"
                                            height="100%"
                                            style={{ border: 'none' }}
                                            title="Document Preview"
                                        />
                                    ) : (
                                        <Box sx={{ 
                                            textAlign: 'center', 
                                            p: 3, 
                                            opacity: 0.5,
                                            display: 'flex', 
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: 2
                                        }}>
                                            <Description sx={{ fontSize: 64, color: 'text.disabled' }} />
                                            <Typography variant="h6" color="text.secondary">
                                                Ready to Generate
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 300 }}>
                                                Fill out the form on the left and click "Generate Document" to see the preview here.
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>
                            </Paper>
                        </motion.div>
                    </Grid>
                </Grid>

                <Snackbar
                    open={notification.open}
                    autoHideDuration={6000}
                    onClose={() => setNotification({ ...notification, open: false })}
                >
                    <Alert 
                        onClose={() => setNotification({ ...notification, open: false })} 
                        severity={notification.severity}
                        sx={{ width: '100%' }}
                    >
                        {notification.message}
                    </Alert>
                </Snackbar>
            </Container>
            {/* Full-screen download overlay */}
            {isDownloading && (
                <Box
                    sx={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        width: '100vw',
                        height: '100vh',
                        bgcolor: mode === 'dark' ? 'rgba(34, 40, 49, 0.9)' : 'rgba(15, 23, 42, 0.9)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 2000,
                        backdropFilter: 'blur(2px)',
                        pointerEvents: 'all',
                    }}
                >
                    <Paper
                        elevation={3}
                        sx={{
                            p: 3,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 2,
                            borderRadius: '8px',
                        }}
                    >
                        <CircularProgress />
                        <Typography variant="body2" color="text.secondary">
                            Preparing your PDF download...
                        </Typography>
                    </Paper>
                </Box>
            )}
        </Box>
    );
};

export default DocumentForm;
