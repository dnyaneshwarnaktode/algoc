const fyers = require('fyers-api-v3');
const path = require('path');
const fs = require('fs');
const fyersAuthService = require('./fyersAuthService');

class FyersDataService {
    constructor() {
        this.dataSocket = null;
        this.isConnected = false;
        this.callbacks = new Set();
        this.subscribedSymbols = new Set();
    }

    /**
     * Initialize Fyers Data Socket
     */
    async initialize() {
        const accessToken = fyersAuthService.getAccessToken();
        if (!accessToken) {
            console.error('❌ Cannot initialize Fyers Data Socket: No Access Token');
            return false;
        }

        try {
            // The Fyers V3 SDK expects arguments directly: (accessToken, logPath, enableLogging)
            const token = `${process.env.FYERS_APP_ID}:${accessToken}`;
            const logPath = path.join(__dirname, '../logs');

            if (!fs.existsSync(logPath)) {
                fs.mkdirSync(logPath, { recursive: true });
            }

            this.dataSocket = new fyers.fyersDataSocket(token, logPath, true);

            this.dataSocket.on("connect", () => {
                this.isConnected = true;
                console.log('✅ Fyers Data Socket Connected');

                // Re-subscribe to symbols if any
                if (this.subscribedSymbols.size > 0) {
                    this.subscribe([...this.subscribedSymbols]);
                }
            });

            this.dataSocket.on("message", (message) => {
                this.handleMessage(message);
            });

            this.dataSocket.on("error", (error) => {
                console.error('❌ Fyers Data Socket Error:', error);
            });

            this.dataSocket.on("close", () => {
                this.isConnected = false;
                console.log('🔌 Fyers Data Socket Closed');
            });

            this.dataSocket.connect();
            return true;
        } catch (error) {
            console.error('❌ Error initializing Fyers Data Socket core logic:', error);
            return false;
        }
    }

    /**
     * Subscribe to symbols
     * @param {string[]} symbols 
     */
    subscribe(symbols) {
        if (!this.dataSocket || !this.isConnected) {
            symbols.forEach(s => this.subscribedSymbols.add(s));
            return;
        }

        const validFyersSymbols = symbols.map(s => this.formatSymbol(s));

        // Fyers expects symbols in array for subscribe
        this.dataSocket.subscribe(validFyersSymbols);
        validFyersSymbols.forEach(s => this.subscribedSymbols.add(s));
        console.log(`📡 Subscribed to Fyers symbols: ${validFyersSymbols.join(', ')}`);
    }

    /**
     * Unsubscribe from symbols
     * @param {string[]} symbols 
     */
    unsubscribe(symbols) {
        if (!this.dataSocket || !this.isConnected) return;

        const validFyersSymbols = symbols.map(s => this.formatSymbol(s));
        this.dataSocket.unsubscribe(validFyersSymbols);
        validFyersSymbols.forEach(s => this.subscribedSymbols.delete(s));
    }

    /**
     * Map AlgoC symbols to Fyers symbols (e.g., RELIANCE -> NSE:RELIANCE-EQ)
     */
    formatSymbol(symbol) {
        if (symbol.includes(':')) return symbol; // Already formatted
        return `NSE:${symbol}-EQ`;
    }

    /**
     * Handle incoming WebSocket messages
     */
    handleMessage(message) {
        // Fyers V3 Data Socket returns data in a structured format
        // We need to normalize it for our MarketDataService
        if (message.type === 'dp' || message.type === 'sf') { // Data packet or Stock feed
            const normalizedData = {
                symbol: this.stripSymbolExtras(message.symbol || message.n),
                ltp: message.ltp || message.lp,
                open: message.open || message.on,
                high: message.high || message.h,
                low: message.low || message.l,
                close: message.prev_close || message.cp,
                volume: message.vol || message.v,
                timestamp: new Date()
            };

            this.callbacks.forEach(callback => callback(normalizedData));
        }
    }

    stripSymbolExtras(fyersSymbol) {
        if (!fyersSymbol) return '';
        // NSE:RELIANCE-EQ -> RELIANCE
        return fyersSymbol.split(':')[1]?.split('-')[0] || fyersSymbol;
    }

    onPriceUpdate(callback) {
        this.callbacks.add(callback);
    }

    getStatus() {
        return {
            isConnected: this.isConnected,
            subscribedCount: this.subscribedSymbols.size
        };
    }
}

module.exports = new FyersDataService();
