console.log('--- SERVER STARTING ---');
// override:true so the .env key wins over any stale OPENAI_API_KEY exported in the
// shell/OS environment (dotenv does not overwrite an existing env var by default).
require('dotenv').config({ override: true });
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
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
const internationalRoutes = require('./routes/international'); // Legalyze 2.0 (International Law)
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

// ---- Security headers (clickjacking, MIME-sniffing, HSTS, referrer, etc.) ----
// This is a JSON API with a separate frontend, so a strict CSP here would only risk
// breaking things without protecting the API; we keep every other hardening header.
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// ---- Gzip/deflate response compression (lower latency & bandwidth) ----
app.use(compression());

// ---- CORS: allow only known frontends (no credentials; Bearer tokens in header) ----
const allowedOrigins = [
    process.env.FRONTEND_URL,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
].filter(Boolean);
app.use(cors({
    origin(origin, cb) {
        // allow non-browser clients (no Origin header) and whitelisted origins only.
        // Disallowed origins get no CORS headers (browser blocks the read) — we return
        // false rather than throwing, to avoid noisy 500s.
        if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
        return cb(null, false);
    },
    optionsSuccessStatus: 200,
}));

// ---- Body parsers with sane limits (the previous 50mb was a DoS vector) ----
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// ---- Injection hardening ----
app.use(mongoSanitize()); // strips $ / . from keys → blocks NoSQL operator injection
app.use(hpp());           // blocks HTTP parameter pollution (?role=user&role=admin)

// ---- Rate limiting ----
// Generous global limiter (DoS guard).
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5000,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests from this IP, please try again later.' },
});
app.use(limiter);

// Strict limiter over the whole auth surface.
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many authentication attempts, please try again later.' },
});

// Even stricter for login — only FAILED attempts count, so real users aren't punished
// but credential brute-force is throttled hard.
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    skipSuccessfulRequests: true,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many failed login attempts. Please try again in 15 minutes.' },
});

//Routes
app.use('/api/auth/login', loginLimiter);   // hard brute-force cap on credential checks
app.use('/api/auth', authLimiter, authRoutes); // strict limiter across the auth surface
app.use('/api/chat', chatRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/generate', generateRoutes);
app.use('/api/smart-generate', smartGenerateRoutes);
app.use('/api/constitutional-compliance', constitutionalComplianceRoutes);
app.use('/api/judgments', judgmentRoutes);
app.use('/api/case-building', caseBuildingRoutes);
app.use('/api/international', internationalRoutes); // Legalyze 2.0 (International Law)
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
    // Full detail stays SERVER-SIDE only.
    console.error('Global error handler:', err);

    const status = err.status || err.statusCode || 500;
    // Never leak internal error details to the client on server (5xx) errors — driver /
    // connection / stack messages can expose DB hosts, credentials hints or internals.
    // Client (4xx) errors carry safe, intentional messages (validation, auth, etc.).
    const isClientError = status >= 400 && status < 500;
    const safeMessage = isClientError ? (err.message || 'Request error') : 'Internal server error';

    res.status(status).json({
        success: false,
        message: safeMessage,
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
    // Auto-start the Legalyze 2.0 engine for the "International Law" chat mode.
    try {
        const { startLegalyze2Engine } = require('./services/legalyze2Engine');
        startLegalyze2Engine();
    } catch (e) {
        console.warn('🌐 Legalyze 2.0 engine autostart skipped:', e.message);
    }
});

// Set server timeout to 10 minutes (600,000 ms) to handle long-running operations
server.timeout = 600000;

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Promise Rejection:', err);
    // Do not crash the server in production/dev for minor async errors
    // process.exit(1);
});
