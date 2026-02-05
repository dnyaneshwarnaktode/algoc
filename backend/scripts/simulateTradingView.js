const mongoose = require('mongoose');
const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Load Models
const Strategy = require('../models/Strategy');

// Configuration
const WEBHOOK_URL = 'http://localhost:5000/api/webhook/tradingview';

// Connect to Database
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error);
        process.exit(1);
    }
};

const getRandomPrice = (base = 2500) => {
    const change = (Math.random() - 0.5) * 50;
    return parseFloat((base + change).toFixed(2));
};

const generateSignal = async () => {
    try {
        // Find active strategies
        const strategies = await Strategy.find({ isActive: true });

        if (strategies.length === 0) {
            console.log('⚠️ No active strategies found. Please create and activate a strategy first.');
            return;
        }

        // Pick a random strategy
        const strategy = strategies[Math.floor(Math.random() * strategies.length)];

        // Use strategy's symbol or default
        const symbol = strategy.symbol || 'RELIANCE';
        const action = Math.random() > 0.5 ? 'BUY' : 'SELL';
        const price = getRandomPrice();

        const payload = {
            symbol: symbol,
            action: action,
            quantity: 1,
            price: price,
            strategy: strategy.name,
            secret: strategy.webhookSecret,
            timestamp: new Date().toISOString()
        };

        console.log(`\n📤 Sending Signal for ${strategy.name}: ${action} ${symbol} @ ${price}`);

        try {
            const response = await axios.post(WEBHOOK_URL, payload);
            console.log('✅ Webhook Success:', response.data.message);
            if (response.data.data) {
                console.log('   Stats:', response.data.data);
            }
        } catch (err) {
            console.error('❌ Webhook Failed:', err.response?.data?.message || err.message);
            if (err.response?.data?.reason) {
                console.error('   Reason:', err.response.data.reason);
            }
        }

    } catch (error) {
        console.error('Error generating signal:', error);
    }
};

// Main Loop
const startSimulation = async () => {
    await connectDB();

    console.log('\n🤖 TradingView Simulator Started');
    console.log('-----------------------------------');
    console.log('Looking for active strategies...');
    console.log('Press Ctrl+C to stop\n');

    // Send a signal every 5 seconds
    generateSignal(); // Immediate first run
    setInterval(generateSignal, 5000);
};

startSimulation();
