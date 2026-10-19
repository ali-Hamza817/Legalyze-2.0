const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to protect routes - verify JWT token
const protect = async (req, res, next) => {
    let token;

    try {
        // Check if token exists in Authorization header
        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer')
        ) {
            // Extract token from "Bearer <token>"
            token = req.headers.authorization.split(' ')[1];
        }

        // Check if token exists
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to access this route. Please login.'
            });
        }

        try {
            // Verify token (access tokens only — refresh tokens must not grant access)
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            if (decoded.type === 'refresh') {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid access token. Please use an access token.'
                });
            }

            // Get user from token (exclude password)
            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found. Token may be invalid.'
                });
            }

            // Check if user is active
            if (!req.user.isActive) {
                return res.status(401).json({
                    success: false,
                    message: 'User account is deactivated.'
                });
            }

            next();
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: 'Token has expired. Please login again.'
                });
            }
            
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid token. Please login again.'
                });
            }

            throw error;
        }
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error during authentication'
        });
    }
};

// ---- JWT token helpers: short-lived access token + long-lived refresh token ----
const ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '2h';
const REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '30d';
// A distinct secret for refresh tokens; derived from JWT_SECRET if not set, so it
// stays stable across restarts without extra config.
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || `${process.env.JWT_SECRET}::refresh`;

// Short-lived access token — sent on every API request (Authorization: Bearer).
const generateAccessToken = (userId) =>
    jwt.sign({ id: userId, type: 'access' }, process.env.JWT_SECRET, { expiresIn: ACCESS_EXPIRY });

// Long-lived refresh token — used ONLY to obtain new access tokens. It carries the
// user's tokenVersion so every refresh token can be revoked at once by bumping it
// (on logout, password change, or a forced sign-out).
const generateRefreshToken = (user) =>
    jwt.sign(
        { id: user._id, type: 'refresh', tokenVersion: user.tokenVersion || 0 },
        REFRESH_SECRET,
        { expiresIn: REFRESH_EXPIRY }
    );

const generateTokens = (user) => ({
    accessToken: generateAccessToken(user._id),
    refreshToken: generateRefreshToken(user),
});

const verifyRefreshToken = (token) => jwt.verify(token, REFRESH_SECRET);

// Backward-compatible alias (older call sites import `generateToken`).
const generateToken = generateAccessToken;

module.exports = {
    protect,
    generateToken,
    generateAccessToken,
    generateRefreshToken,
    generateTokens,
    verifyRefreshToken,
    REFRESH_SECRET,
};
