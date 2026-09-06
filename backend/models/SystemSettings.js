const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema({
    globalAnnouncement: {
        message: { type: String, default: '' },
        isActive: { type: Boolean, default: false },
        type: { type: String, enum: ['info', 'warning', 'error'], default: 'info' }
    },
    disabledThemes: [{ type: String }], // Array of theme keys (e.g., 'palette1')
    maintenanceMode: { type: Boolean, default: false },
    lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Singleton pattern: ensure only one settings document exists
systemSettingsSchema.statics.getSettings = async function() {
    let settings = await this.findOne();
    if (!settings) {
        settings = await this.create({});
    }
    return settings;
};

const SystemSettings = mongoose.model('SystemSettings', systemSettingsSchema);
module.exports = SystemSettings;
