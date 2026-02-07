const Stock = require('../models/Stock');
const priceGenerator = require('./priceGenerator');
const fyersAuthService = require('./fyersAuthService');
const fyersDataService = require('./fyersDataService');

/**
 * Centralized Market Data Service
 * Manages market data feeds (SIMULATED or FYERS)
 */
class MarketDataService {
    constructor() {
        this.mode = process.env.MARKET_DATA_SOURCE || 'SIMULATED';
        this.priceCache = new Map(); // symbol -> { ltp, ohlc, volume, timestamp }
        this.subscribers = new Map(); // symbol -> Set of callbacks
        this.isInitialized = false;
        this.simulatedInterval = null;
    }

    /**
     * Initialize market data service
     */
    async initialize() {
        if (this.isInitialized) {
            console.log('⚠️ Market data service already initialized');
            return;
        }

        try {
            console.log(`📊 Initializing Market Data Service (Mode: ${this.mode})`);

            // Load all active stocks
            const stocks = await Stock.find({ isActive: true });

            if (this.mode === 'FYERS' && fyersAuthService.isAuthenticated()) {
                await this.initializeFyers(stocks);
            } else {
                if (this.mode === 'FYERS') {
                    console.log('⚠️ Fyers not authenticated, falling back to SIMULATED');
                    this.mode = 'SIMULATED';
                }
                await this.initializeSimulated(stocks);
            }

            this.isInitialized = true;
            console.log(`✅ Market Data Service initialized with ${stocks.length} stocks`);
        } catch (error) {
            console.error('❌ Failed to initialize Market Data Service:', error);
            throw error;
        }
    }

    /**
     * Initialize Simulated mode
     */
    async initializeSimulated(stocks) {
        console.log('🎮 Initializing Simulated mode...');

        stocks.forEach(stock => {
            this.priceCache.set(stock.symbol, {
                symbol: stock.symbol,
                ltp: stock.basePrice,
                open: stock.basePrice,
                high: stock.basePrice * 1.02,
                low: stock.basePrice * 0.98,
                close: stock.basePrice,
                volume: Math.floor(Math.random() * 1000000),
                timestamp: new Date()
            });

            // Initialize simulated price generator
            priceGenerator.initializeStock(stock.symbol, stock.basePrice);
        });

        console.log('✅ Simulated mode initialized');
    }

    /**
     * Initialize Fyers mode
     */
    async initializeFyers(stocks) {
        console.log('🚀 Initializing Fyers mode...');

        const connected = await fyersDataService.initialize();
        console.log('📡 Fyers socket initialization status:', connected);

        if (connected) {
            // Register price update callback
            fyersDataService.onPriceUpdate((data) => {
                this.updatePrice(data);
            });

            // Subscribe to all symbols
            const symbols = stocks.map(s => s.symbol);
            fyersDataService.subscribe(symbols);

            console.log('✅ Fyers mode initialized');
        } else {
            console.error('❌ fyersDataService.initialize() returned false');
            throw new Error('Failed to initialize Fyers Data Socket. Check if token is valid or logs directory is writable.');
        }
    }

    /**
     * Update price in cache
     */
    updatePrice(priceData) {
        const existing = this.priceCache.get(priceData.symbol) || {};

        const updated = {
            symbol: priceData.symbol,
            ltp: priceData.ltp || priceData.price || existing.ltp,
            open: priceData.open || existing.open,
            high: priceData.high || existing.high,
            low: priceData.low || existing.low,
            close: priceData.close || existing.close,
            volume: priceData.volume || existing.volume,
            timestamp: new Date()
        };

        this.priceCache.set(priceData.symbol, updated);

        // Notify subscribers
        this.notifySubscribers(priceData.symbol);
    }

    /**
     * Get Last Traded Price for a symbol
     */
    getLTP(symbol) {
        if (this.mode === 'SIMULATED') {
            const simPrice = priceGenerator.getCurrentPrice(symbol);
            if (simPrice) {
                return simPrice.price;
            }
        }

        const cached = this.priceCache.get(symbol);
        return cached ? cached.ltp : null;
    }

    /**
     * Get OHLC data for a symbol
     */
    getOHLC(symbol) {
        const cached = this.priceCache.get(symbol);
        if (!cached) return null;

        return {
            open: cached.open,
            high: cached.high,
            low: cached.low,
            close: cached.close
        };
    }

    /**
     * Get full market data for a symbol
     */
    getMarketData(symbol) {
        return this.priceCache.get(symbol) || null;
    }

    /**
     * Subscribe to price updates
     */
    subscribe(symbol, callback) {
        if (!this.subscribers.has(symbol)) {
            this.subscribers.set(symbol, new Set());
        }
        this.subscribers.get(symbol).add(callback);
    }

    /**
     * Unsubscribe from price updates
     */
    unsubscribe(symbol, callback) {
        if (this.subscribers.has(symbol)) {
            this.subscribers.get(symbol).delete(callback);
        }
    }

    /**
     * Notify all subscribers of price update
     */
    notifySubscribers(symbol) {
        if (this.subscribers.has(symbol)) {
            const data = this.priceCache.get(symbol);
            this.subscribers.get(symbol).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error('Error in subscriber callback:', error);
                }
            });
        }
    }

    /**
     * Start market data feed
     */
    async startMarketFeed() {
        if (!this.isInitialized) {
            await this.initialize();
        }

        if (this.mode === 'SIMULATED') {
            // Simulated mode: generate prices periodically
            if (this.simulatedInterval) clearInterval(this.simulatedInterval);
            this.simulatedInterval = setInterval(() => {
                this.priceCache.forEach((_, symbol) => {
                    const priceUpdate = priceGenerator.generateNextPrice(symbol);
                    if (priceUpdate) {
                        this.updatePrice(priceUpdate);
                    }
                });
            }, 2000); // Update every 2 seconds
            console.log('📈 Simulated market feed started');
        } else {
            console.log('📈 Fyers market feed active via WebSocket');
        }
    }

    /**
     * Stop market data feed
     */
    stopMarketFeed() {
        if (this.simulatedInterval) {
            clearInterval(this.simulatedInterval);
            this.simulatedInterval = null;
        }

        if (this.mode === 'FYERS') {
            // Fyers WebSocket cleanup if needed
        }

        console.log('⏹️ Market data feed stopped');
    }

    /**
     * Change mode dynamically
     */
    async setMode(newMode) {
        if (newMode === this.mode) return;

        console.log(`🔄 Switching Market Data Source: ${this.mode} -> ${newMode}`);

        this.stopMarketFeed();
        this.mode = newMode;
        this.isInitialized = false;

        await this.initialize();
        this.startMarketFeed();
    }

    /**
     * Get current mode
     */
    getMode() {
        return this.mode;
    }

    /**
     * Check if service is ready
     */
    isReady() {
        return this.isInitialized;
    }

    /**
     * Ensure a stock is being tracked in the cache
     */
    async ensureStockTracked(symbol) {
        if (this.priceCache.has(symbol)) return true;

        try {
            const stock = await Stock.findOne({ symbol, isActive: true });
            if (!stock) return false;

            // Use basePrice or a reasonable default (100) if not set
            const basePrice = stock.basePrice || 100;

            if (this.mode === 'FYERS' && fyersAuthService.isAuthenticated()) {
                // In Fyers mode, we just need to subscribe if socket is active
                if (fyersDataService.getStatus().isConnected) {
                    fyersDataService.subscribe([symbol]);
                }

                // Set initial empty entry in cache
                this.priceCache.set(symbol, {
                    symbol: symbol,
                    ltp: basePrice,
                    open: basePrice,
                    high: basePrice,
                    low: basePrice,
                    close: basePrice,
                    volume: 0,
                    timestamp: new Date()
                });
            } else {
                // In Simulated mode, initialize in price cache and generator
                this.priceCache.set(symbol, {
                    symbol: symbol,
                    ltp: basePrice,
                    open: basePrice,
                    high: basePrice * 1.02,
                    low: basePrice * 0.98,
                    close: basePrice,
                    volume: Math.floor(Math.random() * 1000000),
                    timestamp: new Date()
                });

                priceGenerator.initializeStock(symbol, basePrice);
            }

            return true;
        } catch (error) {
            console.error(`Error ensuring stock tracked (${symbol}):`, error);
            return false;
        }
    }

    /**
     * Get connection status
     */
    getStatus() {
        return {
            mode: this.mode,
            isInitialized: this.isInitialized,
            isConnected: this.mode === 'FYERS' ? fyersDataService.getStatus().isConnected : true,
            stockCount: this.priceCache.size,
            fyersStatus: this.mode === 'FYERS' ? fyersDataService.getStatus() : null
        };
    }
}

module.exports = new MarketDataService();
