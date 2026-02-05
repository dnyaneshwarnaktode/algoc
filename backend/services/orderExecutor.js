const Order = require('../models/Order');
const Holding = require('../models/Holding');
const Stock = require('../models/Stock');
const User = require('../models/User');
const marketDataService = require('./marketDataService');

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
            const executionPrice = this.mode === 'PAPER'
                ? ltp * (1 + this.slippagePercent / 100)
                : ltp;

            const totalAmount = quantity * executionPrice;

            // Simulate execution delay
            if (this.mode === 'PAPER') {
                await this.delay(this.executionDelay);
            }

            // Validate user balance
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            if (user.virtualBalance < totalAmount) {
                throw new Error(`Insufficient balance. Required: ₹${totalAmount.toFixed(2)}, Available: ₹${user.virtualBalance.toFixed(2)}`);
            }

            // Find stock
            const stock = await Stock.findOne({ symbol, isActive: true });
            if (!stock) {
                throw new Error(`Stock ${symbol} not found`);
            }

            // Deduct balance
            user.virtualBalance -= totalAmount;
            await user.save();

            // Create order
            const order = await Order.create({
                user: userId,
                stock: stock._id,
                symbol: symbol,
                type: 'BUY',
                quantity: quantity,
                price: executionPrice,
                totalAmount: totalAmount,
                status: 'COMPLETED'
            });

            // Update or create holding
            let holding = await Holding.findOne({ user: userId, symbol: symbol });

            if (holding) {
                const newTotalInvested = holding.totalInvested + totalAmount;
                const newQuantity = holding.quantity + quantity;
                const newAverageBuyPrice = newTotalInvested / newQuantity;

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
                    averageBuyPrice: executionPrice,
                    totalInvested: totalAmount
                });
            }

            const executionTime = Date.now() - startTime;
            const slippage = ((executionPrice - ltp) / ltp) * 100;

            return {
                success: true,
                order: order,
                holding: holding,
                executionPrice: executionPrice,
                slippage: slippage,
                executionTime: executionTime,
                remainingBalance: user.virtualBalance
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
            const executionPrice = this.mode === 'PAPER'
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

            // Find stock
            const stock = await Stock.findOne({ symbol, isActive: true });
            if (!stock) {
                throw new Error(`Stock ${symbol} not found`);
            }

            // Calculate P&L
            const totalAmount = quantity * executionPrice;
            const buyValue = quantity * holding.averageBuyPrice;
            const profitLoss = totalAmount - buyValue;
            const profitLossPercent = (profitLoss / buyValue) * 100;

            // Update user balance
            const user = await User.findById(userId);
            user.virtualBalance += totalAmount;
            await user.save();

            // Create order
            const order = await Order.create({
                user: userId,
                stock: stock._id,
                symbol: symbol,
                type: 'SELL',
                quantity: quantity,
                price: executionPrice,
                totalAmount: totalAmount,
                status: 'COMPLETED',
                buyPrice: holding.averageBuyPrice,
                profitLoss: profitLoss,
                profitLossPercent: profitLossPercent
            });

            // Update holding
            holding.quantity -= quantity;
            holding.totalInvested -= buyValue;

            if (holding.quantity === 0) {
                await Holding.deleteOne({ _id: holding._id });
            } else {
                await holding.save();
            }

            const executionTime = Date.now() - startTime;
            const slippage = ((ltp - executionPrice) / ltp) * 100;

            return {
                success: true,
                order: order,
                executionPrice: executionPrice,
                slippage: slippage,
                executionTime: executionTime,
                profitLoss: profitLoss,
                profitLossPercent: profitLossPercent,
                remainingBalance: user.virtualBalance,
                remainingShares: holding.quantity
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
