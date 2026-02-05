/**
 * Full Reset Script
 * 
 * 1. Resets all users' balance to ₹1,00,000
 * 2. Deletes all Orders
 * 3. Deletes all Holdings (Portfolio)
 * 
 * Run with: node scripts/fullReset.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Order = require('../models/Order');
const Holding = require('../models/Holding');

const STARTING_BALANCE = 100000; // ₹1,00,000

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB Connected');
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error.message);
        process.exit(1);
    }
};

const fullReset = async () => {
    try {
        // 1. Reset Users
        console.log('\n🔄 Resetting User Balances...');
        const resultUsers = await User.updateMany({}, {
            virtualBalance: STARTING_BALANCE
        });
        console.log(`✅ Updated ${resultUsers.modifiedCount} users to ₹${STARTING_BALANCE}`);

        // 2. Delete Orders
        console.log('\n🗑️  Deleting Order History...');
        const resultOrders = await Order.deleteMany({});
        console.log(`✅ Deleted ${resultOrders.deletedCount} orders`);

        // 3. Delete Holdings
        console.log('\n🗑️  Clearing Portfolios...');
        const resultHoldings = await Holding.deleteMany({});
        console.log(`✅ Deleted ${resultHoldings.deletedCount} holdings`);

        console.log('\n✨ SYSTEM RESET COMPLETE ✨');
        console.log('-----------------------------------');
        console.log('1. All Portfolios are now ZERO');
        console.log(`2. All Balances are now ₹${STARTING_BALANCE}`);
        console.log('-----------------------------------');

    } catch (error) {
        console.error('❌ Error during reset:', error.message);
    }
};

const main = async () => {
    await connectDB();
    await fullReset();
    await mongoose.connection.close();
    process.exit(0);
};

main();
