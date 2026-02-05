const mongoose = require('mongoose');

/**
 * Strategy Log Schema
 * Tracks all strategy execution events
 */
const strategyLogSchema = new mongoose.Schema({
    strategy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Strategy',
        required: true,
        index: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    eventType: {
        type: String,
        enum: ['SIGNAL_RECEIVED', 'ORDER_EXECUTED', 'ORDER_REJECTED', 'RISK_LIMIT_HIT', 'ERROR'],
        required: true
    },
    action: {
        type: String,
        enum: ['BUY', 'SELL', 'NONE'],
        default: 'NONE'
    },
    symbol: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        min: 0
    },
    price: {
        type: Number,
        min: 0
    },
    // Signal Data
    signalData: {
        strategy: String,
        timestamp: Date,
        rawPayload: mongoose.Schema.Types.Mixed
    },
    // Execution Result
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
    },
    executionPrice: {
        type: Number
    },
    slippage: {
        type: Number,
        default: 0
    },
    // Status
    status: {
        type: String,
        enum: ['SUCCESS', 'FAILED', 'REJECTED'],
        required: true
    },
    reason: {
        type: String,
        maxlength: 500
    },
    errorMessage: {
        type: String,
        maxlength: 1000
    },
    // Performance Metrics
    profitLoss: {
        type: Number,
        default: 0
    },
    // Metadata
    executionTime: {
        type: Number, // milliseconds
        default: 0
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed
    }
}, {
    timestamps: true
});

// Indexes for efficient querying
strategyLogSchema.index({ strategy: 1, createdAt: -1 });
strategyLogSchema.index({ user: 1, createdAt: -1 });
strategyLogSchema.index({ strategy: 1, eventType: 1 });
strategyLogSchema.index({ createdAt: -1 });

// Static method to create log entry
strategyLogSchema.statics.logSignalReceived = async function (strategyId, userId, signalData) {
    return this.create({
        strategy: strategyId,
        user: userId,
        eventType: 'SIGNAL_RECEIVED',
        action: signalData.action,
        symbol: signalData.symbol,
        quantity: signalData.quantity,
        price: signalData.price,
        signalData: {
            strategy: signalData.strategy,
            timestamp: signalData.timestamp,
            rawPayload: signalData
        },
        status: 'SUCCESS'
    });
};

strategyLogSchema.statics.logOrderExecuted = async function (strategyId, userId, orderData) {
    return this.create({
        strategy: strategyId,
        user: userId,
        eventType: 'ORDER_EXECUTED',
        action: orderData.type,
        symbol: orderData.symbol,
        quantity: orderData.quantity,
        price: orderData.price,
        order: orderData.orderId,
        executionPrice: orderData.executionPrice,
        slippage: orderData.slippage,
        status: 'SUCCESS',
        executionTime: orderData.executionTime,
        profitLoss: orderData.profitLoss || 0
    });
};

strategyLogSchema.statics.logOrderRejected = async function (strategyId, userId, symbol, reason) {
    return this.create({
        strategy: strategyId,
        user: userId,
        eventType: 'ORDER_REJECTED',
        symbol: symbol,
        status: 'REJECTED',
        reason: reason
    });
};

strategyLogSchema.statics.logError = async function (strategyId, userId, symbol, errorMessage) {
    return this.create({
        strategy: strategyId,
        user: userId,
        eventType: 'ERROR',
        symbol: symbol,
        status: 'FAILED',
        errorMessage: errorMessage
    });
};

module.exports = mongoose.model('StrategyLog', strategyLogSchema);
