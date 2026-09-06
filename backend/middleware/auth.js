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
            // Verify token
            console.log('Auth Middleware - Verifying token:', token.substring(0, 10) + '...');
            console.log('Auth Middleware - Secret length:', process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 'MISSING');
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

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

// Helper function to generate JWT token
const generateToken = (userId) => {
    return jwt.sign(
        { id: userId },
        process.env.JWT_SECRET
        // No expiresIn: Token persists indefinitely or until secret is rotated
    );
};

module.exports = { protect, generateToken };
