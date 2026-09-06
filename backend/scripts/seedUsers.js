require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

// Test users with strong passwords
const testUsers = [
    {
        email: 'tester@gmail.com',
        password: 'Test1234',
        firstName: 'Test',
        lastName: 'User',
        dateOfBirth: new Date('1995-01-01'),
        isVerified: true
    },
    {
        email: 'admin@legalyze.com',
        password: 'Admin@123',
        firstName: 'Admin',
        lastName: 'User',
        dateOfBirth: new Date('1990-01-01'),
        isVerified: true
    },
    {
        email: 'john.doe@legalyze.com',
        password: 'John@123',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date('1985-05-15'),
        isVerified: true
    },
    {
        email: 'jane.smith@legalyze.com',
        password: 'Jane@123',
        firstName: 'Jane',
        lastName: 'Smith',
        dateOfBirth: new Date('1992-08-20'),
        isVerified: true
    }
];

const seedUsers = async () => {
    try {
        // Connect to MongoDB
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ MongoDB Connected');

        // Clear existing users (optional - comment out if you want to keep existing users)
        console.log('🗑️  Clearing existing users...');
        await User.deleteMany({});
        console.log('✅ Existing users cleared');

        // Create test users
        console.log('👥 Creating test users...');
        const createdUsers = [];
        
        for (const userData of testUsers) {
            const user = await User.create(userData);
            createdUsers.push({
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                id: user._id
            });
            console.log(`✅ Created user: ${user.email}`);
        }

        console.log('\n' + '='.repeat(60));
        console.log('🎉 Database seeded successfully!');
        console.log('='.repeat(60));
        console.log('\n📋 Test User Credentials:\n');
        
        testUsers.forEach((user, index) => {
            console.log(`${index + 1}. Email: ${user.email}`);
            console.log(`   Password: ${user.password}`);
            console.log(`   Name: ${user.firstName} ${user.lastName}\n`);
        });

        console.log('='.repeat(60));
        console.log('💡 You can now use these credentials to login!');
        console.log('='.repeat(60));

        // Close connection
        await mongoose.connection.close();
        console.log('\n🔌 MongoDB connection closed');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
};

// Run the seed function
seedUsers();
