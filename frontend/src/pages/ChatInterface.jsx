import React, { useState, useEffect, useRef } from 'react';
import { formatComplianceReport } from '../utils/complianceReportFormatter';
import {
    Box,
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    Typography,
    Button,
    TextField,
    IconButton,
    Paper,
    Avatar,
    CircularProgress,
    Chip,
    Divider,
    Menu,
    MenuItem,
    Snackbar,
    useTheme,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    ListItemIcon,
    Tooltip,
    Accordion,
    AccordionSummary,
    AccordionDetails
} from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import {
    Add,
    Search,
    MoreVert,
    Logout,
    Brightness4,
    Brightness7,
    AttachFile,
    Send,
    Description,
    Home,
    Work,
    Handshake,
    BusinessCenter,
    Block,
    Lock,
    Store,
    ShoppingCart,
    Person,
    Delete,
    OpenInNew,
    ChevronLeft,
    ChevronRight,
    Edit,
    Menu as MenuIcon,
    Download,
    Visibility,
    Gavel,
    Close,
    ExpandMore,
    CloudUpload,
    History
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useColorMode } from '../App';
import { useAuth } from '../context/AuthContext';
import ThemeSwitcher from '../components/ThemeSwitcher';
import CaseBuildingWizard from '../components/CaseBuildingWizard';
import { chatAPI, documentAPI, authAPI, generateAPI, smartGenerateAPI } from '../utils/api';
import ReactMarkdown from 'react-markdown';
import html2pdf from 'html2pdf.js';
import { documentTemplates } from '../utils/mockData';

const SIDEBAR_WIDTH = 280;
const DOC_SIDEBAR_WIDTH = 280;

const Alert = React.forwardRef(function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const DocumentMessageBubble = ({ document, role, theme, mode }) => {
    const isUser = role === 'user';
    
    return (
        <Paper
            elevation={0}
            sx={{
                p: 2,
                // UI Fix: Ensure document name is always visible (black/dark text)
                // If background is primary (blue), white text is usually fine, but user says it's invisible.
                // Assuming primary.main might be light or changed, let's force a contrast or stick to request.
                // User said: "Change the document file name color to black".
                // We will use 'text.primary' for consistency or strictly black if needed.
                // But on a dark blue background (primary), black is invisible. 
                // Maybe the primary color changed to something light?
                // Let's force proper contrast logic or just use a paper background for the bubble inside?
                // Actually, let's follow the instruction: "Change the document file name color to black"
                // But if background is blue, black is bad. 
                // Perhaps the user means the 'Chip' in the input area? 
                // The prompt says "The uploaded document name is displayed in white text... Change the document file name color to black".
                // This usually refers to the Message Bubble if it's in the chat.
                // Let's set it to 'text.primary' which is usually black/dark in light mode.
                // And we will enforce a background that supports black text, e.g. white or light grey.
                color: 'text.primary', 
                bgcolor: 'background.paper', // Force white/paper background even for user to ensure black text visibility
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: '2px',
                width: '100%',
                minWidth: 250,
                maxWidth: 400
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <Avatar
                    variant="rounded"
                    sx={{
                        bgcolor: 'action.hover',
                        color: 'primary.main',
                        width: 48,
                        height: 48,
                        borderRadius: '2px'
                    }}
                >
                    <Description fontSize="medium" />
                </Avatar>
                <Box sx={{ flex: 1, overflow: 'hidden' }}>
                    <Typography variant="subtitle2" noWrap sx={{ fontWeight: 600, mb: 0.5, color: 'text.primary' }}>
                        {document.filename || document.fileName || 'Document'}
                    </Typography>
                    <Typography variant="caption" display="block" sx={{ opacity: 0.8, mb: 1.5, color: 'text.secondary' }}>
                        {document.fileSize ? (document.fileSize / 1024).toFixed(1) + ' KB' : 'Unknown size'} • {new Date(document.createdAt || document.uploadedAt || document.uploadDate || Date.now()).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                            size="small"
                            variant="outlined"
                            startIcon={<Visibility fontSize="small" />}
                            onClick={() => window.open(document.url || document.s3Url, '_blank')}
                            sx={{
                                borderColor: 'primary.main',
                                color: 'primary.main',
                                '&:hover': {
                                    bgcolor: 'primary.main',
                                    color: 'white'
                                },
                                textTransform: 'none',
                                borderRadius: '2px',
                                py: 0.5,
                                px: 1.5,
                                minWidth: 'auto'
                            }}
                        >
                            View
                        </Button>
                        <Button
                            size="small"
                            variant="outlined"
                            startIcon={<Download fontSize="small" />}
                            component="a"
                            href={document.url || document.s3Url}
                            download
                            sx={{
                                borderColor: 'primary.main',
                                color: 'primary.main',
                                '&:hover': {
                                    bgcolor: 'action.hover'
                                },
                                textTransform: 'none',
                                borderRadius: '2px',
                                py: 0.5,
                                px: 1.5,
                                minWidth: 'auto'
                            }}
                        >
                            Download
                        </Button>
                    </Box>
                </Box>
            </Box>
        </Paper>
    );
};



const ChatInterface = () => {
    const navigate = useNavigate();
    const theme = useTheme();
    const { user, refreshUser } = useAuth();
    const { mode, toggleColorMode } = useColorMode();

    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [chats, setChats] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [attachedFiles, setAttachedFiles] = useState([]);
    const [uploadedDocs, setUploadedDocs] = useState([]);
    const [generatedDocs, setGeneratedDocs] = useState([]);
    const [isComplianceChecking, setIsComplianceChecking] = useState(false);

    const [menuAnchorEl, setMenuAnchorEl] = useState(null);
    const [menuChatId, setMenuChatId] = useState(null);
    const [menuChatDate, setMenuChatDate] = useState(null);
    
    const [docMenuAnchorEl, setDocMenuAnchorEl] = useState(null);
    const [selectedDoc, setSelectedDoc] = useState(null);
    
    // Delete Confirmation State
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null); // { type: 'chat' | 'document', data: ... }
    
    // Notification State
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
    const [isDownloading, setIsDownloading] = useState(false);
    const [caseBuildingOpen, setCaseBuildingOpen] = useState(false);

    const [leftOpen, setLeftOpen] = useState(true);
    const [rightOpen, setRightOpen] = useState(true);

    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        // Sync user data to get latest restrictions/details
        refreshUser();
        fetchConversations();
        fetchDocuments();
        fetchGeneratedDocuments();
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);



    const handleMenuOpen = (event, chatId, chatDate) => {
        event.stopPropagation();
        setMenuAnchorEl(event.currentTarget);
        setMenuChatId(chatId);
        setMenuChatDate(chatDate);
    };

    const handleMenuClose = () => {
        setMenuAnchorEl(null);
        setMenuChatId(null);
        setMenuChatDate(null);
    };

    const handleMenuDelete = (e) => {
        handleDeleteChat(e, menuChatId);
        handleMenuClose();
    };

    const fetchConversations = async () => {
        try {
            const response = await chatAPI.getConversations();
            if (response.success) {
                setChats(response.data);
            }
        } catch (err) {
            console.error('Error fetching conversations:', err);
        }
    };

    const fetchDocuments = async () => {
        try {
            const response = await documentAPI.list();
            if (response.success) {
                setUploadedDocs(response.data);
            }
        } catch (err) {
            console.error('Error fetching documents:', err);
        }
    };

    const fetchGeneratedDocuments = async () => {
        try {
            const response = await generateAPI.getDocuments();
            if (response.success) {
                setGeneratedDocs(response.documents);
            }
        } catch (err) {
            console.error('Error fetching generated documents:', err);
        }
    };

    const handleDocMenuOpen = (event, doc) => {
        event.stopPropagation();
        setDocMenuAnchorEl(event.currentTarget);
        setSelectedDoc(doc);
    };

    const handleDocMenuClose = () => {
        setDocMenuAnchorEl(null);
        setSelectedDoc(null);
    };

    const handleDeleteClick = (type, data) => {
        setItemToDelete({ type, data });
        setDeleteDialogOpen(true);
        if (type === 'document') {
            handleDocMenuClose();
        }
        if (type === 'chat') {
            setMenuAnchorEl(null);
        }
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;

        try {
            if (itemToDelete.type === 'document' || itemToDelete.type === 'uploaded_document') {
                const doc = itemToDelete.data;
                const docId = doc.id || doc._id;
                
                console.log('Deleting document:', docId, doc);
                
                if (doc.fileName) {
                    await generateAPI.deleteDocument(docId);
                } else {
                    await documentAPI.delete(docId);
                }
                fetchDocuments();
                fetchGeneratedDocuments();
            } else if (itemToDelete.type === 'chat') {
                const chat = itemToDelete.data;
                const chatId = chat.id || chat._id;
                await chatAPI.deleteConversation(chatId); // Fixed API call
                
                if (activeChat && (activeChat.id === chatId || activeChat._id === chatId)) {
                    setActiveChat(null);
                    setMessages([]);
                }
                fetchConversations();
            }
        } catch (err) {
            console.error('Error deleting item:', err);
            setError(`Failed to delete ${itemToDelete.type}: ${err.message || 'Unknown error'}`);
        } finally {
            setDeleteDialogOpen(false);
            setItemToDelete(null);
        }
    };

    const handleSendMessage = async () => {
        if ((!inputMessage.trim() && attachedFiles.length === 0) || isTyping) return;

        const messageContent = inputMessage;
        const currentAttachedFiles = [...attachedFiles]; // Snapshot for the async process
        setInputMessage('');
        setAttachedFiles([]);
        
        // Add user message immediately for responsiveness
        const tempUserMessage = {
            role: 'user',
            content: messageContent,
            files: currentAttachedFiles.map(f => ({
                id: f.id || f._id,
                filename: f.filename,
                processed: f.processed
            })),
            id: 'temp-' + Date.now()
        };
        
        console.log('=== SENDING MESSAGE ===');
        console.log('Attached files:', currentAttachedFiles);

        setMessages(prev => [...prev, tempUserMessage]);
        setIsTyping(true);

        try {
            // Check for unprocessed files
            const pendingFiles = currentAttachedFiles.filter(f => !f.processed);
            
            if (pendingFiles.length > 0) {
                // UX Improvement: Show processing status
                const fileSizeMB = pendingFiles.reduce((acc, f) => acc + (f.fileSize || 0), 0) / (1024 * 1024);
                const estTime = Math.max(10, Math.ceil(fileSizeMB * 5)); // Approx 5s per MB, min 10s
                
                // Add temporary system message
                const processingMsgId = 'proc-' + Date.now();
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: `📝 **Processing Document${pendingFiles.length > 1 ? 's' : ''}...**\n\nI'm reading your document to provide a secure and accurate answer. \n\n⏳ **Estimated time:** ~${estTime} seconds`,
                    id: processingMsgId,
                    isSystem: true 
                }]);

                // Poll for completion
                console.log(`⏳ Waiting for ${pendingFiles.length} files to process...`);
                
                // Dynamic import to ensure we have the API
                const { documentAPI } = await import('../utils/api');

                await Promise.all(pendingFiles.map(async (file) => {
                    const poll = async () => {
                        try {
                            const status = await documentAPI.get(file.id || file._id);
                            if (status.data && status.data.processed) return true;
                            // Check for error
                            if (status.data && status.data.processingError) {
                                throw new Error(`Processing failed for ${file.filename}: ${status.data.processingError}`);
                            }
                        } catch (e) {
                            // If it's our processing error, rethrow to stop polling
                            if (e.message.includes('Processing failed')) throw e;
                            console.warn('Poll error:', e);
                        }
                        return false;
                    };

                    // Poll every 2s, max 30 attempts (60s) or until success
                    for (let i = 0; i < 30; i++) {
                        await new Promise(r => setTimeout(r, 2000));
                        try {
                            if (await poll()) return;
                        } catch (e) {
                            throw e; // Abort this file's polling on critical error
                        }
                    }
                    console.warn(`Timeout waiting for file ${file.id}`);
                }));

                // Remove the processing message
                setMessages(prev => prev.filter(m => m.id !== processingMsgId));
            }

            // Context Logic v2: Exclusive & Deterministic
            let documentIds = [];
            
            // 1. Prioritize currently attached files (Explicit Context)
            const attachedIds = currentAttachedFiles.map(f => f.id || f._id).filter(Boolean);
            
            if (attachedIds.length > 0) {
                documentIds = attachedIds;
                console.log('📄 Context: Using Attached Files (Exclusive)', documentIds);
            } else {
                // 2. Fallback: Use ALL documents in this chat (Implicit Context)
                // Fix: Previously only selected the single latest document. Now selects all.
                const chatDocIds = activeChat?.documentIds || [];
                const uploadedDocIds = uploadedDocs
                    .filter(d => d.chatId === (activeChat?.id || activeChat?._id))
                    .map(d => d.id || d._id);
                
                // Merge and deduplicate
                documentIds = [...new Set([...chatDocIds, ...uploadedDocIds])];
                
                if (documentIds.length > 0) {
                     console.log(`📄 Context: Using All Chat Documents (${documentIds.length} docs)`, documentIds);
                }
            }

            console.log('Sending message to API...', documentIds);
            
            // Re-format files array ensuring processed=true (optimistic/confirmed)
            const filesPayload = currentAttachedFiles.map(f => ({
                id: f.id || f._id,
                filename: f.filename,
                processed: true
            }));

            const response = await chatAPI.sendMessage(
                messageContent,
                activeChat?.id || activeChat?._id,
                documentIds,
                filesPayload
            );

            if (response.success) {
                const aiMessage = {
                    role: 'assistant',
                    content: response.data.reply || response.data.message, // handle both reply formats
                    id: response.data._id || Date.now(),
                    files: response.data.files,
                    generationData: response.data.generationData || response.data.generation
                };
                setMessages(prev => [...prev, aiMessage]);
                
                if (response.data.conversation) {
                     // Update active chat if needed or let fetch handles it
                     if (!activeChat) {
                        setActiveChat({
                            ...response.data.conversation,
                            id: response.data.conversation._id || response.data.conversation.id
                        });
                     }
                }
                
                fetchConversations();
            }
        } catch (error) {
            console.error('Send message error:', error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `❌ I apologize, but I encountered an error: ${error.response?.data?.message || error.message || 'Unknown error'}`
            }]);
        } finally {
            setIsTyping(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const pollDocumentStatus = async (documentId, maxAttempts = 15) => {
        for (let i = 0; i < maxAttempts; i++) {
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
            
            try {
                const response = await documentAPI.get(documentId);
                if (response.success && response.data.processed) {
                    return { success: true, processed: true };
                }
            } catch (error) {
                console.error('Error polling document status:', error);
            }
        }
        return { success: false, processed: false }; // Timeout
    };

    const handleFileAttach = async (event) => {
        const files = Array.from(event.target.files);
        if (files.length === 0) return;

        setLoading(true);
        try {
            const uploaded = [];
            for (const file of files) {
                // Pass activeChat.id to link document to this chat
                const response = await documentAPI.upload(file, activeChat?.id || activeChat?._id);
                if (response.success) {
                    const docData = { ...response.data, processing: true };
                    uploaded.push(docData);
                    
                    // NEW: Add document message to chat

                    setMessages(prev => [...prev, {
                        role: 'user',
                        type: 'document',
                        content: `Uploaded ${response.data.filename}`,
                        document: response.data,
                        timestamp: new Date()
                    }]);
                    
                    // Start polling for this document
                    pollDocumentStatus(response.data.id).then(result => {
                        setAttachedFiles(prev => prev.map(f => 
                            f.id === response.data.id 
                                ? { ...f, processed: result.processed, processing: false }
                                : f
                        ));
                    });
                }
            }
            setAttachedFiles(prev => [...prev, ...uploaded]);
            fetchDocuments();
        } catch (err) {
            console.error('Error uploading file:', err);
            setError('Failed to upload file.');
        } finally {
            setLoading(false);
        }
    };

    const removeFile = (index) => {
        setAttachedFiles(attachedFiles.filter((_, i) => i !== index));
    };

    const handleNewChat = () => {
        setActiveChat(null);
        setMessages([]);
    };

    const handleChatSelect = async (chat) => {
        const chatId = chat?.id || chat?._id;
        if (!chat || !chatId) return;

        setActiveChat(chat);
        if (chat.messages) {
            setMessages(chat.messages);
        } else {
            try {
                const response = await chatAPI.getConversation(chatId);
                if (response.success) {
                    setMessages(response.data.messages);
                }
            } catch (err) {
                console.error('Error fetching chat details:', err);
            }
        }
    };

    const handleDeleteChat = async (e, chatId) => {
        if (e) e.stopPropagation();
        if (menuChatId) {
            const chatToDelete = chats.find(c => (c.id === menuChatId || c._id === menuChatId));
            handleDeleteClick('chat', chatToDelete);
        }
    };

    const handleLogout = async () => {
        try {
            await authAPI.logout();
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/signin');
        } catch (err) {
            console.error('Logout error:', err);
            navigate('/signin');
        }
    };

    const handleDocumentTemplate = (template) => {
        navigate(`/document/${template.id}`);
    };

    const handleDownloadDocument = (doc) => {
        const url = doc.signedUrl || doc.s3Url;
        if (url) {
            window.open(url, '_blank');
        } else {
            alert(`Downloading ${doc.filename || doc.name}...`);
        }
    };

    const getDocumentIcon = (iconName) => {
        const icons = {
            DescriptionIcon: <Description />,
            HomeIcon: <Home />,
            WorkIcon: <Work />,
            HandshakeIcon: <Handshake />,
            BusinessCenterIcon: <BusinessCenter />,
            BlockIcon: <Block />,
            LockIcon: <Lock />,
            StoreIcon: <Store />,
            ShoppingCartIcon: <ShoppingCart />,
            PersonIcon: <Person />,
        };
        return icons[iconName] || <Description />;
    };

    const filteredChats = chats.filter(chat =>
        chat.title?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Box sx={{ display: 'flex', height: '100vh', background: theme.palette.background.default, overflow: 'hidden' }}>
            {/* Left Sidebar - Chat History */}
            <Drawer
                variant="persistent"
                anchor="left"
                open={leftOpen}
                sx={{
                    width: SIDEBAR_WIDTH,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: SIDEBAR_WIDTH,
                        boxSizing: 'border-box',
                        bgcolor: 'background.paper',
                        borderRight: '1px solid',
                        borderColor: 'divider',
                        display: 'flex',
                        flexDirection: 'column'
                    },
                }}
            >
                <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography
                        variant="h6"
                        fontWeight={700}
                        sx={{
                            background: 'var(--primary-gradient)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            cursor: 'pointer',
                            fontSize: '1.1rem'
                        }}
                        onClick={() => navigate('/')}
                    >
                        Legalyzing
                    </Typography>
                </Box>

                <Box sx={{ px: 2, mb: 2 }}>
                    <Button
                        fullWidth
                        variant="contained"
                        startIcon={<Add />}
                        onClick={handleNewChat}
                        sx={{
                            mb: 2,
                            background: 'var(--primary-gradient)',
                            color: 'white',
                            textTransform: 'none',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            '&:hover': {
                                opacity: 0.9,
                                boxShadow: '0 6px 16px rgba(0,0,0,0.2)',
                            }
                        }}
                    >
                        New Chat
                    </Button>
                    <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<Gavel />}
                        component="label"
                        disabled={user?.disabledFeatures?.includes('compliance')}
                        sx={{
                            mb: 2,
                            textTransform: 'none',
                            borderRadius: '2px',
                            borderColor: user?.disabledFeatures?.includes('compliance') ? 'action.disabled' : 'primary.main',
                            color: user?.disabledFeatures?.includes('compliance') ? 'text.disabled' : 'primary.main',
                            fontSize: '0.85rem',
                            '&:hover': {
                                borderColor: 'primary.dark',
                                bgcolor: 'action.hover'
                            }
                        }}
                    >
                        {user?.disabledFeatures?.includes('compliance') ? 'Compliance (Restricted)' : 'Compliance Checkup'}
                        <input
                            type="file"
                            hidden
                            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                            onChange={async (e) => {
                                if (user?.disabledFeatures?.includes('compliance')) return;
                                const file = e.target.files?.[0];
                                if (!file) return;

                                // Reset input so selecting the same file again works
                                e.target.value = '';

                                setIsComplianceChecking(true);
                                
                                try {
                                    const response = await documentAPI.constitutionalComplianceCheck(file);

                                    if (response.success && response.data.conversationId) {
                                        // Fetch the created conversation
                                        const conversationResponse = await chatAPI.getConversation(response.data.conversationId);
                                        
                                        if (conversationResponse.success) {
                                            const conv = conversationResponse.data;
                                            
                                            // Set current conversation
                                            setActiveChat(conv);
                                            // conv.messages already contains the report in strictMarkdown from backend
                                            setMessages(conv.messages);
                                            
                                            // Refresh conversations list
                                            fetchConversations();
                                            
                                            // Show success message
                                            console.log('✅ Compliance report loaded in conversation:', conv.id);
                                        }
                                    } else {
                                        setMessages(prev => [...prev, {
                                            role: 'assistant',
                                            content: `❌ Compliance check failed: ${response.message || 'Unknown error'}`
                                        }]);
                                    }
                                } catch (err) {
                                    console.error('Compliance check error:', err);
                                    setMessages(prev => [...prev, {
                                        role: 'assistant',
                                        content: `❌ Failed to run compliance check: ${err.message || 'Unknown error'}`
                                    }]);
                                } finally {
                                    setIsComplianceChecking(false);
                                }
                            }}
                        />
                    </Button>
                    <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<Gavel />}
                        onClick={() => setCaseBuildingOpen(true)}
                        sx={{
                            mb: 2,
                            textTransform: 'none',
                            borderRadius: '2px',
                            borderColor: 'secondary.main',
                            color: 'secondary.main',
                            fontSize: '0.85rem',
                            '&:hover': {
                                borderColor: 'secondary.dark',
                                bgcolor: 'action.hover'
                            }
                        }}
                    >
                        🧑‍⚖️ Build Your Case
                    </Button>
                    <TextField
                        fullWidth
                        placeholder="Search chats..."
                        size="small"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{
                            startAdornment: <Search fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />,
                            sx: { 
                                fontSize: '0.9rem',
                                bgcolor: 'background.paper',
                                '& fieldset': { 
                                    border: '1px solid',
                                    borderColor: 'divider' 
                                },
                                '&:hover fieldset': {
                                    borderColor: 'primary.main'
                                },
                                borderRadius: '2px'
                            }
                        }}
                    />
                </Box>

                <List sx={{ flexGrow: 1, overflow: 'auto', px: 1 }}>
                    {filteredChats.map((chat, index) => (
                        <ListItem
                            key={chat.id || chat._id || `chat-${index}`}
                            disablePadding
                            sx={{ mb: 0.5 }}
                            secondaryAction={
                                <IconButton 
                                    edge="end" 
                                    size="small"
                                    onClick={(e) => handleMenuOpen(e, chat.id || chat._id, chat.updatedAt)}
                                    sx={{ opacity: 0, transition: 'opacity 0.2s', '.MuiListItem-root:hover &': { opacity: 1 } }}
                                >
                                    <MoreVert fontSize="small" />
                                </IconButton>
                            }
                        >
                            <ListItemButton
                                selected={(activeChat?.id || activeChat?._id) === (chat.id || chat._id)}
                                onClick={() => handleChatSelect(chat)}
                                sx={{
                                    borderRadius: '2px',
                                    '&.Mui-selected': {
                                        bgcolor: 'action.selected',
                                        borderLeft: '3px solid',
                                        borderLeftColor: 'primary.main',
                                        '&:hover': { bgcolor: 'action.hover' }
                                    }
                                }}
                            >
                                <ListItemText
                                    primary={chat.title || 'New Chat'}
                                    secondary={new Date(chat.updatedAt).toLocaleDateString()}
                                    primaryTypographyProps={{ fontSize: '0.9rem', noWrap: true }}
                                    secondaryTypographyProps={{ fontSize: '0.75rem' }}
                                />
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>

                <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Button
                        fullWidth
                        startIcon={<Logout />}
                        onClick={handleLogout}
                        sx={{ 
                            justifyContent: 'flex-start', 
                            color: 'text.secondary',
                            textTransform: 'none',
                            '&:hover': { color: 'error.main', bgcolor: 'rgba(239, 68, 68, 0.1)' }
                        }}
                    >
                        Sign Out
                    </Button>
                </Box>
            </Drawer>

            {/* Main Chat Area */}
            <Box 
                sx={{ 
                    flexGrow: 1, 
                    display: 'flex', 
                    flexDirection: 'column',
                    height: '100%',
                    transition: theme.transitions.create(['margin', 'width'], {
                        easing: theme.transitions.easing.sharp,
                        duration: theme.transitions.duration.leavingScreen,
                    }),
                    ...(leftOpen && {
                        marginLeft: 0,
                        width: `calc(100% - ${SIDEBAR_WIDTH}px)`,
                        transition: theme.transitions.create(['margin', 'width'], {
                            easing: theme.transitions.easing.easeOut,
                            duration: theme.transitions.duration.enteringScreen,
                        }),
                    }),
                    ...(!leftOpen && {
                        marginLeft: `-${SIDEBAR_WIDTH}px`,
                        width: '100%',
                    }),
                    ...(rightOpen && {
                        marginRight: 0,
                        width: `calc(100% - ${leftOpen ? SIDEBAR_WIDTH + DOC_SIDEBAR_WIDTH : DOC_SIDEBAR_WIDTH}px)`,
                    }),
                    ...(!rightOpen && {
                        marginRight: `-${DOC_SIDEBAR_WIDTH}px`,
                        width: leftOpen ? `calc(100% - ${SIDEBAR_WIDTH}px)` : '100%',
                    }),
                }}
            >
                {/* Header */}
                <Paper
                    elevation={0}
                    sx={{
                        p: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        background: 'background.paper'
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <IconButton onClick={() => setLeftOpen(!leftOpen)}>
                            {leftOpen ? <ChevronLeft /> : <MenuIcon />}
                        </IconButton>
                        <ThemeSwitcher />
                        <Typography variant="subtitle1" fontWeight={600}>
                            {activeChat?.title || 'New Conversation'}
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <IconButton onClick={() => setRightOpen(!rightOpen)}>
                            {rightOpen ? <ChevronRight /> : <ChevronLeft />}
                        </IconButton>
                    </Box>
                </Paper>

                {/* Messages Area */}
                <Box sx={{ flexGrow: 1, overflow: 'auto', p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {messages.map((message, index) => (
                        <Box
                            key={message.id || `msg-${index}`}
                            sx={{
                                display: 'flex',
                                justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                                mb: 2
                            }}
                        >
                            <Box
                                    sx={{
                                        maxWidth: '100%',
                                        display: 'flex',
                                        gap: 1,
                                        flexDirection: message.role === 'user' ? 'row-reverse' : 'row',
                                        minWidth: 0 // Allow container to shrink
                                    }}
                            >
                                <Avatar
                                    sx={{
                                        bgcolor: message.role === 'user' ? 'primary.main' : 'secondary.main',
                                        width: 32,
                                        height: 32,
                                        fontSize: '0.85rem'
                                    }}
                                >
                                    {message.role === 'user' ? 'U' : 'AI'}
                                </Avatar>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                    {message.type === 'document' ? (
                                        <DocumentMessageBubble 
                                            document={message.document} 
                                            role={message.role} 
                                            theme={theme} 
                                            mode={mode} 
                                        />
                                    ) : (
                                        <>
                                            {/* File Bubble for Uploaded Documents */}
                                            {message.metadata?.fileName && (
                                                <Paper
                                                    elevation={0}
                                                    sx={{
                                                        p: 1.5,
                                                        mb: 1,
                                                        bgcolor: 'background.paper',
                                                        borderRadius: '8px',
                                                        border: '1px solid',
                                                        borderColor: 'divider',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 1.5,
                                                        maxWidth: '400px'
                                                    }}
                                                >
                                                    <Box
                                                        sx={{
                                                            width: 40,
                                                            height: 40,
                                                            borderRadius: '6px',
                                                            bgcolor: 'primary.main',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            flexShrink: 0
                                                        }}
                                                    >
                                                        <Description sx={{ color: 'white', fontSize: 20 }} />
                                                    </Box>
                                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                                        <Typography
                                                            variant="body2"
                                                            sx={{
                                                                fontWeight: 600,
                                                                fontSize: '0.875rem',
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                whiteSpace: 'nowrap'
                                                            }}
                                                        >
                                                            {message.metadata.fileName}
                                                        </Typography>
                                                        {message.metadata.fileSize && (
                                                            <Typography
                                                                variant="caption"
                                                                sx={{
                                                                    color: 'text.secondary',
                                                                    fontSize: '0.75rem'
                                                                }}
                                                            >
                                                                {(message.metadata.fileSize / 1024).toFixed(1)} KB
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                </Paper>
                                            )}
                                            
                                            {/* Message Content */}
                                            <Paper
                                                elevation={0}
                                                sx={{
                                                    p: 2,
                                                    bgcolor: message.role === 'user' ? 'primary.main' : 'background.paper',
                                                    color: message.role === 'user' ? 'white' : 'text.primary',
                                                    borderRadius: '2px',
                                                    borderTopRightRadius: message.role === 'user' ? 0 : '2px',
                                                    borderTopLeftRadius: message.role === 'user' ? '2px' : 0,
                                                    wordBreak: 'break-word',
                                                    overflowWrap: 'break-word',
                                                    minWidth: 0,
                                                    maxWidth: '100%'
                                                }}
                                            >
                                                <Box sx={{ '& p': { margin: 0 }, '& p + p': { marginTop: 1 } }}>
                                                    <ReactMarkdown
                                                        components={{
                                                            p: ({node, ...props}) => <Typography variant="body2" sx={{ fontSize: '0.9rem', lineHeight: 1.6, wordBreak: 'break-word' }} {...props} />,
                                                            strong: ({node, ...props}) => <strong style={{ fontWeight: 700, wordBreak: 'break-word' }} {...props} />,
                                                            em: ({node, ...props}) => <em style={{ wordBreak: 'break-word' }} {...props} />,
                                                            ul: ({node, ...props}) => <ul style={{ margin: '8px 0', paddingLeft: '20px', wordBreak: 'break-word' }} {...props} />,
                                                            ol: ({node, ...props}) => <ol style={{ margin: '8px 0', paddingLeft: '20px', wordBreak: 'break-word' }} {...props} />,
                                                            li: ({node, ...props}) => <li style={{ marginBottom: '4px', wordBreak: 'break-word' }} {...props} />,
                                                            h2: ({node, ...props}) => <Typography variant="h6" sx={{ fontWeight: 700, mt: 2, mb: 1, wordBreak: 'break-word' }} {...props} />,
                                                            h3: ({node, ...props}) => <Typography variant="subtitle1" sx={{ fontWeight: 600, mt: 1.5, mb: 0.5, wordBreak: 'break-word' }} {...props} />,
                                                            hr: ({node, ...props}) => <Divider sx={{ my: 1.5 }} {...props} />,
                                                            code: ({node, inline, className, children, ...props}) => {
                                                                const match = /language-(\w+)/.exec(className || '');
                                                                const isStrategy = match && match[1] === 'strategy';
                                                                
                                                                if (!inline && isStrategy) {
                                                                    return (
                                                                        <Accordion 
                                                                            disableGutters 
                                                                            elevation={0} 
                                                                            sx={{ 
                                                                                bgcolor: 'action.hover', 
                                                                                my: 1, 
                                                                                borderRadius: '4px',
                                                                                border: '1px solid',
                                                                                borderColor: 'divider',
                                                                                '&:before': { display: 'none' }
                                                                            }}
                                                                        >
                                                                            <AccordionSummary 
                                                                                expandIcon={<ExpandMore fontSize="small" />}
                                                                                sx={{ minHeight: 40, height: 40, px: 2 }}
                                                                            >
                                                                                <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'primary.main' }}>
                                                                                    Strategic Reasoning (Click to Unveil)
                                                                                </Typography>
                                                                            </AccordionSummary>
                                                                            <AccordionDetails sx={{ pt: 0, px: 2, pb: 1.5 }}>
                                                                                <Box sx={{ 
                                                                                    '& ul': { mt: 0, mb: 0 },
                                                                                    '& li': { fontSize: '0.85rem', color: 'text.secondary', py: 0.25 }
                                                                                }}>
                                                                                    <ReactMarkdown components={{
                                                                                        p: ({node, ...props}) => <Typography variant="body2" sx={{ fontSize: '0.85rem' }} {...props} />,
                                                                                        li: ({node, ...props}) => <li style={{ marginBottom: '2px' }} {...props} />
                                                                                    }}>
                                                                                        {String(children).replace(/\n$/, '')}
                                                                                    </ReactMarkdown>
                                                                                </Box>
                                                                            </AccordionDetails>
                                                                        </Accordion>
                                                                    );
                                                                }

                                                                return (
                                                                    <code 
                                                                        className={className}
                                                                        style={{ 
                                                                            background: 'rgba(0,0,0,0.1)', 
                                                                            padding: '2px 4px', 
                                                                            borderRadius: '4px',
                                                                            fontSize: '0.85rem',
                                                                            whiteSpace: 'pre-wrap',
                                                                            wordBreak: 'break-word'
                                                                        }} 
                                                                        {...props} 
                                                                    >
                                                                        {children}
                                                                    </code>
                                                                );
                                                            },
                                                            pre: ({node, ...props}) => (
                                                                <pre 
                                                                    style={{ 
                                                                        background: 'rgba(0,0,0,0.05)', 
                                                                        padding: '12px', 
                                                                        borderRadius: '4px', 
                                                                        overflowX: 'hidden',
                                                                        whiteSpace: 'pre-wrap',
                                                                        wordBreak: 'break-word'
                                                                    }} 
                                                                    {...props} 
                                                                />
                                                            ),
                                                            table: ({node, ...props}) => (
                                                                <Box sx={{ width: '100%', overflowX: 'auto', my: 2 }}>
                                                                    <table style={{ width: '100%', borderCollapse: 'collapse' }} {...props} />
                                                                </Box>
                                                            )
                                                        }}
                                                    >
                                                        {message.content}
                                                    </ReactMarkdown>
                                                </Box>
                                            </Paper>
                                        
                                        {/* Show Generate Document buttons if AI detected generation intent */}
                                        {message.role === 'assistant' && message.generationData && message.generationData.hasGenerationIntent && (
                                            <Box sx={{ mt: 2 }}>
                                                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                                    {/* Generate Now Button - Direct generation */}
                                                    <Button
                                                        variant="contained"
                                                        startIcon={<Description />}
                                                        onClick={async () => {
                                                            try {
                                                                setIsTyping(true);
                                                                const { smartGenerateAPI } = await import('../utils/api');
                                                                
                                                                const response = await smartGenerateAPI.generate(
                                                                    message.generationData.documentType,
                                                                    message.generationData.mappedFields,
                                                                    true // Allow missing fields
                                                                );
                                                                
                                                                if (response.success) {
                                                                    // Show success message in chat
                                                                    setMessages(prev => [...prev, {
                                                                        role: 'assistant',
                                                                        content: `✅ **Document generated successfully!**\n\nYour ${message.generationData.documentTypeName} has been created and saved.\n\nYou can download it from the "Generated Documents" section in the sidebar.`
                                                                    }]);
                                                                    
                                                                    // Refresh generated documents list
                                                                    fetchGeneratedDocuments();
                                                                    
                                                                    setNotification({
                                                                        open: true,
                                                                        message: 'Document generated successfully!',
                                                                        severity: 'success'
                                                                    });
                                                                }
                                                            } catch (error) {
                                                                console.error('Generation error:', error);
                                                                setMessages(prev => [...prev, {
                                                                    role: 'assistant',
                                                                    content: `❌ Sorry, I encountered an error generating the document: ${error.message || 'Unknown error'}\n\nPlease try again or use the "Review & Edit" option to check your information.`
                                                                }]);
                                                            } finally {
                                                                setIsTyping(false);
                                                            }
                                                        }}
                                                        sx={{
                                                            background: 'var(--primary-gradient)',
                                                            color: 'white',
                                                            textTransform: 'none',
                                                            fontWeight: 600,
                                                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                                            '&:hover': {
                                                                opacity: 0.9,
                                                                boxShadow: '0 6px 16px rgba(0,0,0,0.2)',
                                                            }
                                                        }}
                                                    >
                                                        🚀 Generate Now
                                                    </Button>
                                                    
                                                    {/* Review & Edit Button - Navigate to form */}
                                                    <Button
                                                        variant="outlined"
                                                        startIcon={<Edit />}
                                                        onClick={() => {
                                                            navigate(`/document/${message.generationData.documentType}`, {
                                                                state: { generationData: message.generationData }
                                                            });
                                                        }}
                                                        sx={{
                                                            borderColor: 'primary.main',
                                                            color: 'primary.main',
                                                            textTransform: 'none',
                                                            fontWeight: 600,
                                                            '&:hover': {
                                                                borderColor: 'primary.dark',
                                                                bgcolor: 'action.hover',
                                                            }
                                                        }}
                                                    >
                                                        📝 Review & Edit Fields
                                                    </Button>
                                                </Box>
                                                
                                                <Typography variant="caption" display="block" sx={{ mt: 1.5, color: 'text.secondary' }}>
                                                    {message.generationData.completeness.completionPercentage}% complete • 
                                                    {message.generationData.completeness.availableFields.length} fields filled • 
                                                    {message.generationData.completeness.missingFields.length} fields missing
                                                </Typography>
                                            </Box>
                                        )}

                                        </>
                                    )}
                                    {message.files && message.files.length > 0 && (
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                            {message.files.map((file, fileIndex) => (
                                                <Chip
                                                    key={fileIndex}
                                                    icon={<Description fontSize="small" />}
                                                    label={file.filename || file.name || 'Document'}
                                                    size="small"
                                                    sx={{
                                                        height: 22,
                                                        borderRadius: '2px',
                                                        fontSize: '0.7rem',
                                                        bgcolor: message.role === 'user' 
                                                            ? 'rgba(255, 255, 255, 0.9)' 
                                                            : 'action.hover',
                                                        color: 'text.primary',
                                                        '& .MuiChip-icon': {
                                                            color: 'primary.main',
                                                            fontSize: '0.9rem'
                                                        }
                                                    }}
                                                />
                                            ))}
                                        </Box>
                                    )}
                                </Box>
                            </Box>
                        </Box>
                    ))}
                    {isTyping && (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>AI</Avatar>
                            <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.paper', borderRadius: '2px' }}>
                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                    <motion.div
                                        animate={{ scale: [1, 1.2, 1] }}
                                        transition={{ repeat: Infinity, duration: 1 }}
                                        style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: theme.palette.text.secondary }}
                                    />
                                    <motion.div
                                        animate={{ scale: [1, 1.2, 1] }}
                                        transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                                        style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: theme.palette.text.secondary }}
                                    />
                                    <motion.div
                                        animate={{ scale: [1, 1.2, 1] }}
                                        transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                                        style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: theme.palette.text.secondary }}
                                    />
                                </Box>
                            </Paper>
                        </Box>
                    )}
                    <div ref={messagesEndRef} />
                </Box>

                {/* Input Area */}
                <Box sx={{ p: 2, background: theme.palette.background.default }}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: '2px 4px',
                            display: 'flex',
                            alignItems: 'center',
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: '2px',
                            bgcolor: 'background.paper'
                        }}
                    >
                        <input
                            type="file"
                            multiple
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            onChange={handleFileAttach}
                        />
                        <IconButton sx={{ p: '10px' }} onClick={() => fileInputRef.current.click()}>
                            <AttachFile />
                        </IconButton>
                        <Divider sx={{ height: 28, m: 0.5 }} orientation="vertical" />
                        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                            {attachedFiles.length > 0 && (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, p: 1 }}>
                                    {attachedFiles.map((file, index) => (
                                        <Chip
                                            key={index}
                                            label={
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Typography variant="caption">{file.filename}</Typography>
                                                    {file.processing && (
                                                        <Typography variant="caption" sx={{ fontStyle: 'italic', opacity: 0.8 }}>
                                                            (Processing...)
                                                        </Typography>
                                                    )}
                                                </Box>
                                            }
                                            onDelete={() => removeFile(index)}
                                            size="medium" // Increased size for better visibility
                                            icon={file.processing ? <CircularProgress size={16} color="inherit" /> : <Description />}
                                            sx={{ 
                                                borderRadius: '4px',
                                                height: 'auto',
                                                py: 0.5,
                                                bgcolor: file.processing ? 'rgba(255, 193, 7, 0.1)' : 'default', // Slight yellow tint for processing
                                                borderColor: file.processing ? 'warning.main' : 'default',
                                                border: file.processing ? '1px solid' : 'default',
                                                '& .MuiChip-label': { color: 'text.primary' }
                                            }}
                                        />
                                    ))}
                                </Box>
                            )}
                            <TextField
                                fullWidth
                                placeholder={user?.disabledFeatures?.includes('chat') ? "Chat is restricted by admin" : "Type your message..."}
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                                variant="standard"
                                InputProps={{ disableUnderline: true, sx: { px: 1 } }}
                                multiline
                                maxRows={4}
                                disabled={user?.disabledFeatures?.includes('chat')}
                            />
                        </Box>
                        <IconButton 
                            color="primary" 
                            sx={{ p: '10px' }} 
                            onClick={handleSendMessage}
                            disabled={
                                (!inputMessage.trim() && attachedFiles.length === 0) || 
                                attachedFiles.some(f => f.processing || !f.processed) ||
                                user?.disabledFeatures?.includes('chat')
                            }
                        >
                            <Send />
                        </IconButton>
                    </Paper>
                </Box>
            </Box>

            {/* Right Sidebar - Templates & Docs */}
            <Drawer
                variant="persistent"
                anchor="right"
                open={rightOpen}
                sx={{
                    width: DOC_SIDEBAR_WIDTH,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: DOC_SIDEBAR_WIDTH,
                        boxSizing: 'border-box',
                        background: 'background.paper',
                        borderLeft: '1px solid',
                        borderColor: 'divider',
                        display: 'flex',
                        flexDirection: 'column'
                    },
                }}
            >
                <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="subtitle2" fontWeight={600} sx={{ letterSpacing: 1 }}>
                        DOCUMENT HUB
                    </Typography>
                    <IconButton onClick={() => setRightOpen(false)} size="small">
                        <Close fontSize="small" />
                    </IconButton>
                </Box>

                <Box sx={{ flexGrow: 1, overflow: 'auto', bgcolor: 'background.default' }}>
                    {/* Section: Generate Document */}
                    <Accordion disableGutters elevation={0} defaultExpanded sx={{ bgcolor: 'transparent', borderBottom: '1px solid', borderColor: 'divider' }}>
                        <AccordionSummary expandIcon={<ExpandMore />} sx={{ px: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <CloudUpload color="primary" fontSize="small" />
                                <Typography variant="body2" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.75rem' }}>
                                    Generate Document
                                </Typography>
                            </Box>
                        </AccordionSummary>
                        <AccordionDetails sx={{ px: 2, pb: 2 }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                {documentTemplates.map((template, idx) => (
                                    <motion.div
                                        key={template.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                    >
                                        <Paper
                                            elevation={0}
                                            onClick={() => handleDocumentTemplate(template)}
                                            sx={{
                                                p: 1.5,
                                                cursor: 'pointer',
                                                background: 'background.paper',
                                                border: '1px solid',
                                                borderColor: 'divider',
                                                borderRadius: '2px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 2,
                                                transition: 'all 0.2s',
                                                '&:hover': {
                                                    background: 'action.hover',
                                                    borderColor: 'primary.main',
                                                    transform: 'translateX(4px)'
                                                }
                                            }}
                                        >
                                            <Box sx={{ color: 'primary.main', display: 'flex' }}>
                                                {getDocumentIcon(template.icon)}
                                            </Box>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                {template.name}
                                            </Typography>
                                        </Paper>
                                    </motion.div>
                                ))}
                            </Box>
                        </AccordionDetails>
                    </Accordion>

                    {/* Section: Uploaded Documents */}
                    <Accordion disableGutters elevation={0} sx={{ bgcolor: 'transparent', borderBottom: '1px solid', borderColor: 'divider' }}>
                        <AccordionSummary expandIcon={<ExpandMore />} sx={{ px: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Description color="primary" fontSize="small" />
                                <Typography variant="body2" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.75rem' }}>
                                    Uploaded Documents
                                </Typography>
                            </Box>
                        </AccordionSummary>
                        <AccordionDetails sx={{ px: 0, pb: 0 }}>
                            <List disablePadding>
                                {uploadedDocs.length === 0 ? (
                                    <Box sx={{ p: 3, textAlign: 'center' }}>
                                        <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                            No files uploaded yet
                                        </Typography>
                                    </Box>
                                ) : (
                                    uploadedDocs.map((doc, index) => (
                                        <motion.div
                                            key={doc._id || index}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.03 }}
                                        >
                                            <ListItem
                                                sx={{ 
                                                    px: 2, 
                                                    py: 1, 
                                                    borderBottom: '1px solid', 
                                                    borderColor: 'divider',
                                                    '&:hover': { bgcolor: 'action.hover' }
                                                }}
                                            >
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%', minWidth: 0 }}>
                                                    <Avatar sx={{ bgcolor: 'action.selected', color: 'primary.main', width: 32, height: 32 }}>
                                                        <Description fontSize="small" />
                                                    </Avatar>
                                                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                                        <Typography variant="body2" noWrap sx={{ fontSize: '0.8rem', fontWeight: 600 }}>
                                                            {doc.filename}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                                                            {new Date(doc.uploadedAt || doc.createdAt || doc.uploadDate).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                                        </Typography>
                                                    </Box>
                                                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                        <Tooltip title="Download">
                                                            <IconButton 
                                                                size="small" 
                                                                color="success"
                                                                onClick={async () => {
                                                                    const result = await documentAPI.getDownloadUrl(doc.id || doc._id);
                                                                    if (result.success) {
                                                                        const link = document.createElement('a');
                                                                        link.href = result.data.url;
                                                                        link.download = doc.filename;
                                                                        document.body.appendChild(link);
                                                                        link.click();
                                                                        document.body.removeChild(link);
                                                                    }
                                                                }}
                                                            >
                                                                <Download fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Delete">
                                                            <IconButton
                                                                size="small"
                                                                color="error"
                                                                onClick={() => handleDeleteClick('uploaded_document', doc)}
                                                            >
                                                                <Delete fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="View">
                                                            <IconButton 
                                                                size="small" 
                                                                onClick={async () => {
                                                                    const result = await documentAPI.getDownloadUrl(doc.id || doc._id);
                                                                    if (result.success) window.open(result.data.url, '_blank');
                                                                }}
                                                            >
                                                                <Visibility fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Box>
                                                </Box>
                                            </ListItem>
                                        </motion.div>
                                    ))
                                )}
                            </List>
                        </AccordionDetails>
                    </Accordion>

                    {/* Section: Generated Documents */}
                    <Accordion disableGutters elevation={0} sx={{ bgcolor: 'transparent', borderBottom: '1px solid', borderColor: 'divider' }}>
                        <AccordionSummary expandIcon={<ExpandMore />} sx={{ px: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <History color="primary" fontSize="small" />
                                <Typography variant="body2" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.75rem' }}>
                                    Generated Documents
                                </Typography>
                            </Box>
                        </AccordionSummary>
                        <AccordionDetails sx={{ px: 0, pb: 0 }}>
                            <List disablePadding>
                                {generatedDocs.length === 0 ? (
                                    <Box sx={{ p: 3, textAlign: 'center' }}>
                                        <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                            No documents generated yet
                                        </Typography>
                                    </Box>
                                ) : (
                                    generatedDocs.map((doc, index) => (
                                        <motion.div
                                            key={doc._id || index}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.03 }}
                                        >
                                            <ListItem
                                                sx={{ 
                                                    px: 2, 
                                                    py: 1.5, 
                                                    borderBottom: '1px solid', 
                                                    borderColor: 'divider',
                                                    '&:hover': { bgcolor: 'action.hover' }
                                                }}
                                            >
                                                <Box sx={{ width: '100%' }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                                                        <Avatar sx={{ bgcolor: 'secondary.light', color: 'secondary.dark', width: 32, height: 32 }}>
                                                            <Gavel fontSize="small" />
                                                        </Avatar>
                                                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                                            <Typography variant="body2" noWrap sx={{ fontSize: '0.8rem', fontWeight: 600 }}>
                                                                {doc.fileName}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                                                                {new Date(doc.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                                                        <IconButton 
                                                            size="small" 
                                                            onClick={() => {
                                                                const url = doc.viewUrl || doc.htmlUrl;
                                                                const fullUrl = url.startsWith('http') ? url : `https://midl.comsats.edu.pk/legalize${url}`;
                                                                window.open(fullUrl, '_blank');
                                                            }}
                                                        >
                                                            <OpenInNew fontSize="small" />
                                                        </IconButton>
                                                        <IconButton 
                                                            size="small" 
                                                            color="success"
                                                            onClick={async () => {
                                                                try {
                                                                    setIsDownloading(true);
                                                                    const url = doc.viewUrl || doc.htmlUrl;
                                                                    const fullUrl = url.startsWith('http') ? url : `https://midl.comsats.edu.pk/legalize${url}`;
                                                                    const response = await fetch(fullUrl);
                                                                    const htmlContent = await response.text();
                                                                    const opt = {
                                                                        margin: 10,
                                                                        filename: doc.fileName.replace('.html', '.pdf'),
                                                                        image: { type: 'jpeg', quality: 0.98 },
                                                                        html2canvas: { scale: 2 },
                                                                        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                                                                    };
                                                                    await html2pdf().set(opt).from(htmlContent).save();
                                                                } catch (err) {
                                                                    console.error('PDF Error:', err);
                                                                } finally {
                                                                    setIsDownloading(false);
                                                                }
                                                            }}
                                                        >
                                                            <Download fontSize="small" />
                                                        </IconButton>
                                                        <IconButton
                                                            size="small"
                                                            color="error"
                                                            onClick={(e) => handleDocMenuOpen(e, doc)}
                                                        >
                                                            <Delete fontSize="small" />
                                                        </IconButton>
                                                    </Box>
                                                </Box>
                                            </ListItem>
                                        </motion.div>
                                    ))
                                )}
                            </List>
                        </AccordionDetails>
                    </Accordion>
                </Box>
            </Drawer>

            {/* Chat Menu */}
            <Menu
                anchorEl={menuAnchorEl}
                open={Boolean(menuAnchorEl)}
                onClose={handleMenuClose}
                PaperProps={{
                    sx: {
                        borderRadius: '2px',
                        minWidth: 200
                    }
                }}
            >
                <Box sx={{ px: 2, py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="caption" color="text.secondary">
                        Created: {menuChatDate ? new Date(menuChatDate).toLocaleString() : 'Unknown'}
                    </Typography>
                </Box>
                <MenuItem onClick={handleMenuDelete} sx={{ fontSize: '0.875rem', gap: 1, mt: 1 }}>
                    <Delete fontSize="small" color="error" />
                    <Typography color="error" variant="body2">Delete Chat</Typography>
                </MenuItem>
            </Menu>

            {/* Document Menu */}
            <Menu
                anchorEl={docMenuAnchorEl}
                open={Boolean(docMenuAnchorEl)}
                onClose={handleDocMenuClose}
                PaperProps={{
                    sx: {
                        borderRadius: '2px',
                        minWidth: 150
                    }
                }}
            >
                <MenuItem onClick={() => handleDeleteClick('document', selectedDoc)} sx={{ fontSize: '0.875rem', gap: 1 }}>
                    <Delete fontSize="small" />
                    Delete
                </MenuItem>
            </Menu>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                PaperProps={{
                    sx: {
                        borderRadius: '2px',
                        border: '1px solid',
                        borderColor: 'divider',
                        background: 'background.paper'
                    }
                }}
            >
                <DialogTitle sx={{ fontWeight: 600 }}>
                    Confirm Deletion
                </DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ color: 'text.secondary' }}>
                        Are you sure you want to delete this {itemToDelete?.type}? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button 
                        onClick={() => setDeleteDialogOpen(false)}
                        sx={{ 
                            color: 'text.secondary',
                            textTransform: 'none',
                            fontWeight: 500
                        }}
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleConfirmDelete}
                        variant="contained"
                        color="error"
                        sx={{ 
                            textTransform: 'none',
                            fontWeight: 500,
                            boxShadow: 'none',
                            borderRadius: '2px'
                        }}
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
                <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
                    {error}
                </Alert>
            </Snackbar>
            {/* Full-screen compliance check overlay */}
            {isComplianceChecking && (
                <Box
                    sx={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        width: '100vw',
                        height: '100vh',
                        bgcolor: 'rgba(0, 0, 0, 0.8)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 2100,
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
                        <Typography variant="body2" color="text.secondary" align="center">
                            Running compliance checkup on your document... This may take a moment.
                        </Typography>
                    </Paper>
                </Box>
            )}
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
                        bgcolor: 'rgba(0, 0, 0, 0.8)',
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
            
            {/* Case Building Wizard Dialog */}
            <Dialog
                open={caseBuildingOpen}
                onClose={() => setCaseBuildingOpen(false)}
                maxWidth="lg"
                fullWidth
                PaperProps={{
                    sx: { height: '90vh', maxHeight: '90vh' }
                }}
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Gavel color="primary" />
                        <Typography variant="h6">Case Building Wizard</Typography>
                    </Box>
                    <IconButton onClick={() => setCaseBuildingOpen(false)}>
                        <Close />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ p: 0 }}>
                    <CaseBuildingWizard 
                        onClose={() => setCaseBuildingOpen(false)}
                        chatAPI={chatAPI}
                    />
                </DialogContent>
            </Dialog>
        </Box>
    );
};

export default ChatInterface;
