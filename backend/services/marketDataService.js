const Stock = require('../models/Stock');
const priceGenerator = require('./priceGenerator');
const marketDataController = require('../controllers/marketDataController');

/**
 * Centralized Market Data Service
 * Manages live and simulated market data feeds
 */
class MarketDataService {
    constructor() {
        this.mode = process.env.MARKET_DATA_SOURCE || 'SIMULATED';
        this.priceCache = new Map(); // symbol -> { ltp, ohlc, volume, timestamp }
        this.subscribers = new Set();
        this.isInitialized = false;
        this.angelOneConnected = false;
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

            // Initialize price cache with base prices
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

            // Initialize Angel One if enabled
            if (this.mode === 'ANGELONE') {
                await this.initializeAngelOne(stocks.map(s => s.symbol));
            }

            this.isInitialized = true;
            console.log(`✅ Market Data Service initialized with ${stocks.length} stocks`);
        } catch (error) {
            console.error('❌ Failed to initialize Market Data Service:', error);
            throw error;
        }
    }

    /**
     * Initialize Angel One WebSocket connection
     */
    async initializeAngelOne(symbols) {
        try {
            await marketDataController.initializeMarketData();

            // Register price update callback
            marketDataController.onPriceUpdate((priceData) => {
                this.updatePrice(priceData);
            });

            await marketDataController.startMarketData(symbols);
            await marketDataController.subscribeToSymbols(symbols);

            this.angelOneConnected = true;
            console.log('✅ Angel One WebSocket connected');
        } catch (error) {
            console.error('⚠️ Angel One initialization failed, falling back to SIMULATED mode:', error);
            this.mode = 'SIMULATED';
            this.angelOneConnected = false;
        }
    }

    /**
     * Update price in cache
     */
    updatePrice(priceData) {
        const existing = this.priceCache.get(priceData.symbol) || {};

        this.priceCache.set(priceData.symbol, {
            symbol: priceData.symbol,
            ltp: priceData.ltp || priceData.price || existing.ltp,
            open: priceData.open || existing.open,
            high: priceData.high || existing.high,
            low: priceData.low || existing.low,
            close: priceData.close || existing.close,
            volume: priceData.volume || existing.volume,
            timestamp: new Date()
        });

        // Notify subscribers
        this.notifySubscribers(priceData.symbol);
    }

    /**
     * Get Last Traded Price for a symbol
     */
    getLTP(symbol) {
        if (this.mode === 'SIMULATED' || !this.angelOneConnected) {
            // Use simulated price
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

        // Simulated mode: generate prices periodically
        if (this.mode === 'SIMULATED' || !this.angelOneConnected) {
            this.simulatedInterval = setInterval(() => {
                this.priceCache.forEach((_, symbol) => {
                    const priceUpdate = priceGenerator.generateNextPrice(symbol);
                    if (priceUpdate) {
                        this.updatePrice(priceUpdate);
                    }
                });
            }, 2000); // Update every 2 seconds

            console.log('📈 Simulated market feed started');
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

        if (this.angelOneConnected) {
            marketDataController.stopMarketData();
        }

        console.log('⏹️ Market data feed stopped');
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
}

module.exports = new MarketDataService();
