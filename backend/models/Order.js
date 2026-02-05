const mongoose = require('mongoose');

/**
 * Order Schema
 * Tracks all buy/sell orders for paper trading
 */
const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    stock: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Stock',
        required: true
    },
    symbol: {
        type: String,
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: ['BUY', 'SELL'],
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    totalAmount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['PENDING', 'COMPLETED', 'CANCELLED', 'FAILED'],
        default: 'COMPLETED' // For paper trading, orders execute immediately
    },
    orderDate: {
        type: Date,
        default: Date.now,
        index: true
    },
    // For tracking P&L when selling
    buyPrice: {
        type: Number // Average buy price for this stock
    },
    profitLoss: {
        type: Number,
        default: 0
    },
    profitLossPercent: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Index for faster queries
orderSchema.index({ user: 1, orderDate: -1 });
orderSchema.index({ user: 1, symbol: 1 });
orderSchema.index({ user: 1, type: 1 });

module.exports = mongoose.model('Order', orderSchema);
