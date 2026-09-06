console.log('--- SERVER STARTING ---');
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const documentRoutes = require('./routes/documents');
const contactRoutes = require('./routes/contact');
const generateRoutes = require('./routes/generate');
const smartGenerateRoutes = require('./routes/smartGenerate');
const constitutionalComplianceRoutes = require('./routes/constitutionalCompliance');
const judgmentRoutes = require('./routes/judgments');
const caseBuildingRoutes = require('./routes/caseBuilding');
let adminRoutes;
try {
    adminRoutes = require('./routes/admin'); // Import Admin Routes
} catch (error) {
    console.error("FATAL ERROR LOADING ADMIN ROUTES:", error);
    process.exit(1);
}

// Initialize Express app
const app = express();

// Trust proxy headers (needed when behind a reverse proxy like Nginx)
app.set('trust proxy', 1);

// Initialize Passport
const passport = require('./config/passport');
app.use(passport.initialize());

// Connect to MongoDB
// Connect to MongoDB
connectDB();

// CORS configuration - Allow requests from any origin
app.use(cors({
    origin: '*',
    optionsSuccessStatus: 200
}));

// Body parser middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate limiting to prevent brute force attacks
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5000, // Increased from 100 to 5000 to prevent Admin 429 lockouts
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.'
    }
});

// Apply rate limiting to all routes
app.use(limiter);

// Stricter rate limiting for auth routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // Increased from 100 to 500
    message: {
        success: false,
        message: 'Too many authentication attempts, please try again later.'
    }
});

//Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/generate', generateRoutes);
app.use('/api/smart-generate', smartGenerateRoutes);
app.use('/api/constitutional-compliance', constitutionalComplianceRoutes);
app.use('/api/judgments', judgmentRoutes);
app.use('/api/case-building', caseBuildingRoutes);
if (adminRoutes) {
    app.use('/api/admin', adminRoutes); // Register Admin Routes
}

// Health check route
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Legalyze Backend API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
    });
});

// Root route
app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Welcome to Legalyze Authentication API',
        version: '1.0.0',
        endpoints: {
            health: '/api/health',
            auth: {
                signup: 'POST /api/auth/signup',
                login: 'POST /api/auth/login',
                me: 'GET /api/auth/me (Protected)',
                logout: 'POST /api/auth/logout (Protected)'
            },
            chat: {
                sendMessage: 'POST /api/chat (Protected)',
                getConversations: 'GET /api/chat/conversations (Protected)',
                getConversation: 'GET /api/chat/conversations/:id (Protected)',
                deleteConversation: 'DELETE /api/chat/conversations/:id (Protected)'
            },
            documents: {
                upload: 'POST /api/documents/upload (Protected)',
                list: 'GET /api/documents (Protected)',
                get: 'GET /api/documents/:id (Protected)',
                delete: 'DELETE /api/documents/:id (Protected)'
            }
        }
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Global error handler:', err);
    
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log(`🚀 Server running in ${process.env.NODE_ENV} mode`);
    console.log(`📡 Server listening on port ${PORT}`);
    console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL}`);
    console.log(`🔗 API URL: http://localhost:${PORT}`);
    console.log('='.repeat(50));
});

// Set server timeout to 10 minutes (600,000 ms) to handle long-running operations
server.timeout = 600000;

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Promise Rejection:', err);
    // Do not crash the server in production/dev for minor async errors
    // process.exit(1);
});
