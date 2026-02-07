const marketDataService = require('./marketDataService');

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

            // Send market data mode to client
            socket.emit('market_mode', {
                mode: marketDataService.getMode(),
                status: marketDataService.getStatus(),
            });

            // Handle stock subscription
            socket.on('subscribe', async (data) => {
                try {
                    const { symbols } = data;

                    if (Array.isArray(symbols)) {
                        // Subscribe to multiple stocks
                        for (const symbol of symbols) {
                            socket.join(`stock:${symbol}`);
                            this.activeStocks.add(symbol);

                            // Ensure market data service knows about this stock (async)
                            await marketDataService.ensureStockTracked(symbol);
                        }

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
            console.log(`📈 Starting price updates...`);

            // Subscribe to market data updates
            // In simulated mode, broadcast updates periodically
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
            const marketData = marketDataService.getMarketData(symbol);
            if (marketData) {
                const priceUpdate = {
                    symbol: marketData.symbol,
                    price: marketData.ltp,
                    ltp: marketData.ltp,
                    open: marketData.open,
                    high: marketData.high,
                    low: marketData.low,
                    close: marketData.close,
                    volume: marketData.volume,
                    timestamp: marketData.timestamp,
                    // Calculate change
                    change: marketData.ltp - marketData.close,
                    changePercent: ((marketData.ltp - marketData.close) / marketData.close) * 100,
                };

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
            const marketData = marketDataService.getMarketData(symbol);
            if (marketData) {
                prices.push({
                    symbol: marketData.symbol,
                    price: marketData.ltp,
                    ltp: marketData.ltp,
                    open: marketData.open,
                    high: marketData.high,
                    low: marketData.low,
                    close: marketData.close,
                    volume: marketData.volume,
                    timestamp: marketData.timestamp,
                    change: marketData.ltp - marketData.close,
                    changePercent: ((marketData.ltp - marketData.close) / marketData.close) * 100,
                });
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

