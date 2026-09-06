import React, { useState, useEffect } from 'react';
import {
    Box,
    Stepper,
    Step,
    StepButton,
    StepLabel,
    Button,
    Typography,
    TextField,
    Paper,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Alert,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Divider,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    IconButton,
    Tooltip,
    Stack,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Container,
    Grid,
    Avatar
} from '@mui/material';
import {
    Gavel,
    Assignment,
    Search,
    Description,
    CheckCircle,
    ExpandMore,
    Lightbulb,
    Balance,
    Article,
    School,
    ArrowForward,
    ArrowBack,
    ContentCopy,
    Download,
    Close,
    History,
    Save,
    Delete,
    PictureAsPdf
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

const STEPS = [
    { label: 'Case Intake', description: 'Describe the facts of your case' },
    { label: 'Classification', description: 'AI Case Analysis & Type' },
    { label: 'Relevant Law', description: 'Statutory legal framework' },
    { label: 'Precedents', description: 'Supreme Court Case Law' },
    { label: 'Strategy', description: 'Strategic legal memorandum' },
    { label: 'Filing Details', description: 'Enter specific petition details' },
    { label: 'Drafting', description: 'Generate professional petition' }
];

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const CaseBuildingWizard = ({ onClose }) => {
    const [activeStep, setActiveStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [sessionId, setSessionId] = useState(null);
    
    // History View State
    const [showHistory, setShowHistory] = useState(false);
    const [sessions, setSessions] = useState([]);
    
    // Case data
    const [caseData, setCaseData] = useState({
        facts: '',
        caseType: '',
        clientPosition: 'petitioner',
        courtLevel: 'district',
        urgency: 'normal',
        extractedFacts: null,
        classification: null,
        relevantLaws: [],
        precedents: [],
        strategy: null,
        documents: []
    });

    // Tracking searches for UX feedback
    const [searchMetadata, setSearchMetadata] = useState({
        lawsSearched: false,
        precedentsSearched: false,
        lastLawQuery: '',
        lastPrecedentQuery: ''
    });

    const [statusMessage, setStatusMessage] = useState('');
    const [searchSummary, setSearchSummary] = useState('');
    const [stepAck, setStepAck] = useState({ show: false, message: '' });
    const [analysisComplete, setAnalysisComplete] = useState(false);
    const [templates, setTemplates] = useState({});
    const [factualInputs, setFactualInputs] = useState({});
    const [selectedTemplateId, setSelectedTemplateId] = useState(null);

    // Load available templates
    useEffect(() => {
        const loadTemplates = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/case-building/templates`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                const data = await res.json();
                if (data.success) {
                    setTemplates(data.data);
                }
            } catch (err) {
                console.error('Failed to fetch templates');
            }
        };
        loadTemplates();
    }, []);

    // Auto-populate dummy data when template changes
    useEffect(() => {
        if (selectedTemplateId && templates[selectedTemplateId]) {
            const template = templates[selectedTemplateId];
            const newInputs = { ...factualInputs };
            let updated = false;

            template.requiredFields.forEach(field => {
                if (field.defaultValue && !newInputs[field.id]) {
                    newInputs[field.id] = field.defaultValue;
                    updated = true;
                }
            });

            if (updated) {
                setFactualInputs(newInputs);
            }
        }
    }, [selectedTemplateId, templates]);

    // --- History Management ---
    const fetchSessions = async () => {
        try {
            const response = await fetch(`${API_BASE}/api/case-building/sessions`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await response.json();
            if (data.success) {
                setSessions(data.data);
                setShowHistory(true);
            }
        } catch (err) {
            console.error('Failed to fetch sessions');
        }
    };

    const loadSession = async (id) => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE}/api/case-building/sessions/${id}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await response.json();
            if (data.success) {
                const session = data.data;
                setSessionId(session._id);
                setCaseData({
                    facts: session.caseDetails.facts || '',
                    caseType: session.caseDetails.caseType || '',
                    clientPosition: session.caseDetails.clientPosition || 'petitioner',
                    courtLevel: session.caseDetails.courtLevel || 'district',
                    urgency: session.caseDetails.urgency || 'normal',
                    extractedFacts: session.extractedFacts,
                    classification: session.classification,
                    relevantLaws: session.relevantLaws || [],
                    precedents: session.precedents || [],
                    strategy: session.strategy,
                    documents: session.documents || []
                });
                // Map steps correctly
                // New steps: 0: Intake, 1: Classification, 2: Laws, 3: Precedents, 4: Strategy, 5: Filing Details, 6: Drafting
                let loadedStep = session.currentStep;
                // If it was previously saved with "Filing Details" at index 2, we need to correct it
                if (loadedStep === 2) {
                    loadedStep = 1; // Back to Classification or forward to Laws? Let's say forward to Laws
                    loadedStep = 2; 
                }
                setActiveStep(loadedStep || (session.classification ? 1 : 0));
                
                if (session.factualFields) {
                    setFactualInputs(session.factualFields);
                }
                if (session.selectedTemplateId) {
                    setSelectedTemplateId(session.selectedTemplateId);
                }

                // Set metadata to unblock navigation if data already exists
                setSearchMetadata({
                    lawsSearched: session.relevantLaws && session.relevantLaws.length > 0,
                    precedentsSearched: session.precedents && session.precedents.length > 0,
                    lastLawQuery: 'Restored from session',
                    lastPrecedentQuery: 'Restored from session'
                });
                if (session.searchSummary) {
                    setSearchSummary(session.searchSummary);
                }
                
                setShowHistory(false);
            }
        } catch (err) {
            setError('Failed to load session');
        } finally {
            setLoading(false);
        }
    };

    const deleteSession = async (e, id) => {
        e.stopPropagation();
        if(!window.confirm('Are you sure you want to delete this case?')) return;
        
        try {
            await fetch(`${API_BASE}/api/case-building/sessions/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            setSessions(prev => prev.filter(s => s._id !== id));
        } catch (err) {
            console.error('Failed to delete session');
        }
    };

    // --- Persist Progress ---
    const persistSession = async (currentData, step) => {
        try {
            const url = sessionId 
                ? `${API_BASE}/api/case-building/sessions/${sessionId}`
                : `${API_BASE}/api/case-building/sessions`;
            
            const method = sessionId ? 'PUT' : 'POST';
            
            const payload = {
                currentStep: step,
                ...(method === 'POST' && {
                    facts: currentData.facts,
                    caseType: currentData.caseType,
                    clientPosition: currentData.clientPosition,
                    courtLevel: currentData.courtLevel,
                    urgency: currentData.urgency
                }),
                ...(method === 'PUT' && {
                    caseDetails: {
                        facts: currentData.facts,
                        caseType: currentData.caseType,
                        clientPosition: currentData.clientPosition,
                        courtLevel: currentData.courtLevel,
                        urgency: currentData.urgency
                    },
                    extractedFacts: currentData.extractedFacts,
                    classification: currentData.classification,
                    relevantLaws: currentData.relevantLaws,
                    precedents: currentData.precedents
                })
            };

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            if (data.success && method === 'POST') {
                setSessionId(data.data._id);
                return data.data._id;
            }
        } catch (err) {
            console.error('Failed to save progress', err);
        }
    };

    // --- Step 1: Case Intake & Analysis ---
    const handleAnalysis = async () => {
        if (!caseData.facts.trim()) {
            setError('Please describe the facts of your case');
            return;
        }
        setLoading(true);
        setError(null);

        try {
            const newSessionId = await persistSession(caseData, 0);
            const currentSessionId = sessionId || newSessionId;

            const factsRes = await fetch(`${API_BASE}/api/case-building/extract-facts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ facts: caseData.facts })
            });
            const factsData = await factsRes.json();
            const extractedFacts = factsData.success ? factsData.data : null;

            const analyzeRes = await fetch(`${API_BASE}/api/case-building/analyze`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ 
                    facts: caseData.facts,
                    sessionId: currentSessionId
                })
            });
            const analyzeData = await analyzeRes.json();

            if (analyzeData.success) {
                const analysis = analyzeData.data;
                const newData = {
                    ...caseData,
                    extractedFacts,
                    classification: analysis,
                    caseType: analysis.caseType?.toLowerCase() || 'civil'
                };
                
                setCaseData(newData);
                setAnalysisComplete(true);
                if (analyzeData.data.suggestedTemplateId) {
                    setSelectedTemplateId(analyzeData.data.suggestedTemplateId);
                }
                setStepAck({ show: true, message: 'Analysis Complete! You may now proceed to the next step.' });
                setTimeout(() => {
                    setStepAck({ show: false, message: '' });
                }, 3000);
            }
        } catch (err) {
            setError('Failed to analyze case. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // --- Step 2: Relevant Laws ---
    const handleFindLaws = async () => {
        setLoading(true);
        setStatusMessage('Please wait, we are identifying applicable Pakistani statutes for your case...');
        try {
            const response = await fetch(`${API_BASE}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    message: `List detailed Pakistani laws for this ${caseData.caseType} case.
                    
FACTS: ${caseData.facts}

Return JSON array: [{"section": "...", "law": "...", "description": "...", "relevance": "..."}]`
                })
            });

            if (!response.ok) throw new Error('Network response was not ok');

            setSearchMetadata(prev => ({ ...prev, lawsSearched: true, lastLawQuery: caseData.facts.substring(0, 100) + '...' }));

            const data = await response.json();
            if (data.success) {
                let laws = [];
                try {
                    laws = JSON.parse(data.data.message);
                } catch {
                    laws = [{ description: data.data.message }];
                }
                
                setCaseData(prev => ({ ...prev, relevantLaws: laws }));
                await persistSession({ ...caseData, relevantLaws: laws }, 3); // Updated step index
                
                setStepAck({ show: true, message: 'Laws Identified! Moving to Precedents...' });
                setTimeout(() => {
                    setStepAck({ show: false, message: '' });
                    setActiveStep(4); // Updated step index
                }, 1500);
            } else {
                throw new Error(data.message || 'Failed to search laws');
            }
        } catch (err) {
            console.error('Law search error:', err);
            setError(`Failed to find laws: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    // --- Step 3: Precedents ---
    const handleFindPrecedents = async () => {
        setLoading(true);
        setStatusMessage('Initializing Deep AI Legal Search... We are scanning thousands of precedents.');
        setError(null);
        try {
            const response = await fetch(`${API_BASE}/api/judgments/intelligent-search`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    query: caseData.facts,
                    caseType: caseData.caseType,
                    limit: 5
                })
            });

            if (!response.ok) throw new Error('Intelligent search service currently unavailable');

            const data = await response.json();

            setSearchMetadata(prev => ({ 
                ...prev, 
                precedentsSearched: true, 
                lastPrecedentQuery: caseData.facts.substring(0, 100) + '...' 
            }));

            if (data.success) {
                const results = data.data?.results || [];
                const summary = data.data?.summary || '';
                
                setCaseData(prev => ({ ...prev, precedents: results }));
                setSearchSummary(summary);
                await persistSession({ ...caseData, precedents: results, searchSummary: summary }, 4); // Updated step index
                
                setStepAck({ show: true, message: 'Precedents Found! Building Strategy...' });
                setTimeout(() => {
                    setStepAck({ show: false, message: '' });
                    setActiveStep(5); // Updated step index
                }, 1500);
            } else {
                throw new Error(data.message || 'Failed to complete intelligent search');
            }
        } catch (err) {
            console.error('Intelligent Search Error:', err);
            setError(`Search error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    // --- Step 4: Strategy ---
    const handleGenerateStrategy = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE}/api/case-building/strategy`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    ...caseData,
                    sessionId
                })
            });

            const data = await response.json();
            if (data.success) {
                setCaseData(prev => ({ ...prev, strategy: data.data.strategy }));
                setStepAck({ show: true, message: 'Strategy Memorandum Generated! Proceeding to document drafting?' });
                setTimeout(() => {
                    setStepAck({ show: false, message: '' });
                }, 3000);
            }
        } catch (err) {
            setError('Failed to generate strategy');
        } finally {
            setLoading(false);
        }
    };

    // --- Step 5: Documents ---
    const handleSaveFilingDetails = async () => {
        setLoading(true);
        setStatusMessage('Saving details...');
        try {
            const res = await fetch(`${API_BASE}/api/case-building/save-filing-details`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    sessionId: sessionId,
                    factualFields: factualInputs
                })
            });
            const data = await res.json();
            if (data.success) {
                return true;
            }
            return false;
        } catch (err) {
            setError('Failed to save filing details.');
            return false;
        } finally {
            setLoading(false);
            setStatusMessage('');
        }
    };

    const handleGenerateDocuments = async () => {
        setLoading(true);
        setStatusMessage('Please wait, we are drafting your professional legal petition following High Court standards...');
        
        try {
            // Always use backend for document generation with proper field mapping
            const res = await fetch(`${API_BASE}/api/case-building/draft`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    facts: caseData.facts,
                    strategy: caseData.strategy,
                    relevantLaws: caseData.relevantLaws,
                    precedents: caseData.precedents,
                    filingDetails: factualInputs,  // Send all Step 6 fields
                    templateId: selectedTemplateId  // Send selected template ID
                })
            });
            
            const data = await res.json();
            
            if (data.success) {
                const newDoc = { 
                    type: data.data.type, 
                    content: data.data.content, 
                    createdAt: new Date() 
                };
                setCaseData(prev => ({
                ...prev,
                documents: [...prev.documents, newDoc]
            }));
            await persistSession({ ...caseData, documents: [...caseData.documents, newDoc] }, 6);
            setStepAck({ show: true, message: 'Final Document Ready!' });
            setTimeout(() => {
                setStepAck({ show: false, message: '' });
            }, 3000);
            } else {
                throw new Error(data.message || 'Failed to generate document');
            }
            
        } catch (err) {
            setError('Failed to generate legal document. Please try again.');
        } finally {
            setLoading(false);
            setStatusMessage('');
        }
    };

    const handleExportDocumentPDF = async (index) => {
        try {
            const doc = caseData.documents[index];
            if (!doc) {
                setError('Document not found');
                return;
            }

            // Import html2pdf dynamically
            const html2pdf = (await import('html2pdf.js')).default;
            
            // Create a temporary container for the HTML content
            const element = document.createElement('div');
            element.innerHTML = doc.content;
            element.style.padding = '20px';
            element.style.fontFamily = 'Times New Roman, serif';
            element.style.fontSize = '12pt';
            element.style.lineHeight = '1.8';
            
            // Configure PDF options
            const opt = {
                margin: [0.5, 0.5, 0.5, 0.5],
                filename: `${doc.type.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
            };
            
            // Generate and download PDF
            await html2pdf().set(opt).from(element).save();
            
        } catch (err) {
            console.error('PDF Export Error:', err);
            setError('Failed to export document as PDF. Please try again.');
        }
    };

    const handleDownloadPDF = async () => {
        const url = `${API_BASE}/api/case-building/sessions/${sessionId}/export`;
        try {
            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = `Legal_Strategy_${sessionId}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
        } catch (err) {
            setError('Failed to download PDF');
        }
    };

    return (
        <Box sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
            {/* Header Area */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box>
                    <Typography variant="h4" fontWeight="900" color="primary.main" sx={{ mb: 0.5 }}>
                        Case Building Wizard
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Gavel fontSize="small" color="primary" /> Professional Pakistani Legal Strategy & Compliance Engine
                    </Typography>
                </Box>
                <Stack direction="row" spacing={2}>
                    <Button 
                        startIcon={<History />} 
                        variant="outlined" 
                        onClick={fetchSessions}
                    >
                        History
                    </Button>
                    <IconButton onClick={onClose}><Close /></IconButton>
                </Stack>
            </Box>

            {/* Error Banner */}
            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* History Dialog */}
            <Dialog open={showHistory} onClose={() => setShowHistory(false)} maxWidth="md" fullWidth>
                <DialogTitle>Recent Sessions</DialogTitle>
                <DialogContent>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Date</TableCell>
                                <TableCell>Case Title</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Type</TableCell>
                                <TableCell>Action</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {sessions.map((session) => (
                                <TableRow key={session._id} hover sx={{ cursor: 'pointer' }} onClick={() => loadSession(session._id)}>
                                    <TableCell>{new Date(session.updatedAt).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <Typography variant="subtitle2" fontWeight="bold">{session.title || 'Untitled Case'}</Typography>
                                        <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 200, display: 'block' }}>
                                            {session.caseDetails?.facts?.substring(0, 50)}...
                                        </Typography>
                                    </TableCell>
                                    <TableCell><Chip label={session.status} size="small" /></TableCell>
                                    <TableCell><Chip label={session.caseDetails?.caseType} variant="outlined" size="small" /></TableCell>
                                    <TableCell>
                                        <IconButton size="small" onClick={(e) => deleteSession(e, session._id)} color="error">
                                            <Delete />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowHistory(false)}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Main Stepper - Horizontal */}
            <Box sx={{ mb: 6 }}>
                <Stepper activeStep={activeStep} orientation="horizontal" alternativeLabel>
                    {STEPS.map((step, index) => (
                        <Step key={step.label} completed={activeStep > index}>
                            <StepButton onClick={() => setActiveStep(index)}>
                                <StepLabel>{step.label}</StepLabel>
                            </StepButton>
                        </Step>
                    ))}
                </Stepper>
            </Box>

            {/* Step Content Area */}
            <Box sx={{ flexGrow: 1, overflowY: 'auto', position: 'relative' }}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeStep}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        {stepAck.show && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                style={{
                                    marginBottom: '20px'
                                }}
                            >
                                <Alert 
                                    icon={<CheckCircle fontSize="inherit" />} 
                                    severity="success"
                                    sx={{ 
                                        borderRadius: 2, 
                                        bgcolor: 'success.main', 
                                        color: 'white',
                                        '& .MuiAlert-icon': { color: 'white' }
                                    }}
                                >
                                    {stepAck.message}
                                </Alert>
                            </motion.div>
                        )}
                        {/* Step 0: Intake */}
                        {activeStep === 0 && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <Typography variant="h5" fontWeight="bold">1. Case Facts & Parameters</Typography>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={6}
                                    label="Provide Detailed Case Facts"
                                    placeholder="Include names, dates, specific incidents, and the current legal status..."
                                    value={caseData.facts}
                                    onChange={(e) => setCaseData(p => ({ ...p, facts: e.target.value }))}
                                    variant="outlined"
                                    sx={{ bgcolor: 'background.paper', borderRadius: 2 }}
                                />

                                <Grid container spacing={4}>
                                    <Grid item xs={12} md={4}>
                                        <FormControl fullWidth>
                                            <InputLabel>Client Position</InputLabel>
                                            <Select 
                                                value={caseData.clientPosition}
                                                label="Client Position"
                                                onChange={(e) => setCaseData(p => ({ ...p, clientPosition: e.target.value }))}
                                            >
                                                <MenuItem value="petitioner">Petitioner/Plaintiff</MenuItem>
                                                <MenuItem value="respondent">Respondent/Defendant</MenuItem>
                                                <MenuItem value="appellant">Appellant</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={12} md={4}>
                                        <FormControl fullWidth>
                                            <InputLabel>Court Level</InputLabel>
                                            <Select 
                                                value={caseData.courtLevel}
                                                label="Court Level"
                                                onChange={(e) => setCaseData(p => ({ ...p, courtLevel: e.target.value }))}
                                            >
                                                <MenuItem value="district">District/Magistrate</MenuItem>
                                                <MenuItem value="sessions">Sessions Court</MenuItem>
                                                <MenuItem value="highcourt">High Court</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={12} md={4}>
                                        <Stack direction="row" spacing={2} sx={{ height: '56px' }}>
                                            <Button
                                                fullWidth
                                                variant="contained"
                                                size="large"
                                                onClick={handleAnalysis}
                                                disabled={loading || !caseData.facts.trim()}
                                                sx={{ 
                                                    mt: 3,
                                                    py: 2,
                                                    fontSize: '1.1rem',
                                                    fontWeight: 'bold',
                                                    borderRadius: '1px',
                                                    bgcolor: analysisComplete ? 'success.main' : 'primary.main',
                                                    '&:hover': {
                                                        bgcolor: analysisComplete ? 'success.dark' : 'primary.dark',
                                                    },
                                                    boxShadow: analysisComplete ? '0 0 20px rgba(76, 175, 80, 0.4)' : 4
                                                }}
                                            >
                                                {loading ? <CircularProgress size={24} color="inherit" /> : 
                                                 analysisComplete ? <><CheckCircle sx={{ mr: 1 }} /> Analysis Complete</> : 'Start Case Analysis'}
                                            </Button>
                                        </Stack>
                                    </Grid>
                                </Grid>
                            </Box>
                        )}

                        {/* Step 1: Classification */}
                        {activeStep === 1 && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <Typography variant="h5" fontWeight="bold">2. Case Analysis & Issues</Typography>
                                {caseData.classification ? (
                                    <Grid container spacing={4}>
                                        <Grid item xs={12} md={4}>
                                            <Card sx={{ height: '100%', borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                                                <CardContent>
                                                    <Typography variant="overline" color="text.secondary">Case Identity</Typography>
                                                    <Typography variant="h6" fontWeight="bold" gutterBottom>{caseData.classification.caseType}</Typography>
                                                    <Chip 
                                                        label={caseData.classification.urgencyLevel} 
                                                        color={caseData.classification.urgencyLevel === 'high' ? 'error' : 'info'} 
                                                        sx={{ mb: 2 }}
                                                    />
                                                    <Divider sx={{ my: 2 }} />
                                                    <Typography variant="subtitle2" fontWeight="bold">Initial Advice:</Typography>
                                                    <Typography variant="body2">{caseData.classification.initialAdvice}</Typography>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                        <Grid item xs={12} md={8}>
                                            <Paper sx={{ p: 4, borderRadius: 3, bgcolor: 'background.paper' }}>
                                                <Typography variant="h6" fontWeight="bold" gutterBottom>Legal Issues Identified</Typography>
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 4 }}>
                                                    {caseData.classification.legalIssues?.map((issue, i) => (
                                                        <Chip key={i} label={issue} variant="soft" color="primary" />
                                                    ))}
                                                </Box>
                                                <Typography variant="h6" fontWeight="bold" gutterBottom>Key Factual Elements</Typography>
                                                <List>
                                                    {caseData.extractedFacts?.keyFacts?.map((fact, i) => (
                                                        <ListItem key={i}>
                                                            <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
                                                            <ListItemText primary={fact} />
                                                        </ListItem>
                                                    ))}
                                                </List>
                                            </Paper>
                                        </Grid>
                                    </Grid>
                                ) : (
                                    <Alert severity="info">Please complete Step 1 first.</Alert>
                                )}
</Box>
                        )}

                        {/* Step 2: Laws */}
                        {activeStep === 2 && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid', borderColor: 'divider', pb: 2 }}>
                                    <Box>
                                        <Typography variant="h5" fontWeight="bold">3. Statutory Framework</Typography>
                                        <Typography variant="body2" color="text.secondary">Applicable Statutes from the Constitution, PPC, CrPC & CPC</Typography>
                                    </Box>
                                    {caseData.relevantLaws.length > 0 && !loading && (
                                        <Button 
                                            variant="outlined" 
                                            size="small" 
                                            startIcon={<Search />} 
                                            onClick={handleFindLaws}
                                        >
                                            Re-Scan Laws
                                        </Button>
                                    )}
                                </Box>
                                
                                <AnimatePresence mode="wait">
                                    {caseData.relevantLaws.length === 0 && !loading ? (
                                        <motion.div
                                            key="search-cta"
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 1.05 }}
                                        >
                                            <Paper 
                                                sx={{ 
                                                    p: 8, 
                                                    textAlign: 'center', 
                                                    borderRadius: 4, 
                                                    bgcolor: 'rgba(25, 118, 210, 0.04)', 
                                                    border: '2px dashed', 
                                                    borderColor: 'primary.light',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center'
                                                }}
                                            >
                                                <Gavel sx={{ fontSize: 80, mb: 3, color: 'primary.main', opacity: 0.8 }} />
                                                <Typography variant="h5" gutterBottom fontWeight="800">
                                                    Identify Legal Foundations
                                                </Typography>
                                                <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 600 }}>
                                                    Our engine will perform a cross-referential search across the entire Pakistani legal corpus to find the exact sections relevant to your case.
                                                </Typography>
                                                <Button 
                                                    variant="contained" 
                                                    size="large"
                                                    startIcon={<Search />} 
                                                    onClick={handleFindLaws}
                                                    sx={{ 
                                                        borderRadius: '50px', 
                                                        px: 10, 
                                                        py: 2, 
                                                        fontSize: '1.2rem', 
                                                        fontWeight: 'bold', 
                                                        boxShadow: '0 10px 30px rgba(25, 118, 210, 0.3)',
                                                        '&:hover': { transform: 'scale(1.02)', boxShadow: '0 15px 40px rgba(25, 118, 210, 0.4)' }
                                                    }}
                                                >
                                                    Initiate Statutory Intelligence Scan
                                                </Button>
                                            </Paper>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="results-dashboard"
                                            initial={{ opacity: 0, y: 30 }}
                                            animate={{ opacity: 1, y: 0 }}
                                        >
                                            <Grid container spacing={3}>
                                                {loading ? (
                                                    <Grid item xs={12} sx={{ textAlign: 'center', py: 15 }}>
                                                        <Box sx={{ position: 'relative', display: 'inline-flex', mb: 4 }}>
                                                            <CircularProgress size={100} thickness={2} sx={{ color: 'rgba(25, 118, 210, 0.2)' }} />
                                                            <CircularProgress
                                                                size={100}
                                                                thickness={4}
                                                                sx={{
                                                                    color: 'primary.main',
                                                                    position: 'absolute',
                                                                    left: 0,
                                                                    [`& .MuiCircularProgress-circle`]: { strokeLinecap: 'round' },
                                                                }}
                                                            />
                                                            <Gavel sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: 40, color: 'primary.main' }} />
                                                        </Box>
                                                        <Typography variant="h5" sx={{ fontWeight: '800', letterSpacing: 1 }} color="primary">
                                                            {statusMessage || 'Scanning Global Legal Library...'}
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>
                                                            Cross-referencing Constitution, PPC, CrPC, and local statutes...
                                                        </Typography>
                                                    </Grid>
                                                ) : (
                                                    <>
                                                        <Grid item xs={12}>
                                                            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
                                                                <Paper sx={{ 
                                                                    p: 3, 
                                                                    bgcolor: 'success.main', 
                                                                    color: 'white', 
                                                                    borderRadius: 4, 
                                                                    display: 'flex', 
                                                                    alignItems: 'center', 
                                                                    justifyContent: 'center',
                                                                    gap: 2, 
                                                                    boxShadow: '0 10px 30px rgba(76, 175, 80, 0.3)',
                                                                    mb: 2
                                                                }}>
                                                                    <CheckCircle sx={{ fontSize: 32 }} />
                                                                    <Typography variant="h6" fontWeight="900">
                                                                        SCAN COMPLETE: {caseData.relevantLaws.length} Authoritative Statutes Secured
                                                                    </Typography>
                                                                </Paper>
                                                            </motion.div>
                                                        </Grid>
                                                        
                                                        {caseData.relevantLaws.map((law, i) => (
                                                            <Grid item xs={12} md={6} key={i}>
                                                                <Card 
                                                                    elevation={0} 
                                                                    sx={{ 
                                                                        borderRadius: 3, 
                                                                        border: '1px solid', 
                                                                        borderColor: 'divider',
                                                                        height: '100%',
                                                                        transition: 'transform 0.2s, box-shadow 0.2s',
                                                                        '&:hover': {
                                                                            transform: 'translateY(-4px)',
                                                                            boxShadow: 4,
                                                                            borderColor: 'primary.main'
                                                                        }
                                                                    }}
                                                                >
                                                                    <CardContent sx={{ p: 3 }}>
                                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                                                                            <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32, fontSize: '0.9rem', fontWeight: 'bold' }}>
                                                                                §
                                                                            </Avatar>
                                                                            <Typography variant="h6" color="primary" fontWeight="800">
                                                                                {law.section || law.law}
                                                                            </Typography>
                                                                        </Box>
                                                                        <Typography variant="body2" sx={{ mb: 2, color: 'text.primary', lineHeight: 1.7 }}>
                                                                            {law.description}
                                                                        </Typography>
                                                                        <Divider sx={{ my: 2, borderStyle: 'dashed' }} />
                                                                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                                                            <Lightbulb sx={{ fontSize: 18, mt: 0.3, color: 'warning.main' }} />
                                                                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: '500' }}>
                                                                                <strong>APPLICATION:</strong> {law.relevance}
                                                                            </Typography>
                                                                        </Box>
                                                                    </CardContent>
                                                                </Card>
                                                            </Grid>
                                                        ))}
                                                    </>
                                                )}
                                            </Grid>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </Box>
                        )}

                        {/* Step 3: Laws (formerly Step 2) */}
                        {activeStep === 3 && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid', borderColor: 'divider', pb: 2 }}>
                                    <Box>
                                        <Typography variant="h5" fontWeight="bold">4. Statutory Framework</Typography>
                                        <Typography variant="body2" color="text.secondary">Applicable Statutes from the Constitution, PPC, CrPC & CPC</Typography>
                                    </Box>
                                    {caseData.relevantLaws.length > 0 && !loading && (
                                        <Button 
                                            variant="outlined" 
                                            size="small" 
                                            startIcon={<Search />} 
                                            onClick={handleFindLaws}
                                        >
                                            Re-Scan Laws
                                        </Button>
                                    )}
                                </Box>
                                
                                <AnimatePresence mode="wait">
                                    {caseData.relevantLaws.length === 0 && !loading ? (
                                        <motion.div
                                            key="search-cta"
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 1.05 }}
                                        >
                                            <Paper 
                                                sx={{ 
                                                    p: 8, 
                                                    textAlign: 'center', 
                                                    borderRadius: 4, 
                                                    bgcolor: 'rgba(25, 118, 210, 0.04)', 
                                                    border: '2px dashed', 
                                                    borderColor: 'primary.light',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center'
                                                }}
                                            >
                                                <Gavel sx={{ fontSize: 80, mb: 3, color: 'primary.main', opacity: 0.8 }} />
                                                <Typography variant="h5" gutterBottom fontWeight="800">
                                                    Identify Legal Foundations
                                                </Typography>
                                                <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 600 }}>
                                                    Our engine will perform a cross-referential search across the entire Pakistani legal corpus to find the exact sections relevant to your case.
                                                </Typography>
                                                <Button 
                                                    variant="contained" 
                                                    size="large"
                                                    startIcon={<Search />} 
                                                    onClick={handleFindLaws}
                                                    sx={{ 
                                                        borderRadius: '50px', 
                                                        px: 10, 
                                                        py: 2, 
                                                        fontSize: '1.2rem', 
                                                        fontWeight: 'bold', 
                                                        boxShadow: '0 10px 30px rgba(25, 118, 210, 0.3)',
                                                        '&:hover': { transform: 'scale(1.02)', boxShadow: '0 15px 40px rgba(25, 118, 210, 0.4)' }
                                                    }}
                                                >
                                                    Initiate Statutory Intelligence Scan
                                                </Button>
                                            </Paper>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="results-dashboard"
                                            initial={{ opacity: 0, y: 30 }}
                                            animate={{ opacity: 1, y: 0 }}
                                        >
                                            <Grid container spacing={3}>
                                                {loading ? (
                                                    <Grid item xs={12} sx={{ textAlign: 'center', py: 15 }}>
                                                        <Box sx={{ position: 'relative', display: 'inline-flex', mb: 4 }}>
                                                            <CircularProgress size={100} thickness={2} sx={{ color: 'rgba(25, 118, 210, 0.2)' }} />
                                                            <CircularProgress
                                                                size={100}
                                                                thickness={4}
                                                                sx={{
                                                                    color: 'primary.main',
                                                                    position: 'absolute',
                                                                    left: 0,
                                                                    [`& .MuiCircularProgress-circle`]: { strokeLinecap: 'round' },
                                                                }}
                                                            />
                                                            <Gavel sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: 40, color: 'primary.main' }} />
                                                        </Box>
                                                        <Typography variant="h5" sx={{ fontWeight: '800', letterSpacing: 1 }} color="primary">
                                                            {statusMessage || 'Scanning Global Legal Library...'}
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>
                                                            Cross-referencing Constitution, PPC, CrPC, and local statutes...
                                                        </Typography>
                                                    </Grid>
                                                ) : (
                                                    <>
                                                        <Grid item xs={12}>
                                                            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
                                                                <Paper sx={{ 
                                                                    p: 3, 
                                                                    bgcolor: 'success.main', 
                                                                    color: 'white', 
                                                                    borderRadius: 4, 
                                                                    display: 'flex', 
                                                                    alignItems: 'center', 
                                                                    justifyContent: 'center',
                                                                    gap: 2, 
                                                                    boxShadow: '0 10px 30px rgba(76, 175, 80, 0.3)',
                                                                    mb: 2
                                                                }}>
                                                                    <CheckCircle sx={{ fontSize: 32 }} />
                                                                    <Typography variant="h6" fontWeight="900">
                                                                        SCAN COMPLETE: {caseData.relevantLaws.length} Authoritative Statutes Secured
                                                                    </Typography>
                                                                </Paper>
                                                            </motion.div>
                                                        </Grid>
                                                        
                                                        {caseData.relevantLaws.map((law, i) => (
                                                            <Grid item xs={12} md={6} key={i}>
                                                                <Card 
                                                                    elevation={0} 
                                                                    sx={{ 
                                                                        borderRadius: 3, 
                                                                        border: '1px solid', 
                                                                        borderColor: 'divider',
                                                                        height: '100%',
                                                                        transition: 'transform 0.2s, box-shadow 0.2s',
                                                                        '&:hover': {
                                                                            transform: 'translateY(-4px)',
                                                                            boxShadow: 4,
                                                                            borderColor: 'primary.main'
                                                                        }
                                                                    }}
                                                                >
                                                                    <CardContent sx={{ p: 3 }}>
                                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                                                                            <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32, fontSize: '0.9rem', fontWeight: 'bold' }}>
                                                                                §
                                                                            </Avatar>
                                                                            <Typography variant="h6" color="primary" fontWeight="800">
                                                                                {law.section || law.law}
                                                                            </Typography>
                                                                        </Box>
                                                                        <Typography variant="body2" sx={{ mb: 2, color: 'text.primary', lineHeight: 1.7 }}>
                                                                            {law.description}
                                                                        </Typography>
                                                                        <Divider sx={{ my: 2, borderStyle: 'dashed' }} />
                                                                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                                                            <Lightbulb sx={{ fontSize: 18, mt: 0.3, color: 'warning.main' }} />
                                                                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: '500' }}>
                                                                                <strong>APPLICATION:</strong> {law.relevance}
                                                                            </Typography>
                                                                        </Box>
                                                                    </CardContent>
                                                                </Card>
                                                            </Grid>
                                                        ))}
                                                    </>
                                                )}
                                            </Grid>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </Box>
                        )}

                        {/* Step 3: Precedents */}
                        {activeStep === 3 && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <Typography variant="h5" fontWeight="bold">4. Supreme Court Precedents</Typography>
                                
                                {caseData.precedents.length === 0 && !loading ? (
                                    <Paper 
                                        sx={{ 
                                            p: 6, 
                                            textAlign: 'center', 
                                            borderRadius: 4, 
                                            bgcolor: 'action.hover', 
                                            border: '2px dashed', 
                                            borderColor: 'secondary.main', 
                                            opacity: 0.9
                                        }}
                                    >
                                        <Balance sx={{ fontSize: 60, mb: 2, color: 'secondary.main', opacity: 0.5 }} />
                                        <Typography variant="h6" gutterBottom fontWeight="bold">
                                            Establish Stare Decisis
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 4, maxWidth: 500, mx: 'auto' }}>
                                            Search thousands of Supreme Court and High Court judgments to find matching ratios that support your client's position.
                                        </Typography>
                                        <Button 
                                            variant="contained" 
                                            color="secondary"
                                            size="large"
                                            startIcon={<Search />} 
                                            onClick={handleFindPrecedents}
                                            sx={{ borderRadius: 3, px: 6, py: 1.5 }}
                                        >
                                            Search Case Law Database
                                        </Button>
                                    </Paper>
                                ) : (
                                    <Stack spacing={3}>
                                        {loading ? (
                                            <Box sx={{ textAlign: 'center', py: 15, bgcolor: 'rgba(156, 39, 176, 0.04)', borderRadius: 4, border: '1px solid', borderColor: 'secondary.light' }}>
                                                <Box sx={{ position: 'relative', display: 'inline-flex', mb: 4 }}>
                                                    <CircularProgress size={100} thickness={2} sx={{ color: 'rgba(156, 39, 176, 0.2)' }} color="secondary" />
                                                    <CircularProgress
                                                        size={100}
                                                        thickness={4}
                                                        color="secondary"
                                                        sx={{
                                                            position: 'absolute',
                                                            left: 0,
                                                            [`& .MuiCircularProgress-circle`]: { strokeLinecap: 'round' },
                                                        }}
                                                    />
                                                    <Balance sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: 40, color: 'secondary.main' }} />
                                                </Box>
                                                <Typography variant="h5" sx={{ fontWeight: '800', letterSpacing: 1 }} color="secondary">
                                                    {statusMessage || 'Querying Supreme Court Archive...'}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>
                                                    Applying semantic filters to 50,000+ legal precedents...
                                                </Typography>
                                            </Box>
                                        ) : (
                                            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
                                                <Paper sx={{ 
                                                    p: 3, 
                                                    bgcolor: 'secondary.main', 
                                                    color: 'white', 
                                                    borderRadius: 4, 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    justifyContent: 'center',
                                                    gap: 2, 
                                                    boxShadow: '0 10px 30px rgba(156, 39, 176, 0.3)',
                                                    mb: 2
                                                }}>
                                                    <CheckCircle sx={{ fontSize: 32 }} />
                                                    <Typography variant="h6" fontWeight="900">
                                                        PRECEDENT SEARCH COMPLETE: {caseData.precedents.length} Key Judgments Secured
                                                    </Typography>
                                                </Paper>
                                            </motion.div>
                                        )}
                                        
                                        {searchSummary && (
                                            <Paper sx={{ p: 3, bgcolor: 'primary.light', color: 'primary.contrastText', borderRadius: 3, borderLeft: '6px solid', borderColor: 'primary.main' }}>
                                                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Intelligence Summary:</Typography>
                                                <Typography variant="body2">{searchSummary}</Typography>
                                            </Paper>
                                        )}
                                        {searchMetadata.lastPrecedentQuery && (
                                            <Alert severity="info" variant="outlined" sx={{ borderRadius: 2, mb: 2 }}>
                                                <strong>AI Legal Scan Query:</strong> {searchMetadata.lastPrecedentQuery}
                                            </Alert>
                                        )}
                                        {caseData.precedents.length === 0 && !loading && (
                                            <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'action.hover', borderRadius: 3 }}>
                                                <Typography color="text.secondary" gutterBottom>
                                                    No direct precedents found for this specific factual query in our current index.
                                                </Typography>
                                                <Typography variant="caption" display="block" sx={{ mb: 2 }}>
                                                    The AI Strategist can still build a case based on statutory laws in the next step.
                                                </Typography>
                                                <Button variant="outlined" color="secondary" onClick={handleFindPrecedents}>Try broader search</Button>
                                            </Paper>
                                        )}
                                        <Grid container spacing={3}>
                                            {caseData.precedents?.map((p, i) => (
                                                <Grid item xs={12} key={i}>
                                                    <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', position: 'relative', overflow: 'hidden' }}>
                                                        {p.priority && (
                                                            <Box sx={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', bgcolor: p.priority === 1 ? 'error.main' : 'primary.main' }} />
                                                        )}
                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                                            <Box>
                                                                <Typography variant="h6" color="secondary.main" fontWeight="bold">{p.caseTitle || p.caseName}</Typography>
                                                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>{p.citation}</Typography>
                                                            </Box>
                                                            <Stack direction="row" spacing={1}>
                                                                {p.matchType && (
                                                                    <Chip 
                                                                        label={p.matchType.toUpperCase()} 
                                                                        size="small" 
                                                                        variant="outlined"
                                                                        sx={{ fontSize: '0.6rem', fontWeight: 'bold' }}
                                                                    />
                                                                )}
                                                                <Chip label="MANDATORY" size="small" color="secondary" sx={{ fontSize: '0.6rem', fontWeight: 'bold' }} />
                                                            </Stack>
                                                        </Box>
                                                        
                                                        <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2, mb: 3 }}>
                                                            <Typography variant="subtitle2" fontWeight="bold" gutterBottom color="primary">Ratio Decidendi:</Typography>
                                                            <Typography variant="body2" sx={{ lineHeight: 1.6 }}>{p.ratio}</Typography>
                                                        </Box>

                                                        {p.matchReason && (
                                                            <Box sx={{ p: 2, bgcolor: 'secondary.light', borderRadius: 2, mb: 3, border: '1px solid', borderColor: 'secondary.main' }}>
                                                                <Typography variant="caption" fontWeight="bold" display="block" color="secondary.contrastText">⚖️ STRATEGIC RELEVANCE (AI Analysis):</Typography>
                                                                <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'secondary.contrastText' }}>{p.matchReason}</Typography>
                                                            </Box>
                                                        )}

                                                        <Stack direction="row" spacing={2} sx={{ mt: 2, pt: 2, borderTop: '1px dotted', borderColor: 'divider' }}>
                                                            <Typography variant="caption" color="text.secondary"><strong>Application:</strong> {p.application}</Typography>
                                                            {p.searchScore && (
                                                                <Typography variant="caption" color="text.secondary"><strong>Match Confidence:</strong> {(parseFloat(p.searchScore) * 100).toFixed(0)}%</Typography>
                                                            )}
                                                        </Stack>
                                                    </Paper>
                                                </Grid>
                                            ))}
                                        </Grid>
                                        {loading && (
                                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                                <CircularProgress size={40} color="secondary" />
                                                <Typography variant="body1" sx={{ mt: 2, fontWeight: 'medium' }} color="secondary">
                                                    {statusMessage || 'Searching Supreme Court and High Court judgments... Please wait.'}
                                                </Typography>
                                            </Box>
                                        )}
                                    </Stack>
                                )}
</Box>
                        )}

                        {/* Step 4: Strategy */}
                        {activeStep === 4 && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="h5" fontWeight="bold">5. Strategic Memorandum</Typography>
                                    {caseData.strategy && (
                                        <Stack direction="row" spacing={2}>
                                            <Button variant="outlined" startIcon={<ContentCopy />} onClick={() => navigator.clipboard.writeText(caseData.strategy)}>Copy</Button>
                                            <Button variant="contained" startIcon={<Download />} onClick={handleDownloadPDF} color="secondary">PDF Export</Button>
                                        </Stack>
                                    )}
                                </Box>

                                {!caseData.strategy ? (
                                    <Paper sx={{ textAlign: 'center', py: 12, borderRadius: 4, border: '2px dashed', borderColor: 'divider' }}>
                                        <Lightbulb sx={{ fontSize: 60, mb: 2, opacity: 0.3 }} color="primary" />
                                        <Typography variant="h6" gutterBottom>Synthesize Intelligence into Strategy</Typography>
                                        <Button variant="contained" size="large" onClick={handleGenerateStrategy} disabled={loading} startIcon={<Gavel />}>
                                            {loading ? <CircularProgress size={24} color="inherit" /> : 'Draft Memorandum'}
                                        </Button>
                                    </Paper>
                                ) : (
                                    <Paper 
                                        elevation={6} 
                                        sx={{ 
                                            p: { xs: 4, md: 8 }, 
                                            bgcolor: 'white', 
                                            color: '#1a1a1a', 
                                            fontFamily: '"Georgia", serif',
                                            borderRadius: 2,
                                            maxWidth: '900px',
                                            mx: 'auto',
                                            minHeight: '1000px',
                                            boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
                                            '& h1': { fontSize: '28pt', textAlign: 'center', mb: 4, borderBottom: '3px solid black', pb: 2 },
                                            '& h2': { fontSize: '18pt', fontWeight: 'bold', mb: 2, mt: 4, color: '#2c3e50' },
                                            '& p': { fontSize: '11pt', lineHeight: 1.8, mb: 2, textAlign: 'justify' },
                                            '& strong': { color: '#000' }
                                        }}
                                    >
                                        <ReactMarkdown>{caseData.strategy}</ReactMarkdown>
                                        <Divider sx={{ my: 8 }} />
                                        <Typography variant="caption" display="block" textAlign="center" color="text.secondary">
                                            CERTIFIED BY LEGALYZE AI STRATEGY MODULE
                                        </Typography>
                                    </Paper>
                                )}
                            </Box>
                        )}

                        {/* Step 5: Filing Details (Custom Form) */}
                        {activeStep === 5 && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box>
                                        <Typography variant="h5" fontWeight="bold">6. Filing Details</Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {selectedTemplateId && templates[selectedTemplateId] 
                                                ? `Please provide the specific details for the ${templates[selectedTemplateId].name}.`
                                                : "Please provide the specific details required to complete your petition package."}
                                        </Typography>
                                    </Box>
                                    <Chip 
                                        icon={<Gavel />} 
                                        label={templates[selectedTemplateId]?.name || "Article 199 Package"} 
                                        color="primary" 
                                        variant="outlined" 
                                    />
                                </Box>

                                <Paper sx={{ p: 4, borderRadius: 3, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
                                    <Typography variant="subtitle2" sx={{ mb: 3, color: 'primary.main', fontWeight: 'bold' }}>
                                        REQUIRED FACTUAL FIELDS
                                    </Typography>
                                    <Grid container spacing={3}>
                                        {/* Group fields by section for better readability */}
                                        {(() => {
                                            const currentFields = (templates[selectedTemplateId]?.requiredFields || Object.values(templates)[0]?.requiredFields || []);
                                            const sections = [...new Set(currentFields.map(f => f.section || 'General Details'))];
                                            
                                            return sections.map(section => (
                                                <React.Fragment key={section}>
                                                    <Grid item xs={12}>
                                                        <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 'bold', letterSpacing: 1.2, borderBottom: '1px solid', borderColor: 'divider', pb: 0.5, mb: 1, display: 'block' }}>
                                                            {section}
                                                        </Typography>
                                                    </Grid>
                                                    {currentFields.filter(f => (f.section || 'General Details') === section).map((field) => (
                                                        <Grid item xs={12} md={field.type === 'textarea' ? 12 : 6} key={field.id}>
                                                            <TextField
                                                                fullWidth
                                                                label={field.label}
                                                                placeholder={field.placeholder}
                                                                multiline={field.type === 'textarea'}
                                                                rows={field.type === 'textarea' ? 4 : 1}
                                                                variant="outlined"
                                                                value={factualInputs[field.id] || ''}
                                                                onChange={(e) => setFactualInputs(prev => ({ ...prev, [field.id]: e.target.value }))}
                                                                InputProps={{
                                                                    sx: { borderRadius: 2 }
                                                                }}
                                                            />
                                                        </Grid>
                                                    ))}
                                                </React.Fragment>
                                            ));
                                        })()}
                                    </Grid>
                                    
                                    {/* Removed the redundant Complete Filing Details button as per user request */}
                                </Paper>
                            </Box>
                        )}

                        {/* Step 6: Drafting */}
                        {activeStep === 6 && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <Typography variant="h5" fontWeight="bold">7. Legal Document Drafting</Typography>
                                <Button 
                                    variant="contained" 
                                    size="large" 
                                    startIcon={<Description />} 
                                    onClick={handleGenerateDocuments}
                                    disabled={loading}
                                    sx={{ alignSelf: 'center', py: 2, px: 6, borderRadius: 3 }}
                                >
                                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Generate Petition / Application'}
                                </Button>

                                <Stack spacing={6}>
                                    {caseData.documents.map((doc, i) => (
                                        <Box key={i}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                                <Typography variant="h6" fontWeight="bold" color="primary">{doc.type}</Typography>
                                                <Stack direction="row" spacing={2}>
                                                    <Button 
                                                        variant="outlined" 
                                                        startIcon={<ContentCopy />} 
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(doc.content);
                                                            // Could add a toast here
                                                        }}
                                                    >
                                                        Copy Text
                                                    </Button>
                                                    <Button 
                                                        variant="contained" 
                                                        color="secondary"
                                                        startIcon={<PictureAsPdf />} 
                                                        onClick={() => handleExportDocumentPDF(i)}
                                                    >
                                                        Export as PDF
                                                    </Button>
                                                </Stack>
                                            </Box>
                                            
                                            <Paper 
                                                elevation={4} 
                                                sx={{ 
                                                    p: { xs: 4, md: 12 }, 
                                                    bgcolor: 'white', 
                                                    color: '#000', 
                                                    fontFamily: '"Times New Roman", Times, serif',
                                                    borderRadius: 1,
                                                    border: '1px solid',
                                                    borderColor: '#ddd',
                                                    maxWidth: '850px',
                                                    mx: 'auto',
                                                    minHeight: '1100px',
                                                    boxShadow: '0 15px 50px rgba(0,0,0,0.1)',
                                                    position: 'relative',
                                                    lineHeight: 1.6,
                                                    '& .legal-content': {
                                                        fontSize: '13pt',
                                                        textAlign: 'justify',
                                                        '& h1': { textAlign: 'center', fontSize: '18pt', fontWeight: 'bold', textTransform: 'uppercase', mb: 4, mt: 4 },
                                                        '& h2': { textAlign: 'center', fontSize: '16pt', fontWeight: 'bold', textTransform: 'uppercase', mb: 3, mt: 3 },
                                                        '& h3': { textAlign: 'center', fontSize: '14pt', fontWeight: 'bold', textTransform: 'uppercase', mb: 3 },
                                                        '& h4': { textAlign: 'center', fontSize: '13pt', fontWeight: 'bold', textDecoration: 'underline', mt: 4, mb: 2 },
                                                        '& p': { mb: 2, textAlign: 'justify', lineHeight: 2 },
                                                        '& table': {
                                                            width: '100%',
                                                            borderCollapse: 'collapse',
                                                            my: 4,
                                                            '& th, & td': { border: '1px solid #000', p: 1.5, textAlign: 'left' },
                                                            '& th': { bgcolor: '#f5f5f5', fontWeight: 'bold' }
                                                        },
                                                        '& hr': { border: 'none', borderTop: '2px solid #000', my: 5 },
                                                        '& strong': { fontWeight: 'bold' },
                                                        '& em': { fontStyle: 'italic' },
                                                        '& blockquote': { border: '1px solid #eee', p: 2, bgcolor: '#fafafa', borderRadius: 1 }
                                                    }
                                                }}
                                            >
                                                <Box 
                                                    className="legal-content"
                                                    dangerouslySetInnerHTML={{ __html: doc.content }}
                                                />
                                                
                                                <Divider sx={{ my: 6, borderColor: 'rgba(0,0,0,0.1)' }} />
                                                <Box sx={{ textAlign: 'center', opacity: 0.5 }}>
                                                    <Typography variant="caption" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                                                        Generated by Legalyze AI - {new Date().toLocaleDateString()}
                                                    </Typography>
                                                </Box>
                                            </Paper>
                                        </Box>
                                    ))}
                                </Stack>

</Box>
                        )}
                    </motion.div>
                </AnimatePresence>
            </Box>

            {/* Global Fixed Action Bar */}
            <Box sx={{ 
                mt: 4, 
                pt: 3, 
                borderTop: '1px solid', 
                borderColor: 'divider', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                bgcolor: 'background.default'
            }}>
                <Button 
                    disabled={activeStep === 0 || loading} 
                    onClick={() => {
                        setActiveStep(prev => prev - 1);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    startIcon={<ArrowBack />}
                >
                    Back
                </Button>
                
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    {loading && <CircularProgress size={20} />}
                    <Typography variant="caption" color="text.secondary">
                        Step {activeStep + 1} of {STEPS.length}
                    </Typography>
                </Box>

                <Button 
                    variant="contained"
                    color={activeStep === STEPS.length - 1 ? "success" : "primary"}
                    disabled={loading || 
                        (activeStep === 0 && !caseData.facts.trim()) ||
                        (activeStep === 1 && !caseData.classification) ||
                        (activeStep === 2 && !(searchMetadata.lawsSearched || caseData.relevantLaws.length > 0)) || // Updated step index
                        (activeStep === 3 && !(searchMetadata.precedentsSearched || caseData.precedents.length > 0)) || // Updated step index
                        (activeStep === 4 && !caseData.strategy) || // Updated step index
                        (activeStep === 5 && Object.values(factualInputs).length === 0) // Filing details check
                    }
                    onClick={async () => {
                        if (activeStep === STEPS.length - 1) {
                            onClose();
                        } else if (activeStep === 5) {
                            // Step 6: Filing Details - Save before proceeding
                            const saved = await handleSaveFilingDetails();
                            if (saved) {
                                setActiveStep(prev => prev + 1);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }
                        } else {
                            setActiveStep(prev => prev + 1);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                    }}
                    endIcon={activeStep === STEPS.length - 1 ? <CheckCircle /> : <ArrowForward />}
                >
                    {activeStep === STEPS.length - 1 ? 'Complete Build' : 'Next Step'}
                </Button>
            </Box>
        </Box>
    );
};

export default CaseBuildingWizard;
