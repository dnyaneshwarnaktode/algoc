const fyersAuthService = require('./fyersAuthService');
const fyersDataService = require('./fyersDataService');

/**
 * Centralized Market Data Service
 * Manages market data feeds (SIMULATED or FYERS)
 */
class MarketDataService {
    constructor() {
        this.mode = 'FYERS'; // Forced to FYERS as requested
        this.priceCache = new Map(); // symbol -> { ltp, ohlc, volume, timestamp }
        this.subscribers = new Map(); // symbol -> Set of callbacks
        this.isInitialized = false;
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
            console.log(`📊 Initializing Market Data Service (Forced Mode: ${this.mode})`);

            // Load all active stocks from DB
            const Stock = require('../models/Stock');
            const stocks = await Stock.find({ isActive: true });
            console.log(`📡 Loaded ${stocks.length} active stocks from Database`);

            if (stocks.length === 0) {
                console.warn('⚠️ No active stocks found in Database. Please use "Sync Stocks" in Admin Settings.');
            }

            // 1. ALWAYS populate cache with WHATEVER we have in DB first
            // This ensures dashboard shows last known prices (e.g. Friday close) even without login
            stocks.forEach(stock => {
                this.priceCache.set(stock.symbol, {
                    symbol: stock.symbol,
                    ltp: stock.basePrice || 0,
                    open: stock.basePrice || 0,
                    high: stock.basePrice || 0,
                    low: stock.basePrice || 0,
                    close: stock.basePrice || 0,
                    volume: 0,
                    timestamp: new Date()
                });
            });

            // Try to load existing token from DB for auto-login
            await fyersAuthService.loadToken();

            if (fyersAuthService.isAuthenticated()) {
                await this.initializeFyers(stocks);
                console.log(`✅ Market Data Service initialized with ${stocks.length} stocks from Fyers`);
            } else {
                console.warn('⚠️ Fyers not authenticated. Using last known prices from Database.');
            }

            this.isInitialized = true;
        } catch (error) {
            console.error('❌ Failed to initialize Market Data Service:', error);
            throw error;
        }
    }



    /**
     * Initialize Fyers mode
     */
    async initializeFyers(stocks) {
        console.log(`🚀 Initializing Fyers mode with ${stocks?.length || 0} stocks...`);

        if (!stocks || stocks.length === 0) {
            console.warn('⚠️ No stocks provided to initializeFyers');
            return;
        }

        const connected = await fyersDataService.initialize();
        if (!connected) {
            console.error('❌ Fyers Data Feed failed to connect');
            return;
        }

        // 2. Fetch fresh quotes to update DB and Cache
        try {
            const Stock = require('../models/Stock');
            const symbols = stocks.map(s => s.tradingSymbol || fyersDataService.formatSymbol(s.symbol));
            const bulkOps = [];

            console.log(`📡 Fetching initial quotes for ${symbols.length} symbols...`);

            for (let i = 0; i < symbols.length; i += 50) {
                const chunk = symbols.slice(i, i + 50);
                const response = await fyersAuthService.getQuotes(chunk);

                if (response.s === 'ok' && response.d) {
                    response.d.forEach(quote => {
                        const symbol = fyersDataService.stripSymbolExtras(quote.n);
                        const v = quote.v;
                        const ltp = v.lp || v.prev_close || v.cp || 0;

                        if (ltp > 0) {
                            this.updatePrice({
                                symbol: symbol,
                                ltp: ltp,
                                open: v.on,
                                high: v.h,
                                low: v.l,
                                close: v.prev_close || v.cp,
                                volume: v.vol
                            });

                            bulkOps.push({
                                updateOne: {
                                    filter: { symbol: symbol },
                                    update: { $set: { basePrice: ltp } }
                                }
                            });
                        }
                    });
                }
                // Add short delay to avoid rate limits
                if (symbols.length > 100) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }

            if (bulkOps.length > 0) {
                await Stock.bulkWrite(bulkOps);
                console.log(`💾 Persisted ${bulkOps.length} market prices to DB`);
            }
        } catch (error) {
            console.error('❌ Error in initializeFyers quotes:', error.message);
        }

        // 3. Register callbacks and subscribe
        fyersDataService.onPriceUpdate((data) => this.updatePrice(data));

        // Limit initial subscription to avoid Fyers "symbol limit passed" error
        // We only subscribe to first 50 active stocks automatically.
        // Others will be subscribed dynamically via ensureStockTracked.
        const initialSubs = stocks.slice(0, 50).map(s => s.symbol);
        console.log(`📡 Auto-subscribing to first ${initialSubs.length} stocks...`);
        fyersDataService.subscribe(initialSubs);
    }

    /**
     * Force refresh all prices from Fyers
     */
    async refreshPrices() {
        const Stock = require('../models/Stock');
        const stocks = await Stock.find({ isActive: true });
        if (stocks.length > 0 && fyersAuthService.isAuthenticated()) {
            await this.initializeFyers(stocks);
            return true;
        }
        return false;
    }

    /**
     * Update price in cache
     */
    updatePrice(priceData) {
        if (!this.priceCache.has(priceData.symbol)) {
            // Uncomment to debug unknown symbols
            console.log(`❓ No match for ${priceData.symbol} in cache.`);
            return;
        }

        const existing = this.priceCache.get(priceData.symbol) || {};

        // 🛡️ Guard against zero prices (common on weekends/closed market)
        // Only update LTP if new value is > 0, OR if we don't have an existing price yet
        let newLtp = priceData.ltp !== undefined ? priceData.ltp : (priceData.price !== undefined ? priceData.price : existing.ltp);

        // If the incoming LTP is 0 or null, check if we can use 'close' or 'existing'
        if (!newLtp || newLtp === 0) {
            newLtp = priceData.close || existing.ltp || 0;
        }

        // Log update
        console.log(`🎯 Price Update: ${priceData.symbol} = ${newLtp}`);

        const updated = {
            symbol: priceData.symbol,
            ltp: newLtp,
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

        if (this.mode === 'FYERS' && fyersAuthService.isAuthenticated()) {
            console.log('📈 Fyers market feed active via WebSocket');
        } else {
            console.warn('⚠️ Market feed cannot start: Fyers not authenticated');
        }
    }

    /**
     * Stop market data feed
     */
    stopMarketFeed() {
        console.log('⏹️ Market data feed stopped');
    }

    /**
     * Change mode dynamically (Disabled as requested)
     */
    async setMode(newMode) {
        console.log(`🚫 Switch ignored: System forced to FYERS mode. Requested: ${newMode}`);
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

            if (fyersAuthService.isAuthenticated()) {
                // In Fyers mode, we just need to subscribe if socket is active
                if (fyersDataService.getStatus().isConnected) {
                    fyersDataService.subscribe([symbol]);
                }

                // Set initial entry in cache
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

                // Try to get a real quote immediately for this new stock
                try {
                    const response = await fyersAuthService.getQuotes([fyersDataService.formatSymbol(symbol)]);
                    if (response.s === 'ok' && response.d?.[0]) {
                        const v = response.d[0].v;
                        this.updatePrice({
                            symbol: symbol,
                            ltp: v.lp,
                            open: v.on,
                            high: v.h,
                            low: v.l,
                            close: v.prev_close || v.cp,
                            volume: v.vol
                        });
                    }
                } catch (e) {
                    console.warn(`Could not get immediate quote for ${symbol}`);
                }
            } else {
                return false;
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
