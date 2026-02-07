const mongoose = require('mongoose');

/**
 * Stock Schema
 * Stores stock master data for Indian stocks
 */
const stockSchema = new mongoose.Schema(
    {
        symbol: {
            type: String,
            required: [true, 'Stock symbol is required'],
            unique: true,
            uppercase: true,
            trim: true,
        },
        name: {
            type: String,
            required: [true, 'Stock name is required'],
            trim: true,
        },
        exchange: {
            type: String,
            enum: ['NSE', 'BSE'],
            default: 'NSE',
        },
        sector: {
            type: String,
            trim: true,
        },
        industry: {
            type: String,
            trim: true,
        },
        tradingSymbol: {
            type: String,
            trim: true,
        },
        // Base price for initial display (will be updated by real-time data)
        basePrice: {
            type: Number,
            default: 0,
            min: 0,
        },
        // Market cap in crores
        marketCap: {
            type: Number,
            min: 0,
        },
        // 52 week high
        high52Week: {
            type: Number,
            min: 0,
        },
        // 52 week low
        low52Week: {
            type: Number,
            min: 0,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

// Index for faster searches
stockSchema.index({ symbol: 1 });
stockSchema.index({ name: 'text', symbol: 'text' });
stockSchema.index({ sector: 1 });

module.exports = mongoose.model('Stock', stockSchema);
