console.log('Loading User model...');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [
                /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
                'Please provide a valid email address'
            ]
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [8, 'Password must be at least 8 characters long'],
            select: false // Never return password in queries by default
        },
        firstName: {
            type: String,
            required: [true, 'First name is required'],
            trim: true,
            minlength: [2, 'First name must be at least 2 characters long'],
            maxlength: [50, 'First name cannot exceed 50 characters']
        },
        lastName: {
            type: String,
            required: [true, 'Last name is required'],
            trim: true,
            minlength: [2, 'Last name must be at least 2 characters long'],
            maxlength: [50, 'Last name cannot exceed 50 characters']
        },
        dateOfBirth: {
            type: Date,
            required: false
        },
        isActive: {
            type: Boolean,
            default: true
        },
        isVerified: {
            type: Boolean,
            default: false
        },
        role: {
            type: String,
            enum: ['user', 'admin', 'superadmin'],
            default: 'user'
        },
        verificationToken: String,
        googleId: {
            type: String,
            unique: true,
            sparse: true  // Allows null values without unique constraint issues
        },
        profilePicture: {
            type: String
        },
        verificationTokenExpire: Date,
        lastLogin: {
            type: Date,
            default: null
        },
        disabledFeatures: [{
            type: String // e.g., 'compliance', 'chat', 'documents'
        }],
        extractedFacts: {
            type: {
                personal: {
                    name: String,
                    fatherName: String,
                    cnic: String,
                    address: String,
                    phone: String,
                    email: String
                },
                financial: {
                    monthlyRent: Number,
                    securityDeposit: Number,
                    monthlyIncome: Number,
                    salary: Number
                },
                property: {
                    propertyAddress: String,
                    propertyType: String,
                    propertySize: String
                },
                company: {
                    companyName: String,
                    directorName: String,
                    companyAddress: String,
                    designation: String
                },
                dates: {
                    agreementDate: String,
                    leaseStartDate: String,
                    leaseEndDate: String,
                    joiningDate: String,
                    effectiveDate: String
                },
                witnesses: {
                    witness1Name: String,
                    witness1Address: String,
                    witness2Name: String,
                    witness2Address: String
                },
                other: {
                    signingPlace: String,
                    jurisdiction: String,
                    duration: String
                }
            },
            default: {}
        },
        factsLastUpdated: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true, // Automatically adds createdAt and updatedAt
        collection: 'users'
    }
);

// Hash password before saving - using 12 salt rounds for strong security
userSchema.pre('save', async function (next) {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) {
        return next();
    }

    try {
        // Generate salt with 12 rounds (industry standard for strong security)
        const salt = await bcrypt.genSalt(12);
        
        // Hash password
        this.password = await bcrypt.hash(this.password, salt);
        
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password for login
userSchema.methods.comparePassword = async function (candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw new Error('Password comparison failed');
    }
};

// Method to generate verification token
userSchema.methods.getVerificationToken = function () {
    // Generate token
    const verificationToken = crypto.randomBytes(20).toString('hex');

    // Hash token and set to verificationToken field
    this.verificationToken = crypto
        .createHash('sha256')
        .update(verificationToken)
        .digest('hex');

    // Set expire (24 hours)
    this.verificationTokenExpire = Date.now() + 24 * 60 * 60 * 1000;

    return verificationToken;
};

// Method to get user object without sensitive data
userSchema.methods.toJSON = function () {
    const user = this.toObject();
    delete user.password;
    delete user.__v;
    delete user.verificationToken;
    delete user.verificationTokenExpire;
    return user;
};

// Static method to find user by email with password (for login)
userSchema.statics.findByCredentials = async function (email, password) {
    const user = await this.findOne({ email }).select('+password');
    
    if (!user) {
        throw new Error('Invalid email or password');
    }

    const isPasswordMatch = await user.comparePassword(password);
    
    if (!isPasswordMatch) {
        throw new Error('Invalid email or password');
    }

    return user;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
