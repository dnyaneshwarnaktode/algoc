/**
 * Update User Balances Script
 * 
 * Updates all existing users to have ₹10,00,000 virtual balance
 * Run with: node scripts/updateBalances.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const NEW_BALANCE = 1000000; // ₹10,00,000

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
 * Update user balances
 */
const updateBalances = async () => {
    try {
        // Get all users
        const users = await User.find({});

        console.log(`\n📊 Found ${users.length} users`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        let updated = 0;
        let skipped = 0;

        for (const user of users) {
            const oldBalance = user.virtualBalance;

            // Update balance to ₹10,00,000
            user.virtualBalance = NEW_BALANCE;
            await user.save();

            console.log(`✅ ${user.name} (${user.email})`);
            console.log(`   Old Balance: ₹${oldBalance.toLocaleString('en-IN')}`);
            console.log(`   New Balance: ₹${NEW_BALANCE.toLocaleString('en-IN')}\n`);

            updated++;
        }

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`\n✅ Updated ${updated} users`);
        console.log(`⏭️  Skipped ${skipped} users`);
        console.log(`\n💰 All users now have ₹${NEW_BALANCE.toLocaleString('en-IN')} virtual balance`);

    } catch (error) {
        console.error('❌ Error updating balances:', error.message);
    }
};

/**
 * Main function
 */
const main = async () => {
    console.log('🚀 Updating User Balances...\n');

    await connectDB();
    await updateBalances();

    // Close connection
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);
};

// Run the script
main();
