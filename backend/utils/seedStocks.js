const Stock = require('../models/Stock');

/**
 * Seed initial stock data
 * Popular Indian stocks from NSE
 */
const stocksData = [
    // IT Sector
    {
        symbol: 'TCS',
        name: 'Tata Consultancy Services Ltd',
        exchange: 'NSE',
        sector: 'Information Technology',
        industry: 'IT Services & Consulting',
        basePrice: 3850.50,
        marketCap: 1400000,
        high52Week: 4100.00,
        low52Week: 3200.00,
    },
    {
        symbol: 'INFY',
        name: 'Infosys Ltd',
        exchange: 'NSE',
        sector: 'Information Technology',
        industry: 'IT Services & Consulting',
        basePrice: 1650.75,
        marketCap: 685000,
        high52Week: 1800.00,
        low52Week: 1350.00,
    },
    {
        symbol: 'WIPRO',
        name: 'Wipro Ltd',
        exchange: 'NSE',
        sector: 'Information Technology',
        industry: 'IT Services & Consulting',
        basePrice: 450.25,
        marketCap: 245000,
        high52Week: 520.00,
        low52Week: 380.00,
    },
    {
        symbol: 'HCLTECH',
        name: 'HCL Technologies Ltd',
        exchange: 'NSE',
        sector: 'Information Technology',
        industry: 'IT Services & Consulting',
        basePrice: 1520.80,
        marketCap: 412000,
        high52Week: 1650.00,
        low52Week: 1250.00,
    },
    {
        symbol: 'TECHM',
        name: 'Tech Mahindra Ltd',
        exchange: 'NSE',
        sector: 'Information Technology',
        industry: 'IT Services & Consulting',
        basePrice: 1280.40,
        marketCap: 124000,
        high52Week: 1450.00,
        low52Week: 1050.00,
    },

    // Banking & Finance
    {
        symbol: 'HDFCBANK',
        name: 'HDFC Bank Ltd',
        exchange: 'NSE',
        sector: 'Financial Services',
        industry: 'Private Bank',
        basePrice: 1650.30,
        marketCap: 1250000,
        high52Week: 1750.00,
        low52Week: 1450.00,
    },
    {
        symbol: 'ICICIBANK',
        name: 'ICICI Bank Ltd',
        exchange: 'NSE',
        sector: 'Financial Services',
        industry: 'Private Bank',
        basePrice: 1050.60,
        marketCap: 735000,
        high52Week: 1150.00,
        low52Week: 850.00,
    },
    {
        symbol: 'SBIN',
        name: 'State Bank of India',
        exchange: 'NSE',
        sector: 'Financial Services',
        industry: 'Public Bank',
        basePrice: 625.45,
        marketCap: 558000,
        high52Week: 720.00,
        low52Week: 520.00,
    },
    {
        symbol: 'AXISBANK',
        name: 'Axis Bank Ltd',
        exchange: 'NSE',
        sector: 'Financial Services',
        industry: 'Private Bank',
        basePrice: 1080.25,
        marketCap: 332000,
        high52Week: 1200.00,
        low52Week: 900.00,
    },
    {
        symbol: 'KOTAKBANK',
        name: 'Kotak Mahindra Bank Ltd',
        exchange: 'NSE',
        sector: 'Financial Services',
        industry: 'Private Bank',
        basePrice: 1750.90,
        marketCap: 348000,
        high52Week: 1950.00,
        low52Week: 1550.00,
    },

    // FMCG
    {
        symbol: 'HINDUNILVR',
        name: 'Hindustan Unilever Ltd',
        exchange: 'NSE',
        sector: 'FMCG',
        industry: 'Consumer Goods',
        basePrice: 2450.75,
        marketCap: 576000,
        high52Week: 2750.00,
        low52Week: 2200.00,
    },
    {
        symbol: 'ITC',
        name: 'ITC Ltd',
        exchange: 'NSE',
        sector: 'FMCG',
        industry: 'Diversified',
        basePrice: 425.30,
        marketCap: 530000,
        high52Week: 480.00,
        low52Week: 380.00,
    },
    {
        symbol: 'NESTLEIND',
        name: 'Nestle India Ltd',
        exchange: 'NSE',
        sector: 'FMCG',
        industry: 'Food Products',
        basePrice: 2380.50,
        marketCap: 229000,
        high52Week: 2650.00,
        low52Week: 2100.00,
    },

    // Automobile
    {
        symbol: 'MARUTI',
        name: 'Maruti Suzuki India Ltd',
        exchange: 'NSE',
        sector: 'Automobile',
        industry: 'Auto Manufacturers',
        basePrice: 11250.80,
        marketCap: 340000,
        high52Week: 12500.00,
        low52Week: 9500.00,
    },
    {
        symbol: 'TATAMOTORS',
        name: 'Tata Motors Ltd',
        exchange: 'NSE',
        sector: 'Automobile',
        industry: 'Auto Manufacturers',
        basePrice: 780.45,
        marketCap: 287000,
        high52Week: 950.00,
        low52Week: 650.00,
    },
    {
        symbol: 'M&M',
        name: 'Mahindra & Mahindra Ltd',
        exchange: 'NSE',
        sector: 'Automobile',
        industry: 'Auto Manufacturers',
        basePrice: 1850.60,
        marketCap: 229000,
        high52Week: 2100.00,
        low52Week: 1550.00,
    },

    // Pharma
    {
        symbol: 'SUNPHARMA',
        name: 'Sun Pharmaceutical Industries Ltd',
        exchange: 'NSE',
        sector: 'Pharmaceuticals',
        industry: 'Pharmaceuticals',
        basePrice: 1520.35,
        marketCap: 365000,
        high52Week: 1750.00,
        low52Week: 1250.00,
    },
    {
        symbol: 'DRREDDY',
        name: 'Dr Reddys Laboratories Ltd',
        exchange: 'NSE',
        sector: 'Pharmaceuticals',
        industry: 'Pharmaceuticals',
        basePrice: 5850.90,
        marketCap: 97500,
        high52Week: 6500.00,
        low52Week: 5000.00,
    },
    {
        symbol: 'CIPLA',
        name: 'Cipla Ltd',
        exchange: 'NSE',
        sector: 'Pharmaceuticals',
        industry: 'Pharmaceuticals',
        basePrice: 1380.25,
        marketCap: 111000,
        high52Week: 1550.00,
        low52Week: 1150.00,
    },

    // Energy & Oil
    {
        symbol: 'RELIANCE',
        name: 'Reliance Industries Ltd',
        exchange: 'NSE',
        sector: 'Energy',
        industry: 'Oil & Gas',
        basePrice: 2850.75,
        marketCap: 1930000,
        high52Week: 3100.00,
        low52Week: 2450.00,
    },
    {
        symbol: 'ONGC',
        name: 'Oil & Natural Gas Corporation Ltd',
        exchange: 'NSE',
        sector: 'Energy',
        industry: 'Oil & Gas',
        basePrice: 245.60,
        marketCap: 309000,
        high52Week: 290.00,
        low52Week: 210.00,
    },

    // Telecom
    {
        symbol: 'BHARTIARTL',
        name: 'Bharti Airtel Ltd',
        exchange: 'NSE',
        sector: 'Telecom',
        industry: 'Telecommunications',
        basePrice: 1250.40,
        marketCap: 710000,
        high52Week: 1450.00,
        low52Week: 1050.00,
    },

    // Metals
    {
        symbol: 'TATASTEEL',
        name: 'Tata Steel Ltd',
        exchange: 'NSE',
        sector: 'Metals',
        industry: 'Steel',
        basePrice: 145.80,
        marketCap: 178000,
        high52Week: 175.00,
        low52Week: 120.00,
    },
    {
        symbol: 'HINDALCO',
        name: 'Hindalco Industries Ltd',
        exchange: 'NSE',
        sector: 'Metals',
        industry: 'Aluminium',
        basePrice: 625.30,
        marketCap: 139000,
        high52Week: 720.00,
        low52Week: 520.00,
    },

    // Cement
    {
        symbol: 'ULTRACEMCO',
        name: 'UltraTech Cement Ltd',
        exchange: 'NSE',
        sector: 'Cement',
        industry: 'Cement',
        basePrice: 9250.50,
        marketCap: 267000,
        high52Week: 10500.00,
        low52Week: 8000.00,
    },
];

/**
 * Seed stocks into database
 */
const seedStocks = async () => {
    try {
        // Clear existing stocks
        await Stock.deleteMany({});
        console.log('📦 Cleared existing stocks');

        // Insert new stocks
        await Stock.insertMany(stocksData);
        console.log(`✅ Seeded ${stocksData.length} stocks successfully`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding stocks:', error);
        process.exit(1);
    }
};

module.exports = { seedStocks, stocksData };

// Run seeder if called directly
if (require.main === module) {
    const dotenv = require('dotenv');
    const connectDB = require('../config/db');

    dotenv.config();
    connectDB();
    seedStocks();
}
