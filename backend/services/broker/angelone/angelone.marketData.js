const { getAngelOneClient } = require('./angelone.client');
const symbolMapper = require('./angelone.mapper');

/**
 * Angel One Market Data Service
 * 
 * Handles live market data streaming from Angel One SmartAPI
 * Normalizes price data and provides fallback mechanisms
 */
class AngelOneMarketData {
    constructor() {
        this.client = getAngelOneClient();
        this.wsClient = null;
        this.isStreaming = false;
        this.subscribedSymbols = new Set();
        this.priceCache = new Map();
        this.callbacks = new Set();

        // Configuration
        this.config = {
            enabled: process.env.ANGEL_ENABLED === 'true',
            dataSource: process.env.MARKET_DATA_SOURCE || 'SIMULATED',
        };
    }

    /**
     * Check if Angel One market data is enabled
     */
    isEnabled() {
        return this.config.enabled && this.config.dataSource === 'ANGELONE';
    }

    /**
     * Initialize WebSocket connection
     */
    async initialize() {
        if (!this.isEnabled()) {
            console.log('[AngelOne MarketData] Market data source: SIMULATED');
            return { success: false, message: 'Angel One market data is disabled' };
        }

        try {
            console.log('[AngelOne MarketData] Initializing market data service...');

            // Ensure client is logged in
            if (!this.client.isSessionValid()) {
                console.log('[AngelOne MarketData] Logging in to Angel One...');
                await this.client.login();
            }

            // Load symbol mappings from database
            await symbolMapper.loadFromDatabase();

            console.log('[AngelOne MarketData] Market data service initialized');
            return { success: true, message: 'Market data service ready' };
        } catch (error) {
            console.error('[AngelOne MarketData] Initialization failed:', error.message);
            return { success: false, message: error.message };
        }
    }

    /**
     * Start streaming market data
     */
    async startStreaming(symbols = []) {
        if (!this.isEnabled()) {
            return { success: false, message: 'Angel One market data is disabled' };
        }

        try {
            console.log(`[AngelOne MarketData] Starting stream for ${symbols.length} symbols...`);

            // Initialize if not already done
            if (!this.client.isSessionValid()) {
                await this.initialize();
            }

            // Get WebSocket client
            const SmartAPI = this.client.getClient();
            const feedToken = this.client.getFeedToken();

            if (!feedToken) {
                throw new Error('No feed token available');
            }

            // Import WebSocket library
            const { WebSocket } = require('smartapi-javascript');

            // Create WebSocket connection
            this.wsClient = new WebSocket({
                jwttoken: feedToken,
                apikey: process.env.ANGEL_API_KEY,
                clientcode: process.env.ANGEL_CLIENT_CODE,
                feedtype: 'order_feed', // or 'market_feed'
            });

            // Setup event handlers
            this.setupWebSocketHandlers();

            // Subscribe to symbols
            if (symbols.length > 0) {
                await this.subscribe(symbols);
            }

            this.isStreaming = true;
            console.log('[AngelOne MarketData] Streaming started');

            return { success: true, message: 'Streaming started' };
        } catch (error) {
            console.error('[AngelOne MarketData] Failed to start streaming:', error.message);
            this.isStreaming = false;
            return { success: false, message: error.message };
        }
    }

    /**
     * Setup WebSocket event handlers
     */
    setupWebSocketHandlers() {
        if (!this.wsClient) return;

        // Connection opened
        this.wsClient.on('connect', () => {
            console.log('[AngelOne MarketData] WebSocket connected');
        });

        // Tick data received
        this.wsClient.on('tick', (data) => {
            this.handleTickData(data);
        });

        // Error occurred
        this.wsClient.on('error', (error) => {
            console.error('[AngelOne MarketData] WebSocket error:', error);
        });

        // Connection closed
        this.wsClient.on('close', () => {
            console.log('[AngelOne MarketData] WebSocket disconnected');
            this.isStreaming = false;

            // Auto-reconnect after 5 seconds
            setTimeout(() => {
                if (this.isEnabled()) {
                    console.log('[AngelOne MarketData] Attempting to reconnect...');
                    this.startStreaming(Array.from(this.subscribedSymbols));
                }
            }, 5000);
        });
    }

    /**
     * Handle incoming tick data
     */
    handleTickData(data) {
        try {
            // Angel One tick data format
            // { token: '2885', ltp: 2450.50, ... }

            if (!data || !data.token) return;

            // Get symbol from token
            const symbol = symbolMapper.getSymbolFromToken(data.token);
            if (!symbol) {
                return; // Unknown token
            }

            // Normalize price data
            const normalizedData = this.normalizePriceData(symbol, data);

            // Update cache
            this.priceCache.set(symbol, normalizedData);

            // Emit to all callbacks
            this.emitPriceUpdate(normalizedData);

        } catch (error) {
            console.error('[AngelOne MarketData] Error handling tick data:', error.message);
        }
    }

    /**
     * Normalize Angel One price data to AlgoC format
     */
    normalizePriceData(symbol, angelData) {
        const ltp = angelData.ltp || angelData.last_traded_price || 0;
        const open = angelData.open || ltp;
        const high = angelData.high || ltp;
        const low = angelData.low || ltp;
        const close = angelData.close || angelData.prev_close || ltp;

        const change = ltp - close;
        const changePercent = close !== 0 ? (change / close) * 100 : 0;

        return {
            symbol: symbol,
            currentPrice: parseFloat(ltp.toFixed(2)),
            open: parseFloat(open.toFixed(2)),
            high: parseFloat(high.toFixed(2)),
            low: parseFloat(low.toFixed(2)),
            close: parseFloat(close.toFixed(2)),
            change: parseFloat(change.toFixed(2)),
            changePercent: parseFloat(changePercent.toFixed(2)),
            volume: angelData.volume || 0,
            timestamp: new Date(),
            source: 'ANGELONE',
        };
    }

    /**
     * Subscribe to symbols
     */
    async subscribe(symbols) {
        if (!this.wsClient || !this.isStreaming) {
            return { success: false, message: 'WebSocket not connected' };
        }

        try {
            // Get subscription list
            const subscriptionList = symbolMapper.getSubscriptionList(symbols);

            if (subscriptionList.length === 0) {
                console.warn('[AngelOne MarketData] No mapped symbols to subscribe');
                return { success: false, message: 'No mapped symbols' };
            }

            // Subscribe via WebSocket
            this.wsClient.subscribe(subscriptionList);

            // Add to subscribed set
            symbols.forEach(symbol => this.subscribedSymbols.add(symbol));

            console.log(`[AngelOne MarketData] Subscribed to ${symbols.length} symbols`);
            return { success: true, count: symbols.length };

        } catch (error) {
            console.error('[AngelOne MarketData] Subscription failed:', error.message);
            return { success: false, message: error.message };
        }
    }

    /**
     * Unsubscribe from symbols
     */
    async unsubscribe(symbols) {
        if (!this.wsClient || !this.isStreaming) {
            return { success: false, message: 'WebSocket not connected' };
        }

        try {
            const subscriptionList = symbolMapper.getSubscriptionList(symbols);

            if (subscriptionList.length > 0) {
                this.wsClient.unsubscribe(subscriptionList);
            }

            // Remove from subscribed set
            symbols.forEach(symbol => this.subscribedSymbols.delete(symbol));

            console.log(`[AngelOne MarketData] Unsubscribed from ${symbols.length} symbols`);
            return { success: true, count: symbols.length };

        } catch (error) {
            console.error('[AngelOne MarketData] Unsubscription failed:', error.message);
            return { success: false, message: error.message };
        }
    }

    /**
     * Register callback for price updates
     */
    onPriceUpdate(callback) {
        if (typeof callback === 'function') {
            this.callbacks.add(callback);
            return () => this.callbacks.delete(callback);
        }
    }

    /**
     * Emit price update to all callbacks
     */
    emitPriceUpdate(priceData) {
        this.callbacks.forEach(callback => {
            try {
                callback(priceData);
            } catch (error) {
                console.error('[AngelOne MarketData] Callback error:', error.message);
            }
        });
    }

    /**
     * Get cached price for a symbol
     */
    getPrice(symbol) {
        return this.priceCache.get(symbol.toUpperCase()) || null;
    }

    /**
     * Get all cached prices
     */
    getAllPrices() {
        return Array.from(this.priceCache.values());
    }

    /**
     * Stop streaming
     */
    async stopStreaming() {
        if (this.wsClient) {
            try {
                this.wsClient.close();
                this.wsClient = null;
                this.isStreaming = false;
                this.subscribedSymbols.clear();

                console.log('[AngelOne MarketData] Streaming stopped');
                return { success: true, message: 'Streaming stopped' };
            } catch (error) {
                console.error('[AngelOne MarketData] Error stopping stream:', error.message);
                return { success: false, message: error.message };
            }
        }

        return { success: true, message: 'Already stopped' };
    }

    /**
     * Get status
     */
    getStatus() {
        return {
            enabled: this.isEnabled(),
            dataSource: this.config.dataSource,
            streaming: this.isStreaming,
            subscribedCount: this.subscribedSymbols.size,
            cachedPrices: this.priceCache.size,
            callbackCount: this.callbacks.size,
        };
    }
}

// Singleton instance
let instance = null;

/**
 * Get market data instance
 */
function getAngelOneMarketData() {
    if (!instance) {
        instance = new AngelOneMarketData();
    }
    return instance;
}

module.exports = {
    AngelOneMarketData,
    getAngelOneMarketData,
};
