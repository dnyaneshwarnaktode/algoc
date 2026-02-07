/**
 * Create Admin User Script
 * 
 * Creates a default admin user for AlgoC platform
 * Run with: node scripts/createAdmin.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

// Admin user details
const ADMIN_USER = {
    name: 'Admin User',
    email: 'admin@gmail.com',
    password: 'pranay123',
    role: 'admin',
    virtualBalance: 1000000, // ₹10,00,000 for admin
    isActive: true,
};

/**
 * Connect to MongoDB
 */
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB Connected');
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error.message);
        process.exit(1);
    }
};

/**
 * Create admin user
 */
const createAdmin = async () => {
    try {
        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: ADMIN_USER.email });

        if (existingAdmin) {
            console.log('⚠️  Admin user already exists!');
            console.log('📧 Email:', existingAdmin.email);
            console.log('👤 Name:', existingAdmin.name);
            console.log('🔑 Role:', existingAdmin.role);
            console.log('\n💡 To reset password, delete the user first or use a different email.');
            return;
        }

        // Create new admin user
        const admin = await User.create(ADMIN_USER);

        console.log('✅ Admin user created successfully!');
        console.log('\n📋 Admin Details:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('👤 Name:     ', admin.name);
        console.log('📧 Email:    ', admin.email);
        console.log('🔑 Password: ', ADMIN_USER.password);
        console.log('💼 Role:     ', admin.role);
        console.log('💰 Balance:  ', `₹${admin.virtualBalance.toLocaleString('en-IN')}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('\n🔐 Login Credentials:');
        console.log('   Email:    admin@algoc.com');
        console.log('   Password: admin123');
        console.log('\n⚠️  IMPORTANT: Change the password after first login!');
        console.log('\n🎯 Admin Access:');
        console.log('   - Market Data Control');
        console.log('   - Connection Management');
        console.log('   - Symbol Mappings');

    } catch (error) {
        console.error('❌ Error creating admin user:', error.message);

        if (error.code === 11000) {
            console.log('\n💡 Email already exists. Use a different email or delete the existing user.');
        }
    }
};

/**
 * Main function
 */
const main = async () => {
    console.log('🚀 Creating Admin User for AlgoC Platform...\n');

    await connectDB();
    await createAdmin();

    // Close connection
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);
};

// Run the script
main();
