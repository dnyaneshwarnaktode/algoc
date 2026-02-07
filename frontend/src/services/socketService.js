import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

class SocketService {
    constructor() {
        this.socket = null;
        this.subscribers = new Map();
    }

    connect() {
        if (this.socket) return;

        this.socket = io(SOCKET_URL, {
            withCredentials: true,
            transports: ['websocket']
        });

        this.socket.on('connect', () => {
            console.log('🟢 Connected to WebSocket Server');
        });

        this.socket.on('disconnect', () => {
            console.log('disconnected from WebSocket Server');
        });

        this.socket.on('price_update', (data) => {
            if (this.subscribers.has(data.symbol)) {
                this.subscribers.get(data.symbol).forEach(callback => callback(data));
            }
        });

        this.socket.on('prices', (data) => {
            if (Array.isArray(data)) {
                data.forEach(price => {
                    if (this.subscribers.has(price.symbol)) {
                        this.subscribers.get(price.symbol).forEach(callback => callback(price));
                    }
                });
            }
        });
    }

    subscribe(symbols, callback) {
        if (!this.socket) this.connect();

        const symbolsArray = Array.isArray(symbols) ? symbols : [symbols];

        symbolsArray.forEach(symbol => {
            if (!this.subscribers.has(symbol)) {
                this.subscribers.set(symbol, new Set());
            }
            this.subscribers.get(symbol).add(callback);
        });

        this.socket.emit('subscribe', { symbols: symbolsArray });
    }

    unsubscribe(symbols, callback) {
        if (!this.socket) return;

        const symbolsArray = Array.isArray(symbols) ? symbols : [symbols];

        symbolsArray.forEach(symbol => {
            if (this.subscribers.has(symbol)) {
                this.subscribers.get(symbol).delete(callback);
                if (this.subscribers.get(symbol).size === 0) {
                    this.subscribers.delete(symbol);
                }
            }
        });

        this.socket.emit('unsubscribe', { symbols: symbolsArray });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }
}

export default new SocketService();
