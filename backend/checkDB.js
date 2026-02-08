const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Stock = require('./models/Stock');
const FyersToken = require('./models/FyersToken');

dotenv.config();

async function checkStatus() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const token = await FyersToken.findOne({ date: new Date().toLocaleDateString() });
        console.log('🔑 Token for today:', token ? 'FOUND' : 'NOT FOUND');

        const count = await Stock.countDocuments({ isActive: true });
        console.log('📈 Active stocks in DB:', count);

        const zeroPriceStocks = await Stock.countDocuments({ isActive: true, basePrice: 0 });
        console.log('❌ Stocks with zero price:', zeroPriceStocks);

        const someStocks = await Stock.find({ isActive: true }).limit(5);
        console.log('📋 Sample Stocks:');
        someStocks.forEach(s => {
            console.log(` - ${s.symbol}: ${s.basePrice} (TradingSymbol: ${s.tradingSymbol})`);
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Error checking status:', error);
        process.exit(1);
    }
}

checkStatus();
