const mongoose = require('mongoose');

const loginLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    loginTime: {
        type: Date,
        default: Date.now
    },
    logoutTime: {
        type: Date
    },
    duration: {
        type: Number, // in minutes
        default: 0
    },
    ipAddress: String,
    userAgent: String
}, { timestamps: true });

module.exports = mongoose.model('LoginLog', loginLogSchema);
