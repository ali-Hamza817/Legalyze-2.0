import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    AppBar,
    Toolbar,
    Button,
    Container,
    Typography,
    Box,
    Grid,
    Card,
    CardContent,
    TextField,
    IconButton,
    Stack,
    Link,
    Divider,
    Avatar,
    Rating,
    useTheme,
    Alert,
    Snackbar,
    CircularProgress,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    LinearProgress
} from '@mui/material';
import {
    Description,
    Security,
    CloudUpload,
    Speed,
    CheckCircle,
    Gavel,
    Email,
    Phone,
    LocationOn,
    Menu as MenuIcon,
    Facebook,
    Twitter,
    LinkedIn,
    Instagram,
    Send,
    ArrowForward,
    GitHub,
    FormatQuote,
    ArrowBackIos,
    ArrowForwardIos,
    Business,
    Brightness4,
    Brightness7,
    ExpandMore,
    Visibility,
    AccessTime,
    Mail,
    Place,
    Person as PersonIcon,
    ColorLens,
    AutoFixHigh,
    VerifiedUser,
    EditNote
} from '@mui/icons-material';
import { PALETTES } from '../styles/themeConfig';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeIn, slideInFromBottom, slideInFromLeft, slideInFromRight, staggerContainer } from '../utils/animations';
import { scrollToSection } from '../utils/helpers';
import { useColorMode } from '../context/ThemeContext';
import { contactAPI } from '../utils/api';
// ThemeSwitcher removed as per request

// Email validation utility (relaxed but still safe)
const validateEmail = (email) => {
    if (!email) return false;

    // Basic pattern: something@something.domain
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return false;

    // Optional lightweight spam-domain check on the domain only
    const domain = email.split('@')[1]?.toLowerCase() || '';
    const spamDomains = ['10minutemail', 'guerrillamail', 'mailinator'];
    if (spamDomains.some(spam => domain.includes(spam))) return false;

    return true;
};

const LandingPage = () => {
    const navigate = useNavigate();
    const theme = useTheme();
    const { mode, setTheme, allThemes } = useColorMode();
    
    // Cycle through themes on click
    const [themeToast, setThemeToast] = useState(null);

    // Cycle through themes on click
    const cycleTheme = () => {
        const currentIndex = allThemes.indexOf(mode);
        const nextIndex = (currentIndex + 1) % allThemes.length;
        const newThemeKey = allThemes[nextIndex];
        setTheme(newThemeKey);
        
        const themeName = PALETTES[newThemeKey]?.name || 'New Theme';
        setThemeToast(themeName);
        
        // Auto hide after 2 seconds
        setTimeout(() => setThemeToast(null), 2000);
    };
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        company: '',
        subject: '',
        message: ''
    });
    const [newsletterEmail, setNewsletterEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [newsletterLoading, setNewsletterLoading] = useState(false);
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

    // Testimonials State
    const [currentTestimonialIndex, setCurrentTestimonialIndex] = useState(0);
    const [expandedFAQ, setExpandedFAQ] = useState(false);

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validate email
        if (!validateEmail(formData.email)) {
            setNotification({
                open: true,
                message: 'Please provide a valid email address. Temporary/spam emails are not allowed.',
                severity: 'error'
            });
            return;
        }
        
        setLoading(true);
        try {
            const response = await contactAPI.sendMessage(formData);
            
            if (response.success) {
                setNotification({
                    open: true,
                    message: response.message,
                    severity: 'success'
                });
                setFormData({ name: '', email: '', phone: '', company: '', subject: '', message: '' });
            }
        } catch (error) {
            setNotification({
                open: true,
                message: error.message || 'Failed to send message. Please try again.',
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleNewsletterSubscribe = async (e) => {
        e.preventDefault();
        
        // Validate email
        if (!validateEmail(newsletterEmail)) {
            setNotification({
                open: true,
                message: 'Please provide a valid email address. Temporary/spam emails are not allowed.',
                severity: 'error'
            });
            return;
        }
        
        setNewsletterLoading(true);
        try {
            const response = await contactAPI.subscribe(newsletterEmail);
            
            if (response.success) {
                setNotification({
                    open: true,
                    message: response.message,
                    severity: 'success'
                });
                setNewsletterEmail('');
            }
        } catch (error) {
            setNotification({
                open: true,
                message: error.message || 'Failed to subscribe. Please try again.',
                severity: 'error'
            });
        } finally {
            setNewsletterLoading(false);
        }
    };

    // Data
    const services = [
        {
            icon: <EditNote sx={{ fontSize: 32 }} />,
            title: 'AI Document Generation',
            description: 'Generate professional legal documents using advanced AI and LLM technology with perfect formatting and legal accuracy.'
        },
        {
            icon: <VerifiedUser sx={{ fontSize: 32 }} />,
            title: 'Compliance Checkup',
            description: 'Automated constitutional compliance verification ensures your documents meet all regulatory standards of Pakistan.'
        },
        {
            icon: <AutoFixHigh sx={{ fontSize: 32 }} />,
            title: 'Case Buildup Wizard',
            description: 'Interactive step-by-step assistance for building comprehensive case files and petitions with precision.'
        }
    ];

    const features = [
        {
            icon: <Speed sx={{ fontSize: 40 }} />,
            title: 'Lightning Fast',
            description: '95% uptime guarantee with instant document generation'
        },
        {
            icon: <CheckCircle sx={{ fontSize: 40 }} />,
            title: 'High Accuracy',
            description: 'RAG-powered Q&A ensures factual accuracy in every document'
        },
        {
            icon: <Gavel sx={{ fontSize: 40 }} />,
            title: 'Legal Expertise',
            description: 'Built with legal professionals for legal professionals'
        },
        {
            icon: <Security sx={{ fontSize: 40 }} />,
            title: 'Enterprise Security',
            description: 'HTTPS/TLS 1.2 encryption for all data transfers'
        }
    ];

    const teamMembers = [
        {
            name: 'Shafa-at Ali Sheikh',
            role: 'Chief Executive Officer',
            title: 'Project Lead & AI Architect',
            bio: 'Expert in AI/ML systems and legal tech innovation'
        },
        {
            name: 'Ali Hamza',
            role: 'Technical Lead',
            title: 'Cloud Engineer',
            bio: 'Architecting scalable cloud infrastructure and secure deployments'
        },
        {
            name: 'Maaz Bin Ramzan',
            role: 'Chief Technology Officer',
            title: 'Backend Developer',
            bio: 'Specializes in FastAPI and cloud infrastructure'
        },
        {
            name: 'Osama Imtiaz',
            role: 'Head of AI Research',
            title: 'AI/ML Engineer',
            bio: 'Focuses on LLM integration and RAG systems'
        },
        {
            name: 'Nouman Ali',
            role: 'Chief Product Officer',
            title: 'Full Stack Developer',
            bio: 'Expert in React and system integration'
        }
    ];

    const testimonials = [
        {
            name: 'Sarah Johnson',
            role: 'Legal Director',
            company: 'TechCorp Inc.',
            rating: 5,
            text: 'Legalyzing has transformed our legal document workflow. The AI-powered generation is incredibly accurate, and the compliance checking saves us countless hours. The interface is intuitive and the results are consistently professional.'
        },
        {
            name: 'Michael Chen',
            role: 'Chief Legal Officer',
            company: 'Innovation Labs',
            rating: 5,
            text: 'The RAG-powered Q&A feature is a game-changer. We can quickly extract information from complex legal documents with unprecedented accuracy. This has significantly improved our research efficiency.'
        },
        {
            name: 'Emily Rodriguez',
            role: 'Compliance Manager',
            company: 'FinanceHub',
            rating: 5,
            text: 'Security and compliance are our top priorities, and Legalyzing delivers on both. The AWS S3 integration and AES-256 encryption give us complete peace of mind. Highly recommended for enterprise use!'
        }
    ];

    const faqs = [
        {
            question: 'How quickly can you start generating documents?',
            answer: 'We typically begin document generation immediately after signup. Most users start creating legal documents within 2-3 minutes of registration.',
        },
        {
            question: 'Do you offer support after deployment?',
            answer: 'Yes! We provide 24/7 technical support and ongoing maintenance packages tailored to your needs. Our team is always ready to assist.',
        },
        {
            question: 'Are your solutions legally compliant?',
            answer: 'Absolutely. All our legal document templates are built with compliance as a core requirement, with regular legal audits and updates.',
        },
        {
            question: 'Can you integrate with existing systems?',
            answer: 'Yes, we specialize in system integration. Our API allows seamless connectivity with your existing legal management software and workflows.',
        }
    ];

    const excellenceMetrics = [
        { label: 'Document Accuracy', value: 98 },
        { label: 'Client Satisfaction', value: 96 },
        { label: 'System Uptime', value: 99.9 },
        { label: 'Data Security', value: 100 }
    ];

    const handleTestimonialPrev = () => {
        setCurrentTestimonialIndex((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1));
    };

    const handleTestimonialNext = () => {
        setCurrentTestimonialIndex((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1));
    };

    const handleFAQChange = (panel) => (event, isExpanded) => {
        setExpandedFAQ(isExpanded ? panel : false);
    };

    // Auto-play Testimonials
    useEffect(() => {
        const interval = setInterval(() => {
            handleTestimonialNext();
        }, 6000); // Change every 6 seconds
        return () => clearInterval(interval);
    }, [currentTestimonialIndex]);

    return (
        <Box className="page-container" sx={{ bgcolor: 'background.default', color: 'text.primary' }}>
            {/* Theme Toast Notification */}
            <AnimatePresence>
                {themeToast && (
                    <motion.div
                        initial={{ opacity: 0, y: -50, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, y: -50, x: '-50%' }}
                        transition={{ duration: 0.3 }}
                        style={{
                            position: 'fixed',
                            top: 24,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            zIndex: 9999,
                            background: 'rgba(0, 0, 0, 0.8)',
                            backdropFilter: 'blur(10px)',
                            color: 'white',
                            padding: '12px 32px',
                            borderRadius: '50px',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            fontWeight: 600,
                            fontSize: '1rem',
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}
                    >
                        <ColorLens sx={{ fontSize: 20, color: 'var(--primary)' }} />
                        {themeToast}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Navigation Bar */}
            <AppBar
                position="sticky"
                sx={{
                    background: 'rgba(255, 255, 255, 0.05)', // Fallback
                    bgcolor: 'background.paper', // Use theme token
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
                    borderBottom: '1px solid',
                    borderColor: 'divider'
                }}
            >
                <Toolbar>
                    <Typography
                        variant="h5"
                        component="div"
                        sx={{
                            flexGrow: 1,
                            fontWeight: 800,
                            background: 'var(--primary-gradient)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            cursor: 'pointer'
                        }}
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    >
                        Legalyzing
                    </Typography>

                    <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 2 }}>
                        <Button sx={{ color: 'text.primary' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Home</Button>
                        <Button sx={{ color: 'text.primary' }} onClick={() => scrollToSection('about')}>About Us</Button>
                        <Button sx={{ color: 'text.primary' }} onClick={() => scrollToSection('services')}>Services</Button>
                        <Button sx={{ color: 'text.primary' }} onClick={() => scrollToSection('testimonials')}>Testimonials</Button>
                        <Button sx={{ color: 'text.primary' }} onClick={() => scrollToSection('contact')}>Contact</Button>
                    </Box>

                    <Box sx={{ ml: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
                        {/* Theme Cycle Button */}
                        <IconButton 
                            onClick={cycleTheme}
                            sx={{ 
                                color: 'text.primary',
                                transition: 'all 0.3s ease',
                                '&:hover': { 
                                    transform: 'rotate(180deg)',
                                    bgcolor: 'action.hover'
                                }
                            }}
                        >
                            <ColorLens fontSize="medium" />
                        </IconButton>
                        <Button 
                            variant="outlined" 
                            onClick={() => navigate('/signin')}
                            sx={{
                                color: 'primary.main',
                                borderColor: 'primary.main',
                                '&:hover': {
                                    borderColor: 'primary.light',
                                    bgcolor: 'action.hover'
                                }
                            }}
                        >
                            Sign In
                        </Button>
                        <Button variant="contained" onClick={() => navigate('/signup')}
                            sx={{
                                background: 'var(--primary-gradient)',
                                '&:hover': { 
                                    opacity: 0.9,
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                                }
                            }}
                        >
                            Get Started
                        </Button>
                    </Box>
                </Toolbar>
            </AppBar>

            {/* Hero Section */}
            <Box sx={{ minHeight: '90vh', display: 'flex', alignItems: 'center', 
                bgcolor: 'background.default',
                position: 'relative', overflow: 'hidden' }}>
                <Box sx={{ position: 'absolute', top: '10%', right: '10%', width: '400px', height: '400px',
                    background: 'radial-gradient(circle, var(--accent) 0%, transparent 70%)',
                    opacity: 0.3,
                    borderRadius: '50%', filter: 'blur(60px)', animation: 'float 8s ease-in-out infinite' }} />
                <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
                    <Grid container spacing={4} alignItems="center">
                        <Grid item xs={12} md={6}>
                            <motion.div initial="hidden" animate="visible" variants={slideInFromLeft}>
                                <Typography variant="h1" gutterBottom sx={{ fontSize: { xs: '2.5rem', md: '3.5rem' }, fontWeight: 800, lineHeight: 1.2 }}>
                                    Smart Legal Document <span className="gradient-text">Generation</span>
                                </Typography>
                                <Typography variant="h5" color="text.secondary" paragraph sx={{ mb: 4 }}>
                                    AI-powered legal document creation with compliance checking and secure cloud storage
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                    <Button variant="contained" size="large" onClick={() => navigate('/signup')}
                                        sx={{ px: 4, py: 1.5, fontSize: '1.1rem', background: 'var(--primary-gradient)',
                                            '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }
                                        }}>
                                        Start Free Trial
                                    </Button>
                                    <Button variant="outlined" size="large" onClick={() => scrollToSection('services')}
                                        sx={{ px: 4, py: 1.5, fontSize: '1.1rem', borderWidth: 2, '&:hover': { borderWidth: 2 } }}>
                                        Learn More
                                    </Button>
                                </Box>
                            </motion.div>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <motion.div initial="hidden" animate="visible" variants={slideInFromRight}>
                                <Card className="glass" sx={{ p: 4, bgcolor: 'background.paper', textAlign: 'center' }}>
                                    <Description sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
                                    <Typography variant="h4" gutterBottom fontWeight={700}>5+ Document Templates</Typography>
                                    <Typography color="text.secondary">From NDAs to Employment Contracts, generate professional legal documents in seconds</Typography>
                                </Card>
                            </motion.div>
                        </Grid>
                    </Grid>
                </Container>
            </Box>

            {/* Mission & Vision Section */}
            <Box sx={{ py: 12, background: 'var(--bg-secondary)' }}>
                <Container maxWidth="lg">
                    <Grid container spacing={4}>
                        <Grid item xs={12} md={6}>
                            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}>
                                <Card className="glass hover-lift" sx={{ p: 4, height: '100%', bgcolor: 'background.paper' }}>
                                    <Box sx={{ width: 64, height: 64, borderRadius: '16px', background: 'var(--primary-gradient)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
                                        <Visibility sx={{ fontSize: 32, color: 'white' }} />
                                    </Box>
                                    <Typography variant="h4" fontWeight={700} gutterBottom>Our Mission</Typography>
                                    <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                                        To revolutionize legal document delivery through innovative AI-powered software solutions that enhance accuracy, 
                                        improve efficiency, and streamline legal operations worldwide. We're committed to making professional legal services 
                                        accessible to everyone.
                                    </Typography>
                                </Card>
                            </motion.div>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} transition={{ delay: 0.2 }}>
                                <Card className="glass hover-lift" sx={{ p: 4, height: '100%', bgcolor: 'background.paper' }}>
                                    <Box sx={{ width: 64, height: 64, borderRadius: '16px', background: 'var(--primary-gradient)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
                                        <Gavel sx={{ fontSize: 32, color: 'white' }} />
                                    </Box>
                                    <Typography variant="h4" fontWeight={700} gutterBottom>Our Vision</Typography>
                                    <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                                        To be the global leader in legal technology innovation, making advanced legal AI accessible to every legal professional 
                                        and organization, regardless of location or resources. We envision a future where legal documentation is instant, accurate, 
                                        and affordable.
                                    </Typography>
                                </Card>
                            </motion.div>
                        </Grid>
                    </Grid>

                    {/* Excellence Metrics */}
                    <Box sx={{ mt: 8 }}>
                        <Typography variant="h3" align="center" fontWeight={700} gutterBottom>
                            Our <span className="gradient-text">Excellence</span>
                        </Typography>
                        <Typography variant="h6" align="center" color="text.secondary" sx={{ mb: 6 }}>
                            Commitment to quality in every aspect of legal document generation
                        </Typography>
                        <Grid container spacing={4}>
                            {excellenceMetrics.map((metric, index) => (
                                <Grid item xs={12} md={6} key={index}>
                                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={slideInFromBottom} transition={{ delay: index * 0.1 }}>
                                        <Box sx={{ mb: 2 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                <Typography variant="body1" fontWeight={600}>{metric.label}</Typography>
                                                <Typography variant="body1" fontWeight={700} className="gradient-text">{metric.value}%</Typography>
                                            </Box>
                                            <LinearProgress 
                                                variant="determinate" 
                                                value={metric.value} 
                                                sx={{ 
                                                    height: 8, 
                                                    borderRadius: 4,
                                                    background: 'rgba(0,0,0,0.1)',
                                                    '& .MuiLinearProgress-bar': {
                                                        borderRadius: 4,
                                                        background: 'var(--primary-gradient)'
                                                    }
                                                }}
                                            />
                                        </Box>
                                    </motion.div>
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                </Container>
            </Box>

            {/* Services Section */}
            <Box id="services" sx={{ py: 12, background: 'var(--bg-primary)' }}>
                <Container maxWidth="lg">
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}>
                        <Typography variant="h2" align="center" gutterBottom fontWeight={700}>
                            Our <span className="gradient-text">Services</span>
                        </Typography>
                        <Typography variant="h6" align="center" color="text.secondary" paragraph sx={{ mb: 6 }}>
                            Comprehensive legal document solutions powered by AI
                        </Typography>
                    </motion.div>

                    <Grid container spacing={4}>
                        {services.map((service, index) => (
                            <Grid item xs={12} key={index}>
                                <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={slideInFromBottom} transition={{ delay: index * 0.2 }}>
                                    <Card className="glass hover-lift" sx={{ 
                                        p: 4, 
                                        bgcolor: 'background.paper',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 4
                                    }}>
                                        <Box sx={{ 
                                            color: 'primary.main', 
                                            display: 'flex', 
                                            justifyContent: 'center',
                                            bgcolor: 'action.hover',
                                            p: 3,
                                            borderRadius: 4
                                        }}>
                                            {service.icon}
                                        </Box>
                                        <Box>
                                            <Typography variant="h5" gutterBottom fontWeight={700}>
                                                {service.title}
                                            </Typography>
                                            <Typography color="text.secondary" variant="body1">{service.description}</Typography>
                                        </Box>
                                    </Card>
                                </motion.div>
                            </Grid>
                        ))}
                    </Grid>
                </Container>
            </Box>

            {/* Team Section */}
            <Box id="team" sx={{ py: 12, background: 'var(--bg-secondary)' }}>
                <Container maxWidth="lg">
                    <Typography variant="h2" align="center" gutterBottom fontWeight={700}>
                        Leadership <span className="gradient-text">Team</span>
                    </Typography>
                    <Typography variant="h6" align="center" color="text.secondary" paragraph sx={{ mb: 6 }}>
                        Bringing together legal expertise and technological innovation
                    </Typography>

                    <Box sx={{ 
                        display: 'grid', 
                        gridTemplateColumns: { 
                            xs: '1fr', 
                            sm: 'repeat(2, 1fr)', 
                            md: 'repeat(5, 1fr)' 
                        }, 
                        gap: 3 
                    }}>
                        {teamMembers.map((member, index) => (
                            <motion.div 
                                key={index}
                                initial="hidden" 
                                whileInView="visible" 
                                viewport={{ once: true }} 
                                variants={slideInFromBottom} 
                                transition={{ delay: index * 0.1 }}
                            >
                                <Card className="glass hover-lift" sx={{ 
                                    height: '100%', 
                                    overflow: 'hidden',
                                    bgcolor: 'background.paper',
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                        transform: 'translateY(-8px)',
                                        boxShadow: '0 12px 40px rgba(0,0,0,0.1)'
                                    }
                                }}>
                                    <Box sx={{ 
                                        height: 200, 
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        bgcolor: 'action.hover'
                                    }}>
                                        <PersonIcon sx={{ fontSize: 64, color: 'primary.main' }} />
                                    </Box>
                                    <CardContent sx={{ textAlign: 'center', p: 2 }}>
                                        <Typography variant="subtitle1" fontWeight={700} gutterBottom sx={{ fontSize: '0.9rem' }}>{member.name}</Typography>
                                        <Typography variant="caption" className="gradient-text" fontWeight={600} display="block" sx={{ mb: 0.5 }}>
                                            {member.role}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5, fontSize: '0.7rem' }}>
                                            {member.title}
                                        </Typography>
                                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                                            <IconButton size="small" sx={{ p: 0.5, bgcolor: 'action.hover', '&:hover': { bgcolor: 'primary.main', color: 'white' } }}>
                                                <LinkedIn sx={{ fontSize: 16 }} />
                                            </IconButton>
                                            <IconButton size="small" sx={{ p: 0.5, bgcolor: 'action.hover', '&:hover': { bgcolor: 'primary.main', color: 'white' } }}>
                                                <Email sx={{ fontSize: 16 }} />
                                            </IconButton>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </Box>
                </Container>
            </Box>

            {/* Testimonials Section */}
            <Box id="testimonials" sx={{ py: 12, background: 'var(--bg-primary)' }}>
                <Container maxWidth="lg">
                    <Typography variant="h2" align="center" gutterBottom fontWeight={700}>
                        Client <span className="gradient-text">Testimonials</span>
                    </Typography>
                    <Typography variant="h6" align="center" color="text.secondary" paragraph sx={{ mb: 6 }}>
                        Hear what our clients say about transforming their legal workflows
                    </Typography>

                    <Box sx={{ position: 'relative', maxWidth: '1000px', mx: 'auto' }}>
                        <IconButton onClick={handleTestimonialPrev}
                            sx={{ position: 'absolute', left: { xs: -20, md: -60 }, top: '50%', transform: 'translateY(-50%)', zIndex: 2,
                                background: 'rgba(0,0,0,0.05)', '&:hover': { background: 'rgba(0,0,0,0.1)' } }}>
                            <ArrowBackIos sx={{ color: 'primary.main' }} />
                        </IconButton>

                        <IconButton onClick={handleTestimonialNext}
                            sx={{ position: 'absolute', right: { xs: -20, md: -60 }, top: '50%', transform: 'translateY(-50%)', zIndex: 2,
                                background: 'rgba(0,0,0,0.05)', '&:hover': { background: 'rgba(0,0,0,0.1)' } }}>
                            <ArrowForwardIos sx={{ color: 'primary.main' }} />
                        </IconButton>

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentTestimonialIndex}
                                initial={{ opacity: 0, x: 100 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -100 }}
                                transition={{ duration: 0.5 }}
                            >
                                <Card className="glass" sx={{ p: 4, bgcolor: 'background.paper' }}>
                                    <CardContent>
                                        <Box sx={{ display: 'flex', alignItems: 'start', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
                                            <Box sx={{ 
                                                width: { xs: 100, md: 120 }, 
                                                height: { xs: 100, md: 120 }, 
                                                borderRadius: '50%', 
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                border: '4px solid',
                                                borderColor: 'primary.main',
                                                flexShrink: 0,
                                                bgcolor: 'action.hover'
                                            }}>
                                                <PersonIcon sx={{ fontSize: 64, color: 'primary.main' }} />
                                            </Box>
                                            <Box sx={{ flex: 1 }}>
                                                <FormatQuote sx={{ fontSize: 40, color: 'primary.main', opacity: 0.3 }} />
                                                <Typography variant="h6" sx={{ fontStyle: 'italic', mb: 3, lineHeight: 1.8 }}>
                                                    "{testimonials[currentTestimonialIndex].text}"
                                                </Typography>
                                                <Box>
                                                    <Typography variant="h6" fontWeight={700}>
                                                        {testimonials[currentTestimonialIndex].name}
                                                    </Typography>
                                                    <Typography variant="body2" className="gradient-text" fontWeight={600}>
                                                        {testimonials[currentTestimonialIndex].role}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {testimonials[currentTestimonialIndex].company}
                                                    </Typography>
                                                    <Rating value={testimonials[currentTestimonialIndex].rating} readOnly sx={{ mt: 1 }} />
                                                </Box>
                                            </Box>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </AnimatePresence>

                        {/* Testimonial Dots */}
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 3 }}>
                            {testimonials.map((_, index) => (
                                <Box
                                    key={index}
                                    onClick={() => setCurrentTestimonialIndex(index)}
                                    sx={{
                                        width: currentTestimonialIndex === index ? 32 : 8,
                                        height: 8,
                                        borderRadius: 4,
                                        background: currentTestimonialIndex === index 
                                            ? 'var(--primary-gradient)'
                                            : 'rgba(127,127,127,0.3)',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease'
                                    }}
                                />
                            ))}
                        </Box>
                    </Box>
                </Container>
            </Box>

            {/* CTA Section */}
            <Box sx={{ py: 10, background: 'var(--secondary-gradient)', position: 'relative', overflow: 'hidden' }}>
                <Box sx={{ position: 'absolute', top: '-50%', right: '-10%', width: '500px', height: '500px',
                    background: 'radial-gradient(circle, rgba(255,255,255, 0.2) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(100px)' }} />
                <Container maxWidth="md">
                    <Box sx={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
                        <Typography variant="h2" fontWeight={700} sx={{ color: 'white', mb: 2 }}>
                            Ready to Transform Your Legal Workflow?
                        </Typography>
                        <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.8)', mb: 4 }}>
                            Join hundreds of legal professionals who trust Legalyzing for their document generation journey.
                        </Typography>
                        <Button 
                            variant="contained" 
                            size="large"
                            endIcon={<ArrowForward />}
                            onClick={() => navigate('/signup')}
                            sx={{
                                px: 6,
                                py: 2,
                                fontSize: '1.1rem',
                                background: 'white',
                                color: 'primary.main',
                                '&:hover': {
                                    background: '#f8fafc',
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 12px 40px rgba(0,0,0,0.2)'
                                }
                            }}
                        >
                            Schedule a Demo
                        </Button>
                    </Box>
                </Container>
            </Box>

            {/* FAQ Section */}
            <Box sx={{ py: 12, background: 'var(--bg-secondary)' }}>
                <Container maxWidth="md">
                    <Typography variant="h2" align="center" gutterBottom fontWeight={700}>
                        Frequently Asked <span className="gradient-text">Questions</span>
                    </Typography>
                    <Typography variant="h6" align="center" color="text.secondary" paragraph sx={{ mb: 6 }}>
                        Find answers to common questions about our legal document generation platform
                    </Typography>

                    {faqs.map((faq, index) => (
                        <motion.div key={index} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={slideInFromBottom} transition={{ delay: index * 0.1 }}>
                            <Accordion
                                expanded={expandedFAQ === `panel${index}`}
                                onChange={handleFAQChange(`panel${index}`)}
                                sx={{
                                    mb: 2,
                                    bgcolor: 'background.paper',
                                    backdropFilter: 'blur(10px)',
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    borderRadius: '12px !important',
                                    '&:before': { display: 'none' },
                                    boxShadow: 'none'
                                }}
                            >
                                <AccordionSummary expandIcon={<ExpandMore />}>
                                    <Typography variant="h6" fontWeight={600}>{faq.question}</Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Typography color="text.secondary" sx={{ lineHeight: 1.8 }}>
                                        {faq.answer}
                                    </Typography>
                                </AccordionDetails>
                            </Accordion>
                        </motion.div>
                    ))}
                </Container>
            </Box>

            {/* Contact Section */}
            <Box id="contact" sx={{ py: 12, background: 'var(--bg-primary)' }}>
                <Container maxWidth="lg">
                    <Typography variant="h2" align="center" gutterBottom fontWeight={700}>
                        Get In <span className="gradient-text">Touch</span>
                    </Typography>
                    <Typography variant="h6" align="center" color="text.secondary" paragraph sx={{ mb: 6 }}>
                        Have questions? We'd love to hear from you
                    </Typography>

                    {/* Contact Info Cards */}
                    <Grid container spacing={3} sx={{ mb: 6 }}>
                        {[
                            { icon: <Place />, title: 'Visit Us', info: ['National University of Sciences and Technology (NUST)', 'Islamabad, Pakistan'] },
                            { icon: <Phone />, title: 'Call Us', info: ['+92 (300) 123-4567', '+92 (333) 987-6543'] },
                            { icon: <Mail />, title: 'Email Us', info: ['info@legalyzing.com', 'support@legalyzing.com'] },
                            { icon: <AccessTime />, title: 'Working Hours', info: ['Mon - Fri: 9:00 AM - 6:00 PM', '24/7 Emergency Support'] }
                        ].map((item, index) => (
                            <Grid item xs={12} sm={6} md={3} key={index}>
                                <Card className="glass hover-lift" sx={{ p: 3, textAlign: 'center', height: '100%', bgcolor: 'background.paper' }}>
                                    <Box sx={{ 
                                        width: 64, 
                                        height: 64, 
                                        borderRadius: '50%', 
                                        bgcolor: 'action.hover',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        mx: 'auto',
                                        mb: 2
                                    }}>
                                        {React.cloneElement(item.icon, { sx: { fontSize: 32, color: 'primary.main' } })}
                                    </Box>
                                    <Typography variant="h6" fontWeight={600} gutterBottom>{item.title}</Typography>
                                    {item.info.map((line, i) => (
                                        <Typography key={i} variant="body2" color="text.secondary">{line}</Typography>
                                    ))}
                                </Card>
                            </Grid>
                        ))}
                    </Grid>

                    <Grid container spacing={4}>
                        <Grid item xs={12} md={6}>
                            <Card className="glass" sx={{ p: 4, bgcolor: 'background.paper' }}>
                                <Typography variant="h5" fontWeight={700} gutterBottom>
                                    Send Us a <span className="gradient-text">Message</span>
                                </Typography>
                                <form onSubmit={handleSubmit}>
                                    <TextField fullWidth label="Full Name *" name="name" value={formData.name} onChange={handleInputChange} required sx={{ mb: 2 }} />
                                    <TextField fullWidth label="Email Address *" name="email" type="email" value={formData.email} onChange={handleInputChange} required sx={{ mb: 2 }} />
                                    <TextField fullWidth label="Phone Number" name="phone" value={formData.phone} onChange={handleInputChange} sx={{ mb: 2 }} />
                                    <TextField fullWidth label="Subject *" name="subject" value={formData.subject} onChange={handleInputChange} required sx={{ mb: 2 }} />
                                    <TextField fullWidth label="Message *" name="message" multiline rows={4} value={formData.message} onChange={handleInputChange} required sx={{ mb: 3 }} />
                                    <Button 
                                        type="submit" 
                                        fullWidth 
                                        variant="contained" 
                                        size="large"
                                        disabled={loading}
                                        endIcon={loading ? <CircularProgress size={20} /> : <Send />}
                                        sx={{
                                            background: mode === 'dark' ? 'linear-gradient(135deg, #76ABAE 0%, #8BC4C7 100%)' : mode === 'earthTone' ? '#A27B5C' : 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
                                            '&:hover': { background: mode === 'dark' ? '#5F8A8D' : mode === 'earthTone' ? '#8B6B4C' : 'linear-gradient(135deg, #4f46e5 0%, #0284c7 100%)' }
                                        }}
                                    >
                                        {loading ? 'Sending...' : 'Send Message'}
                                    </Button>
                                </form>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Card className="glass" sx={{ p: 0, overflow: 'hidden', height: '100%' }}>
                                <Box sx={{ height: '100%', minHeight: 400 }}>
                                    <iframe
                                        title="NUST, Islamabad Location"
                                        width="100%"
                                        height="100%"
                                        style={{ border: 0 }}
                                        loading="lazy"
                                        allowFullScreen
                                        referrerPolicy="no-referrer-when-downgrade"
                                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3320.684223983068!2d73.05582051520023!3d33.64426054693209!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x38df944c4bbfdf21%3A0x5e5d7bf0291e1e7b!2sMilitary%20College%20of%20Signals%20(MCS)!5e0!3m2!1sen!2sPK!4v1733150000000!5m2!1sen!2sPK"
                                    />
                                </Box>
                            </Card>
                        </Grid>
                    </Grid>
                </Container>
            </Box>



            {/* Notification Snackbar */}
            <Snackbar open={notification.open} autoHideDuration={6000} onClose={() => setNotification({ ...notification, open: false })}>
                <Alert onClose={() => setNotification({ ...notification, open: false })} severity={notification.severity} sx={{ width: '100%' }}>
                    {notification.message}
                </Alert>
            </Snackbar>

            {/* Footer */}
            <Box component="footer" sx={{ py: 6, bgcolor: 'background.paper', borderTop: '1px solid', borderColor: 'divider' }}>
                <Container maxWidth="lg">
                    <Grid container spacing={4} justifyContent="space-between">
                        <Grid item xs={12} md={4}>
                            <Typography variant="h6" fontWeight={700} gutterBottom sx={{ background: 'var(--primary-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                Legalyzing
                            </Typography>
                            <Typography variant="body2" color="text.secondary" paragraph>
                                Empowering legal professionals with next-generation AI tools for document generation and compliance.
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                {[Facebook, Twitter, LinkedIn, Instagram, GitHub].map((Icon, i) => (
                                    <IconButton key={i} size="small" sx={{ bgcolor: 'action.hover', '&:hover': { bgcolor: 'primary.main', color: 'white' } }}>
                                        <Icon fontSize="small" />
                                    </IconButton>
                                ))}
                            </Box>
                        </Grid>
                        <Grid item xs={6} md={2}>
                            <Typography variant="subtitle2" fontWeight={700} gutterBottom>Product</Typography>
                            <Stack spacing={1}>
                                {['Features', 'Pricing', 'API', 'Integrations', 'Documentation'].map((item) => (
                                    <Link key={item} href="#" color="text.secondary" underline="hover" sx={{ fontSize: '0.875rem' }}>{item}</Link>
                                ))}
                            </Stack>
                        </Grid>
                        <Grid item xs={6} md={2}>
                            <Typography variant="subtitle2" fontWeight={700} gutterBottom>Company</Typography>
                            <Stack spacing={1}>
                                {['About Us', 'Careers', 'Blog', 'Contact', 'Partners'].map((item) => (
                                    <Link key={item} href="#" color="text.secondary" underline="hover" sx={{ fontSize: '0.875rem' }}>{item}</Link>
                                ))}
                            </Stack>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Typography variant="subtitle2" fontWeight={700} gutterBottom>Newsletter</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Subscribe to stay updated with legal tech innovations.
                            </Typography>
                            <Box component="form" onSubmit={handleNewsletterSubscribe} sx={{ display: 'flex', gap: 1 }}>
                                <TextField
                                    size="small"
                                    placeholder="Enter your email"
                                    fullWidth
                                    value={newsletterEmail}
                                    onChange={(e) => setNewsletterEmail(e.target.value)}
                                    sx={{ 
                                        bgcolor: 'background.default',
                                        '& .MuiOutlinedInput-root': { borderRadius: '2px' }
                                    }}
                                />
                                <Button 
                                    type="submit"
                                    variant="contained" 
                                    disabled={newsletterLoading}
                                    sx={{ 
                                        background: 'var(--primary-gradient)', 
                                        color: 'white',
                                        minWidth: 'auto',
                                        px: 2
                                    }}
                                >
                                    {newsletterLoading ? <CircularProgress size={20} color="inherit" /> : <Send fontSize="small" />}
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                    <Divider sx={{ my: 4 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                            © {new Date().getFullYear()} Legalyzing. All rights reserved.
                        </Typography>
                        <Stack direction="row" spacing={3}>
                            <Link href="#" color="text.secondary" underline="hover" variant="body2">Privacy Policy</Link>
                            <Link href="#" color="text.secondary" underline="hover" variant="body2">Terms of Service</Link>
                            <Link href="#" color="text.secondary" underline="hover" variant="body2">Cookie Policy</Link>
                        </Stack>
                    </Box>
                </Container>
            </Box>
        </Box>
    );
};

export default LandingPage;
