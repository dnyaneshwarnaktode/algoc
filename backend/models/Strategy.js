const mongoose = require('mongoose');
const crypto = require('crypto');

/**
 * Strategy Schema
 * Manages automated trading strategies
 */
const strategySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    name: {
        type: String,
        required: [true, 'Strategy name is required'],
        trim: true,
        maxlength: [100, 'Strategy name cannot exceed 100 characters']
    },
    symbol: {
        type: String,
        required: [true, 'Symbol is required'],
        uppercase: true,
        index: true
    },
    timeframe: {
        type: String,
        enum: ['1m', '3m', '5m', '15m', '30m', '1h', '4h', '1d'],
        default: '5m'
    },
    mode: {
        type: String,
        enum: ['PAPER', 'LIVE'],
        default: 'PAPER'
    },
    capitalAllocated: {
        type: Number,
        required: [true, 'Capital allocation is required'],
        min: [100, 'Minimum capital is ₹100'],
        max: [10000000, 'Maximum capital is ₹1 Crore']
    },
    isActive: {
        type: Boolean,
        default: false
    },
    webhookSecret: {
        type: String,
        default: () => crypto.randomBytes(32).toString('hex'),
        unique: true,
        index: true
    },
    // Risk Management Settings
    maxTradesPerDay: {
        type: Number,
        default: 10,
        min: 1,
        max: 100
    },
    maxLossPerDay: {
        type: Number,
        default: 5000,
        min: 100
    },
    maxCapitalPerTrade: {
        type: Number,
        default: 10000,
        min: 100
    },
    cooldownBetweenTrades: {
        type: Number,
        default: 60, // seconds
        min: 0
    },
    // Statistics
    totalTrades: {
        type: Number,
        default: 0
    },
    totalProfit: {
        type: Number,
        default: 0
    },
    totalLoss: {
        type: Number,
        default: 0
    },
    winRate: {
        type: Number,
        default: 0
    },
    lastExecutedAt: {
        type: Date
    },
    // Metadata
    description: {
        type: String,
        maxlength: 500
    },
    tags: [{
        type: String,
        trim: true
    }]
}, {
    timestamps: true
});

// Indexes for performance
strategySchema.index({ user: 1, isActive: 1 });
strategySchema.index({ user: 1, symbol: 1 });
strategySchema.index({ webhookSecret: 1 }, { unique: true });

// Instance methods
strategySchema.methods.updateStats = function (profit, isWin) {
    this.totalTrades += 1;

    if (isWin) {
        this.totalProfit += profit;
    } else {
        this.totalLoss += Math.abs(profit);
    }

    this.winRate = (this.totalProfit / (this.totalProfit + this.totalLoss)) * 100 || 0;
    this.lastExecutedAt = new Date();
};

module.exports = mongoose.model('Strategy', strategySchema);
