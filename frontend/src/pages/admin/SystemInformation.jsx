import React, { useState, useEffect, useRef } from 'react';
import { 
    Box, Typography, Grid, Paper, List, ListItem, 
    ListItemText, ListItemIcon, Divider, TextField, 
    InputAdornment, IconButton, Button, Tooltip,
    Fade, Zoom, useTheme
} from '@mui/material';
import { 
    MenuBook, Search, Print, Bookmark, 
    Description, Storage, Code, Speed,
    AccountTree, Shield, Info, ArrowForwardIos
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { systemDocs } from '../../data/systemDocsData';

const SystemInformation = () => {
    const theme = useTheme();
    const [selectedId, setSelectedId] = useState('vision');
    const [searchQuery, setSearchQuery] = useState('');
    const contentRef = useRef(null);

    const filteredDocs = systemDocs.filter(doc => 
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        doc.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const currentDoc = systemDocs.find(d => d.id === selectedId) || systemDocs[0];

    const handlePrint = () => {
        window.print();
    };

    const getIcon = (id) => {
        switch(id) {
            case 'vision': return <Info color="primary" />;
            case 'tech-stack': return <Code color="primary" />;
            case 'architecture': return <AccountTree color="primary" />;
            case 'modules': return <Storage color="primary" />;
            case 'roles': return <Shield color="primary" />;
            case 'apis': return <Speed color="primary" />;
            case 'pain-points': return <Description color="primary" />;
            default: return <Bookmark color="primary" />;
        }
    };

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
            {/* Header Area */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, '@media print': { display: 'none' } }}>
                <Box>
                    <Typography variant="h3" fontWeight="900" sx={{ 
                        background: 'linear-gradient(45deg, #1e293b 30%, #64748b 90%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        System Bible
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Comprehensive Manual & Technical Documentation for the Legalyze Ecosystem.
                    </Typography>
                </Box>
                <Button 
                    variant="outlined" 
                    startIcon={<Print />} 
                    onClick={handlePrint}
                    sx={{ borderRadius: 2 }}
                >
                    Print Full Manual
                </Button>
            </Box>

            <Grid container spacing={3} sx={{ flexGrow: 1, overflow: 'hidden' }}>
                {/* Table of Contents (Sidebar) */}
                <Grid item xs={12} md={3} sx={{ height: '100%', display: 'flex', flexDirection: 'column', '@media print': { display: 'none' } }}>
                    <Paper 
                        elevation={0}
                        sx={{ 
                            p: 2, 
                            borderRadius: 4, 
                            border: '1px solid', 
                            borderColor: 'divider',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                    >
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Search Documentation..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            sx={{ mb: 2 }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Search fontSize="small" />
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <List sx={{ flexGrow: 1, overflowY: 'auto' }}>
                            {filteredDocs.map((doc) => (
                            <ListItem 
                                    key={doc.id}
                                    button
                                    selected={selectedId === doc.id}
                                    onClick={() => {
                                        setSelectedId(doc.id);
                                        if (contentRef.current) contentRef.current.scrollTop = 0;
                                    }}
                                    sx={{ 
                                        borderRadius: 2,
                                        mb: 1,
                                        '&.Mui-selected': {
                                            bgcolor: 'primary.main',
                                            color: 'white',
                                            '&:hover': { bgcolor: 'primary.dark' },
                                            '.MuiListItemIcon-root': { color: 'white' }
                                        }
                                    }}
                                >
                                    <ListItemIcon sx={{ minWidth: 40 }}>
                                        {getIcon(doc.id)}
                                    </ListItemIcon>
                                    <ListItemText 
                                        primary={doc.title} 
                                        primaryTypographyProps={{ variant: 'body2', fontWeight: selectedId === doc.id ? 'bold' : 'medium' }}
                                    />
                                    {selectedId === doc.id && <ArrowForwardIos sx={{ fontSize: 12 }} />}
                                </ListItem>
                            ))}
                            {filteredDocs.length === 0 && (
                                <Typography variant="caption" align="center" display="block" color="text.disabled" sx={{ mt: 2 }}>
                                    No matching sections found.
                                </Typography>
                            )}
                        </List>
                        <Divider sx={{ my: 2 }} />
                        <Box sx={{ p: 1, textAlign: 'center' }}>
                            <Typography variant="caption" color="text.disabled">
                                Legalyze Technical v1.0.4
                            </Typography>
                        </Box>
                    </Paper>
                </Grid>

                {/* Content Viewer (The "Book" Page) */}
                <Grid item xs={12} md={9} sx={{ height: '100%', '@media print': { width: '100%', md: '12' } }}>
                    <Paper 
                        ref={contentRef}
                        elevation={0}
                        sx={{ 
                            p: { xs: 3, md: 6 }, 
                            borderRadius: 4, 
                            border: '1px solid', 
                            borderColor: 'divider',
                            height: '100%',
                            overflowY: 'auto',
                            bgcolor: theme.palette.mode === 'dark' ? '#0f172a' : '#ffffff',
                            position: 'relative',
                            '@media print': {
                                overflow: 'visible',
                                height: 'auto',
                                border: 'none',
                                p: 0
                            }
                        }}
                    >
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={selectedId}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Box className="markdown-content">
                                    <ReactMarkdown
                                        components={{
                                            code({ node, inline, className, children, ...props }) {
                                                return (
                                                    <code className={className} {...props}>
                                                        {children}
                                                    </code>
                                                );
                                            }
                                        }}
                                    >
                                        {currentDoc.content}
                                    </ReactMarkdown>
                                </Box>
                            </motion.div>
                        </AnimatePresence>

                        {/* Styles for Markdown */}
                        <style>{`
                            .markdown-content h1 { font-weight: 900; font-size: 2.5rem; margin-bottom: 24px; color: ${theme.palette.text.primary}; }
                            .markdown-content h3 { font-weight: 700; font-size: 1.5rem; margin-top: 32px; margin-bottom: 16px; color: ${theme.palette.primary.main}; }
                            .markdown-content p { font-size: 1.1rem; line-height: 1.8; margin-bottom: 20px; color: ${theme.palette.text.secondary}; }
                            .markdown-content ul { padding-left: 20px; margin-bottom: 24px; }
                            .markdown-content li { font-size: 1.1rem; line-height: 1.8; margin-bottom: 8px; color: ${theme.palette.text.secondary}; }
                            .markdown-content table { width: 100%; border-collapse: collapse; margin: 32px 0; }
                            .markdown-content th, .markdown-content td { padding: 12px; border: 1px solid ${theme.palette.divider}; text-align: left; }
                            .markdown-content th { background-color: ${theme.palette.action.hover}; font-weight: 700; }
                        `}</style>

                        {/* Print Only Footer */}
                        <Box sx={{ display: 'none', '@media print': { display: 'block', mt: 4, borderTop: '1px solid #eee', pt: 2 } }}>
                            <Typography variant="caption">
                                Legalyze Confidential Technical Documentation | Generated on {new Date().toLocaleDateString()}
                            </Typography>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default SystemInformation;
