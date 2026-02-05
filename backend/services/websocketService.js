const Stock = require('../models/Stock');
const priceGenerator = require('./priceGenerator');
const marketDataController = require('../controllers/marketDataController');

/**
 * WebSocket Service
 * Handles real-time price updates via Socket.IO
 */
class WebSocketService {
    constructor() {
        this.io = null;
        this.priceUpdateInterval = null;
        this.updateFrequency = 2000; // Update every 2 seconds
        this.activeStocks = new Set();
    }

    /**
     * Initialize Socket.IO server
     */
    initialize(server) {
        const socketIO = require('socket.io');

        this.io = socketIO(server, {
            cors: {
                origin: process.env.CLIENT_URL || 'http://localhost:3000',
                methods: ['GET', 'POST'],
                credentials: true,
            },
        });

        this.setupEventHandlers();
        this.startPriceUpdates();

        console.log('✅ WebSocket service initialized');
    }

    /**
     * Setup Socket.IO event handlers
     */
    setupEventHandlers() {
        this.io.on('connection', (socket) => {
            console.log(`🔌 Client connected: ${socket.id}`);

            // Handle stock subscription
            socket.on('subscribe', async (data) => {
                try {
                    const { symbols } = data;

                    if (Array.isArray(symbols)) {
                        // Subscribe to multiple stocks
                        symbols.forEach((symbol) => {
                            socket.join(`stock:${symbol}`);
                            this.activeStocks.add(symbol);
                        });

                        // Send current prices immediately
                        const prices = await this.getCurrentPrices(symbols);
                        socket.emit('prices', prices);

                        console.log(`📊 Client ${socket.id} subscribed to ${symbols.length} stocks`);
                    }
                } catch (error) {
                    console.error('Subscribe error:', error);
                    socket.emit('error', { message: 'Failed to subscribe to stocks' });
                }
            });

            // Handle stock unsubscription
            socket.on('unsubscribe', (data) => {
                try {
                    const { symbols } = data;

                    if (Array.isArray(symbols)) {
                        symbols.forEach((symbol) => {
                            socket.leave(`stock:${symbol}`);
                        });

                        console.log(`📊 Client ${socket.id} unsubscribed from ${symbols.length} stocks`);
                    }
                } catch (error) {
                    console.error('Unsubscribe error:', error);
                }
            });

            // Handle disconnection
            socket.on('disconnect', () => {
                console.log(`🔌 Client disconnected: ${socket.id}`);
            });
        });
    }

    /**
     * Start periodic price updates
     */
    async startPriceUpdates() {
        try {
            // Initialize market data controller
            await marketDataController.initializeMarketData();

            // Initialize all stocks with base prices
            const stocks = await Stock.find({ isActive: true });

            stocks.forEach((stock) => {
                priceGenerator.initializeStock(stock.symbol, stock.basePrice);
                this.activeStocks.add(stock.symbol);
            });

            console.log(`📈 Initialized ${stocks.length} stocks for price updates`);

            // Register callback for Angel One price updates
            marketDataController.onPriceUpdate((priceData) => {
                // Emit Angel One price to subscribed clients
                this.io.to(`stock:${priceData.symbol}`).emit('price_update', priceData);
                this.io.emit('prices', [priceData]);
            });

            // Start Angel One streaming (if enabled)
            const symbols = Array.from(this.activeStocks);
            await marketDataController.startMarketData(symbols);
            await marketDataController.subscribeToSymbols(symbols);

            // Start simulated price updates as fallback
            this.priceUpdateInterval = setInterval(() => {
                this.broadcastPriceUpdates();
            }, this.updateFrequency);

            console.log(`⏰ Price updates started (every ${this.updateFrequency}ms)`);
        } catch (error) {
            console.error('Error starting price updates:', error);
        }
    }

    /**
     * Broadcast price updates to subscribed clients
     */
    broadcastPriceUpdates() {
        const updates = [];

        this.activeStocks.forEach((symbol) => {
            const priceUpdate = priceGenerator.generateNextPrice(symbol);
            if (priceUpdate) {
                updates.push(priceUpdate);

                // Emit to all clients subscribed to this stock
                this.io.to(`stock:${symbol}`).emit('price_update', priceUpdate);
            }
        });

        // Also emit all updates together
        if (updates.length > 0) {
            this.io.emit('prices', updates);
        }
    }

    /**
     * Get current prices for multiple stocks
     */
    async getCurrentPrices(symbols) {
        const prices = [];

        for (const symbol of symbols) {
            const price = priceGenerator.getCurrentPrice(symbol);
            if (price) {
                prices.push(price);
            } else {
                // Initialize if not found
                const stock = await Stock.findOne({ symbol, isActive: true });
                if (stock) {
                    priceGenerator.initializeStock(symbol, stock.basePrice);
                    prices.push(priceGenerator.getCurrentPrice(symbol));
                }
            }
        }

        return prices;
    }

    /**
     * Stop price updates
     */
    stopPriceUpdates() {
        if (this.priceUpdateInterval) {
            clearInterval(this.priceUpdateInterval);
            this.priceUpdateInterval = null;
            console.log('⏹️ Price updates stopped');
        }
    }

    /**
     * Get Socket.IO instance
     */
    getIO() {
        return this.io;
    }
}

module.exports = new WebSocketService();
