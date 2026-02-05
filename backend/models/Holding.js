const mongoose = require('mongoose');

/**
 * Holding Schema
 * Tracks current stock holdings in portfolio
 */
const holdingSchema = new mongoose.Schema({
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
    quantity: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    averageBuyPrice: {
        type: Number,
        required: true,
        min: 0
    },
    totalInvested: {
        type: Number,
        required: true,
        min: 0
    },
    currentValue: {
        type: Number,
        default: 0
    },
    profitLoss: {
        type: Number,
        default: 0
    },
    profitLossPercent: {
        type: Number,
        default: 0
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Compound index for user + symbol (unique holding per user per stock)
holdingSchema.index({ user: 1, symbol: 1 }, { unique: true });

module.exports = mongoose.model('Holding', holdingSchema);
