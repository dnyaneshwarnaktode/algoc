const Strategy = require('../models/Strategy');
const StrategyLog = require('../models/StrategyLog');
const Stock = require('../models/Stock');
const riskManager = require('./riskManager');
const orderExecutor = require('./orderExecutor');

/**
 * Strategy Engine
 * Core brain for processing TradingView signals and executing trades
 */
class StrategyEngine {
    constructor() {
        this.processingQueue = [];
        this.isProcessing = false;
        this.signalCache = new Map(); // Prevent duplicate signals
        this.cacheExpiry = 60000; // 1 minute
    }

    /**
     * Process incoming TradingView signal
     */
    async processSignal(signalPayload) {
        const startTime = Date.now();

        try {
            // Step 1: Validate signal structure
            const validation = this.validateSignal(signalPayload);
            if (!validation.valid) {
                throw new Error(`Invalid signal: ${validation.error}`);
            }

            // Step 2: Find strategy by webhook secret
            const strategy = await Strategy.findOne({
                webhookSecret: signalPayload.secret,
                isActive: true
            }).populate('user');

            if (!strategy) {
                throw new Error('Strategy not found or inactive');
            }

            // Step 3: Check for duplicate signal (idempotency)
            const signalKey = `${strategy._id}_${signalPayload.timestamp}`;
            if (this.signalCache.has(signalKey)) {
                console.log(`⚠️ Duplicate signal detected: ${signalKey}`);
                return {
                    success: false,
                    reason: 'Duplicate signal (already processed)'
                };
            }

            // Step 4: Log signal received
            await StrategyLog.logSignalReceived(strategy._id, strategy.user._id, signalPayload);

            // Step 5: Validate symbol mapping
            const symbol = this.mapSymbol(signalPayload.symbol);
            const stock = await Stock.findOne({ symbol: symbol, isActive: true });

            if (!stock) {
                await StrategyLog.logOrderRejected(
                    strategy._id,
                    strategy.user._id,
                    symbol,
                    'Invalid or inactive symbol'
                );
                throw new Error(`Symbol ${symbol} not found or inactive`);
            }

            // Step 6: Calculate trade amount
            const quantity = signalPayload.quantity || 1;
            const price = signalPayload.price || stock.basePrice;
            const tradeAmount = quantity * price;

            // Step 7: Apply risk management rules
            const riskCheck = await riskManager.validateTrade(strategy, tradeAmount);

            if (!riskCheck.allowed) {
                await StrategyLog.logOrderRejected(
                    strategy._id,
                    strategy.user._id,
                    symbol,
                    riskCheck.reason
                );

                console.log(`🚫 Trade rejected: ${riskCheck.reason}`);

                return {
                    success: false,
                    reason: riskCheck.reason,
                    riskChecks: riskCheck.checks
                };
            }

            // Step 8: Execute order
            const executionResult = await orderExecutor.execute(
                strategy.user._id,
                signalPayload.action,
                symbol,
                quantity,
                strategy._id
            );

            if (!executionResult.success) {
                await StrategyLog.logError(
                    strategy._id,
                    strategy.user._id,
                    symbol,
                    'Order execution failed'
                );
                throw new Error('Order execution failed');
            }

            // Step 9: Log successful execution
            await StrategyLog.logOrderExecuted(strategy._id, strategy.user._id, {
                type: signalPayload.action,
                symbol: symbol,
                quantity: quantity,
                price: price,
                orderId: executionResult.order._id,
                executionPrice: executionResult.executionPrice,
                slippage: executionResult.slippage,
                executionTime: executionResult.executionTime,
                profitLoss: executionResult.profitLoss || 0
            });

            // Step 10: Update strategy statistics
            const profitLoss = executionResult.profitLoss || 0;
            const isWin = profitLoss >= 0;
            strategy.updateStats(profitLoss, isWin);
            await strategy.save();

            // Step 11: Record trade in risk manager
            riskManager.recordTrade(strategy._id, profitLoss);

            // Step 12: Cache signal to prevent duplicates
            this.signalCache.set(signalKey, Date.now());
            setTimeout(() => this.signalCache.delete(signalKey), this.cacheExpiry);

            const totalTime = Date.now() - startTime;

            console.log(`✅ Signal processed successfully in ${totalTime}ms`);
            console.log(`   Strategy: ${strategy.name}`);
            console.log(`   Action: ${signalPayload.action} ${quantity} x ${symbol} @ ₹${executionResult.executionPrice.toFixed(2)}`);
            console.log(`   P&L: ₹${profitLoss.toFixed(2)}`);

            return {
                success: true,
                order: executionResult.order,
                executionPrice: executionResult.executionPrice,
                slippage: executionResult.slippage,
                profitLoss: profitLoss,
                executionTime: totalTime,
                riskChecks: riskCheck.checks
            };

        } catch (error) {
            console.error('❌ Strategy Engine Error:', error.message);

            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Validate signal payload structure
     */
    validateSignal(signal) {
        if (!signal) {
            return { valid: false, error: 'Signal payload is empty' };
        }

        if (!signal.symbol) {
            return { valid: false, error: 'Missing symbol' };
        }

        if (!signal.action || !['BUY', 'SELL'].includes(signal.action)) {
            return { valid: false, error: 'Invalid or missing action (must be BUY or SELL)' };
        }

        if (!signal.secret) {
            return { valid: false, error: 'Missing webhook secret' };
        }

        if (signal.quantity && signal.quantity < 1) {
            return { valid: false, error: 'Quantity must be at least 1' };
        }

        if (signal.price && signal.price <= 0) {
            return { valid: false, error: 'Price must be greater than 0' };
        }

        return { valid: true };
    }

    /**
     * Map TradingView symbol to internal symbol
     * Example: "NSE:RELIANCE" -> "RELIANCE"
     */
    mapSymbol(tvSymbol) {
        if (!tvSymbol) return null;

        // Remove exchange prefix if present
        if (tvSymbol.includes(':')) {
            return tvSymbol.split(':')[1];
        }

        return tvSymbol.toUpperCase();
    }

    /**
     * Get strategy performance metrics
     */
    async getStrategyMetrics(strategyId) {
        const strategy = await Strategy.findById(strategyId);
        if (!strategy) {
            throw new Error('Strategy not found');
        }

        const logs = await StrategyLog.find({ strategy: strategyId })
            .sort({ createdAt: -1 })
            .limit(100);

        const executed = logs.filter(l => l.eventType === 'ORDER_EXECUTED').length;
        const rejected = logs.filter(l => l.eventType === 'ORDER_REJECTED').length;
        const errors = logs.filter(l => l.eventType === 'ERROR').length;

        return {
            strategy: {
                name: strategy.name,
                symbol: strategy.symbol,
                isActive: strategy.isActive,
                totalTrades: strategy.totalTrades,
                totalProfit: strategy.totalProfit,
                totalLoss: strategy.totalLoss,
                winRate: strategy.winRate
            },
            recent: {
                executed: executed,
                rejected: rejected,
                errors: errors,
                total: logs.length
            },
            riskStats: riskManager.getRiskStats(strategyId)
        };
    }

    /**
     * Clear signal cache (admin action)
     */
    clearSignalCache() {
        this.signalCache.clear();
        console.log('🗑️ Signal cache cleared');
    }
}

module.exports = new StrategyEngine();
