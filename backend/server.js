const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Request Logger
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`${new Date().toISOString()} - ${req.method} ${req.url} ${res.statusCode} (${duration}ms)`);
    });
    next();
});

// Handle favicon
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Routes
const authRoutes = require('./routes/authRoutes');
const stockRoutes = require('./routes/stockRoutes');
const orderRoutes = require('./routes/orderRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const strategyRoutes = require('./routes/strategyRoutes');
const adminRoutes = require('./routes/adminRoutes');
const fyersRoutes = require('./routes/fyersRoutes');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/stocks', stockRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/webhook', webhookRoutes);
app.use('/api/strategies', strategyRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/fyers', fyersRoutes);

// Basic health check route
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'AlgoC Backend Server is running',
        timestamp: new Date().toISOString(),
        phase: 'Phase 5 - Orders & Trading Logic'
    });
});

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Internal Server Error'
    });
});

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Initialize WebSocket service
const websocketService = require('./services/websocketService');
websocketService.initialize(server);

// Initialize Market Data Service
const marketDataService = require('./services/marketDataService');
marketDataService.initialize().then(() => {
    marketDataService.startMarketFeed();
    console.log('✅ Market Data Service started');
}).catch(err => {
    console.error('❌ Market Data Service initialization failed:', err);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error(`❌ Unhandled Rejection: ${err.message}`);
    websocketService.stopPriceUpdates();
    server.close(() => process.exit(1));
});

module.exports = app;
