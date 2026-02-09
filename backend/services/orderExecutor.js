const Order = require('../models/Order');
const Holding = require('../models/Holding');
const Stock = require('../models/Stock');
const User = require('../models/User');
const marketDataService = require('./marketDataService');
const { calculateCharges, calculatePnL } = require('../utils/calculateCharges');

/**
 * Order Execution Engine
 * Handles paper and live order execution
 */
class OrderExecutor {
    constructor() {
        this.mode = 'PAPER'; // PAPER | LIVE
        this.slippagePercent = 0.1; // 0.1% default slippage
        this.executionDelay = 500; // 500ms simulated delay
    }

    /**
     * Execute a buy order
     */
    async executeBuy(userId, symbol, quantity, strategyId = null) {
        const startTime = Date.now();

        try {
            // Get current market price
            const ltp = marketDataService.getLTP(symbol);
            if (!ltp) {
                throw new Error(`Unable to fetch price for ${symbol}`);
            }

            // Apply slippage for paper trading
            const buyPrice = this.mode === 'PAPER'
                ? ltp * (1 + this.slippagePercent / 100)
                : ltp;

            // Find stock to get exchange
            const stock = await Stock.findOne({ symbol, isActive: true });
            if (!stock) {
                throw new Error(`Stock ${symbol} not found`);
            }

            // BUY Order Logic
            const buyValue = buyPrice * quantity;
            const buyCharges = calculateCharges('BUY', buyPrice, quantity, stock.exchange || 'NSE', 'DELIVERY');
            const totalBuyCost = buyValue + buyCharges.totalCharges;

            // Simulate execution delay
            if (this.mode === 'PAPER') {
                await this.delay(this.executionDelay);
            }

            // Validate user balance
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            if (user.virtualBalance < totalBuyCost) {
                throw new Error(`Insufficient balance. Required: ₹${totalBuyCost.toFixed(2)}, Available: ₹${user.virtualBalance.toFixed(2)}`);
            }

            // Deduct balance (including charges)
            user.virtualBalance -= totalBuyCost;
            await user.save();

            // Create order with charges - Store all values
            const order = await Order.create({
                user: userId,
                stock: stock._id,
                symbol: symbol,
                type: 'BUY',
                quantity: quantity,
                price: buyPrice, // buy_price
                totalAmount: buyValue, // buy_value
                charges: buyCharges, // buy_charges
                segment: 'DELIVERY',
                status: 'COMPLETED'
            });

            // Update or create holding
            // Note: totalInvested includes charges for accurate P&L calculation
            let holding = await Holding.findOne({ user: userId, symbol: symbol });

            if (holding) {
                const newTotalInvested = holding.totalInvested + totalBuyCost; // Include charges
                const newQuantity = holding.quantity + quantity;
                // Average buy price based on gross amounts (price * quantity), not including charges
                const previousGrossValue = holding.averageBuyPrice * holding.quantity;
                const newGrossValue = previousGrossValue + buyValue;
                const newAverageBuyPrice = newGrossValue / newQuantity;

                holding.quantity = newQuantity;
                holding.averageBuyPrice = newAverageBuyPrice;
                holding.totalInvested = newTotalInvested;
                await holding.save();
            } else {
                holding = await Holding.create({
                    user: userId,
                    stock: stock._id,
                    symbol: symbol,
                    quantity: quantity,
                    averageBuyPrice: buyPrice, // Gross price per share
                    totalInvested: totalBuyCost // Total paid including charges
                });
            }

            const executionTime = Date.now() - startTime;
            const slippage = ((buyPrice - ltp) / ltp) * 100;

            return {
                success: true,
                order: order,
                holding: holding,
                executionPrice: buyPrice,
                slippage: slippage,
                executionTime: executionTime,
                remainingBalance: user.virtualBalance,
                buyValue: buyValue,
                buyCharges: buyCharges,
                totalBuyCost: totalBuyCost
            };

        } catch (error) {
            console.error('Buy execution error:', error);
            throw error;
        }
    }

    /**
     * Execute a sell order
     */
    async executeSell(userId, symbol, quantity, strategyId = null) {
        const startTime = Date.now();

        try {
            // Get current market price
            const ltp = marketDataService.getLTP(symbol);
            if (!ltp) {
                throw new Error(`Unable to fetch price for ${symbol}`);
            }

            // Apply slippage for paper trading (negative for sells)
            const sellPrice = this.mode === 'PAPER'
                ? ltp * (1 - this.slippagePercent / 100)
                : ltp;

            // Simulate execution delay
            if (this.mode === 'PAPER') {
                await this.delay(this.executionDelay);
            }

            // Check holding
            const holding = await Holding.findOne({ user: userId, symbol: symbol });
            if (!holding) {
                throw new Error(`No holdings found for ${symbol}`);
            }

            if (holding.quantity < quantity) {
                throw new Error(`Insufficient shares. You own ${holding.quantity}, trying to sell ${quantity}`);
            }

            // Find stock to get exchange
            const stock = await Stock.findOne({ symbol, isActive: true });
            if (!stock) {
                throw new Error(`Stock ${symbol} not found`);
            }

            // SELL Order Logic
            const sellValue = sellPrice * quantity;
            const sellCharges = calculateCharges('SELL', sellPrice, quantity, stock.exchange || 'NSE', 'DELIVERY');
            const netSellValue = sellValue - sellCharges.totalCharges;

            // Get buy charges (estimate based on average buy price)
            const buyCharges = calculateCharges('BUY', holding.averageBuyPrice, quantity, stock.exchange || 'NSE', 'DELIVERY');

            // Calculate P&L including charges
            const pnlCalculation = calculatePnL(
                holding.averageBuyPrice,
                sellPrice,
                quantity,
                buyCharges,
                sellCharges,
                stock.exchange || 'NSE',
                'DELIVERY'
            );

            // Update user balance (net amount after charges)
            const user = await User.findById(userId);
            user.virtualBalance += netSellValue;
            await user.save();

            // Create order with charges - Store all values
            const order = await Order.create({
                user: userId,
                stock: stock._id,
                symbol: symbol,
                type: 'SELL',
                quantity: quantity,
                price: sellPrice, // sell_price
                totalAmount: sellValue, // sell_value
                charges: sellCharges, // sell_charges
                segment: 'DELIVERY',
                status: 'COMPLETED',
                buyPrice: holding.averageBuyPrice,
                profitLoss: pnlCalculation.netPnL,
                profitLossPercent: pnlCalculation.netPnLPercent
            });

            // Update holding
            // Calculate proportional totalInvested to deduct (including charges)
            const proportionalInvested = (holding.totalInvested / holding.quantity) * quantity;
            holding.quantity -= quantity;
            holding.totalInvested -= proportionalInvested;

            if (holding.quantity === 0) {
                await Holding.deleteOne({ _id: holding._id });
            } else {
                await holding.save();
            }

            const executionTime = Date.now() - startTime;
            const slippage = ((ltp - sellPrice) / ltp) * 100;

            return {
                success: true,
                order: order,
                executionPrice: sellPrice,
                slippage: slippage,
                executionTime: executionTime,
                profitLoss: pnlCalculation.netPnL,
                profitLossPercent: pnlCalculation.netPnLPercent,
                remainingBalance: user.virtualBalance,
                remainingShares: holding.quantity || 0,
                sellValue: sellValue,
                sellCharges: sellCharges,
                netSellValue: netSellValue,
                pnlBreakdown: pnlCalculation
            };

        } catch (error) {
            console.error('Sell execution error:', error);
            throw error;
        }
    }

    /**
     * Execute order based on action type
     */
    async execute(userId, action, symbol, quantity, strategyId = null) {
        if (action === 'BUY') {
            return await this.executeBuy(userId, symbol, quantity, strategyId);
        } else if (action === 'SELL') {
            return await this.executeSell(userId, symbol, quantity, strategyId);
        } else {
            throw new Error(`Invalid action: ${action}`);
        }
    }

    /**
     * Set execution mode
     */
    setMode(mode) {
        if (mode !== 'PAPER' && mode !== 'LIVE') {
            throw new Error('Invalid mode. Use PAPER or LIVE');
        }
        this.mode = mode;
        console.log(`📊 Order Executor mode set to: ${mode}`);
    }

    /**
     * Set slippage percentage
     */
    setSlippage(percent) {
        if (percent < 0 || percent > 1) {
            throw new Error('Slippage must be between 0 and 1 percent');
        }
        this.slippagePercent = percent;
    }

    /**
     * Set execution delay
     */
    setExecutionDelay(ms) {
        if (ms < 0 || ms > 5000) {
            throw new Error('Execution delay must be between 0 and 5000ms');
        }
        this.executionDelay = ms;
    }

    /**
     * Get current configuration
     */
    getConfig() {
        return {
            mode: this.mode,
            slippagePercent: this.slippagePercent,
            executionDelay: this.executionDelay
        };
    }

    /**
     * Utility: Delay execution
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = new OrderExecutor();
