import { io } from 'socket.io-client';
import store from '../redux/store';
import { updateStockPrice } from '../redux/slices/stockSlice';

/**
 * WebSocket Service
 * Manages real-time price updates via Socket.IO
 */
class WebSocketService {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.subscribedSymbols = new Set();
    }

    /**
     * Connect to WebSocket server
     */
    connect() {
        if (this.socket?.connected) {
            console.log('✅ Already connected to WebSocket');
            return;
        }

        const socketUrl = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

        this.socket = io(socketUrl, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
        });

        this.setupEventHandlers();
    }

    /**
     * Setup Socket.IO event handlers
     */
    setupEventHandlers() {
        // Connection established
        this.socket.on('connect', () => {
            console.log('✅ WebSocket connected:', this.socket.id);
            this.isConnected = true;

            // Resubscribe to stocks if any
            if (this.subscribedSymbols.size > 0) {
                this.subscribe(Array.from(this.subscribedSymbols));
            }
        });

        // Connection error
        this.socket.on('connect_error', (error) => {
            console.error('❌ WebSocket connection error:', error.message);
            this.isConnected = false;
        });

        // Disconnection
        this.socket.on('disconnect', (reason) => {
            console.log('🔌 WebSocket disconnected:', reason);
            this.isConnected = false;
        });

        // Reconnection attempt
        this.socket.on('reconnect_attempt', (attemptNumber) => {
            console.log(`🔄 Reconnection attempt ${attemptNumber}`);
        });

        // Reconnection success
        this.socket.on('reconnect', (attemptNumber) => {
            console.log(`✅ Reconnected after ${attemptNumber} attempts`);
            this.isConnected = true;
        });

        // Price updates (batch)
        this.socket.on('prices', (prices) => {
            if (Array.isArray(prices)) {
                prices.forEach((priceData) => {
                    this.handlePriceUpdate(priceData);
                });
            }
        });

        // Single price update
        this.socket.on('price_update', (priceData) => {
            this.handlePriceUpdate(priceData);
        });

        // Error from server
        this.socket.on('error', (error) => {
            console.error('❌ WebSocket error:', error.message);
        });
    }

    /**
     * Handle price update
     */
    handlePriceUpdate(priceData) {
        const { symbol, price, change, changePercent } = priceData;

        // Update Redux store
        store.dispatch(
            updateStockPrice({
                symbol,
                price,
                change,
                changePercent,
            })
        );
    }

    /**
     * Subscribe to stock price updates
     */
    subscribe(symbols) {
        if (!this.socket?.connected) {
            console.warn('⚠️ WebSocket not connected. Connecting...');
            this.connect();

            // Wait for connection and retry
            setTimeout(() => {
                if (this.socket?.connected) {
                    this.subscribe(symbols);
                }
            }, 1000);
            return;
        }

        const symbolsArray = Array.isArray(symbols) ? symbols : [symbols];

        // Add to subscribed set
        symbolsArray.forEach((symbol) => this.subscribedSymbols.add(symbol));

        // Send subscription request
        this.socket.emit('subscribe', { symbols: symbolsArray });

        console.log(`📊 Subscribed to ${symbolsArray.length} stocks:`, symbolsArray);
    }

    /**
     * Unsubscribe from stock price updates
     */
    unsubscribe(symbols) {
        if (!this.socket?.connected) {
            return;
        }

        const symbolsArray = Array.isArray(symbols) ? symbols : [symbols];

        // Remove from subscribed set
        symbolsArray.forEach((symbol) => this.subscribedSymbols.delete(symbol));

        // Send unsubscription request
        this.socket.emit('unsubscribe', { symbols: symbolsArray });

        console.log(`📊 Unsubscribed from ${symbolsArray.length} stocks`);
    }

    /**
     * Disconnect from WebSocket server
     */
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
            this.subscribedSymbols.clear();
            console.log('🔌 WebSocket disconnected');
        }
    }

    /**
     * Check if connected
     */
    isSocketConnected() {
        return this.isConnected && this.socket?.connected;
    }

    /**
     * Get subscribed symbols
     */
    getSubscribedSymbols() {
        return Array.from(this.subscribedSymbols);
    }
}

// Export singleton instance
export default new WebSocketService();
