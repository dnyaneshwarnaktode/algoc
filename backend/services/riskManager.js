const Order = require('../models/Order');
const Strategy = require('../models/Strategy');

/**
 * Risk Management Service
 * Enforces trading limits and risk rules
 */
class RiskManager {
    constructor() {
        this.dailyTradeCount = new Map(); // strategyId -> count
        this.dailyLoss = new Map(); // strategyId -> loss amount
        this.lastTradeTime = new Map(); // strategyId -> timestamp
        this.resetTime = null;

        // Reset counters daily at midnight
        this.scheduleDailyReset();
    }

    /**
     * Schedule daily reset of counters
     */
    scheduleDailyReset() {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        const timeUntilMidnight = tomorrow - now;

        setTimeout(() => {
            this.resetDailyCounters();
            // Schedule next reset
            setInterval(() => this.resetDailyCounters(), 24 * 60 * 60 * 1000);
        }, timeUntilMidnight);
    }

    /**
     * Reset daily counters
     */
    resetDailyCounters() {
        this.dailyTradeCount.clear();
        this.dailyLoss.clear();
        console.log('🔄 Risk Manager: Daily counters reset');
    }

    /**
     * Validate if trade is allowed based on risk rules
     */
    async validateTrade(strategy, tradeAmount) {
        const checks = [];

        // Check 1: Strategy must be active
        if (!strategy.isActive) {
            return {
                allowed: false,
                reason: 'Strategy is not active'
            };
        }

        // Check 2: Max trades per day
        const todayTradeCount = this.dailyTradeCount.get(strategy._id.toString()) || 0;
        if (todayTradeCount >= strategy.maxTradesPerDay) {
            return {
                allowed: false,
                reason: `Max trades per day limit reached (${strategy.maxTradesPerDay})`
            };
        }
        checks.push(`Trades today: ${todayTradeCount}/${strategy.maxTradesPerDay}`);

        // Check 3: Max loss per day
        const todayLoss = this.dailyLoss.get(strategy._id.toString()) || 0;
        if (todayLoss >= strategy.maxLossPerDay) {
            return {
                allowed: false,
                reason: `Max daily loss limit reached (₹${strategy.maxLossPerDay})`
            };
        }
        checks.push(`Daily loss: ₹${todayLoss.toFixed(2)}/₹${strategy.maxLossPerDay}`);

        // Check 4: Max capital per trade
        if (tradeAmount > strategy.maxCapitalPerTrade) {
            return {
                allowed: false,
                reason: `Trade amount (₹${tradeAmount}) exceeds max capital per trade (₹${strategy.maxCapitalPerTrade})`
            };
        }
        checks.push(`Trade amount: ₹${tradeAmount}/₹${strategy.maxCapitalPerTrade}`);

        // Check 5: Cooldown between trades
        const lastTrade = this.lastTradeTime.get(strategy._id.toString());
        if (lastTrade) {
            const timeSinceLastTrade = (Date.now() - lastTrade) / 1000; // seconds
            if (timeSinceLastTrade < strategy.cooldownBetweenTrades) {
                const remainingCooldown = Math.ceil(strategy.cooldownBetweenTrades - timeSinceLastTrade);
                return {
                    allowed: false,
                    reason: `Cooldown active. Wait ${remainingCooldown}s before next trade`
                };
            }
        }
        checks.push(`Cooldown: OK`);

        // Check 6: Sufficient capital allocated
        if (tradeAmount > strategy.capitalAllocated) {
            return {
                allowed: false,
                reason: `Insufficient capital allocated (₹${strategy.capitalAllocated})`
            };
        }
        checks.push(`Capital allocated: ₹${strategy.capitalAllocated}`);

        // Check 7: Market hours (9:15 AM - 3:30 PM IST)
        if (!this.isMarketOpen()) {
            return {
                allowed: false,
                reason: 'Market is closed. Trading hours: 9:15 AM - 3:30 PM IST'
            };
        }
        checks.push('Market hours: OK');

        return {
            allowed: true,
            checks: checks
        };
    }

    /**
     * Record trade execution
     */
    recordTrade(strategyId, profitLoss) {
        const strategyIdStr = strategyId.toString();

        // Increment trade count
        const currentCount = this.dailyTradeCount.get(strategyIdStr) || 0;
        this.dailyTradeCount.set(strategyIdStr, currentCount + 1);

        // Update daily loss if negative P&L
        if (profitLoss < 0) {
            const currentLoss = this.dailyLoss.get(strategyIdStr) || 0;
            this.dailyLoss.set(strategyIdStr, currentLoss + Math.abs(profitLoss));
        }

        // Record last trade time
        this.lastTradeTime.set(strategyIdStr, Date.now());
    }

    /**
     * Check if market is open (IST timezone)
     */
    isMarketOpen() {
        const now = new Date();

        // Convert to IST (UTC+5:30)
        const istOffset = 5.5 * 60 * 60 * 1000;
        const istTime = new Date(now.getTime() + istOffset);

        const day = istTime.getUTCDay();
        const hours = istTime.getUTCHours();
        const minutes = istTime.getUTCMinutes();

        // Market closed on weekends
        if (day === 0 || day === 6) {
            return false;
        }

        // Market hours: 9:15 AM - 3:30 PM IST
        const currentTime = hours * 60 + minutes;
        const marketOpen = 9 * 60 + 15; // 9:15 AM
        const marketClose = 15 * 60 + 30; // 3:30 PM

        return currentTime >= marketOpen && currentTime <= marketClose;
    }

    /**
     * Get risk statistics for a strategy
     */
    getRiskStats(strategyId) {
        const strategyIdStr = strategyId.toString();

        return {
            tradesExecutedToday: this.dailyTradeCount.get(strategyIdStr) || 0,
            dailyLoss: this.dailyLoss.get(strategyIdStr) || 0,
            lastTradeTime: this.lastTradeTime.get(strategyIdStr) || null,
            marketOpen: this.isMarketOpen()
        };
    }

    /**
     * Force reset strategy counters (admin action)
     */
    resetStrategyCounters(strategyId) {
        const strategyIdStr = strategyId.toString();
        this.dailyTradeCount.delete(strategyIdStr);
        this.dailyLoss.delete(strategyIdStr);
        this.lastTradeTime.delete(strategyIdStr);
    }

    /**
     * Emergency kill switch - stop all strategies
     */
    async emergencyStop() {
        try {
            await Strategy.updateMany(
                { isActive: true },
                { isActive: false }
            );

            this.resetDailyCounters();
            console.log('🚨 EMERGENCY STOP: All strategies deactivated');

            return { success: true, message: 'All strategies stopped' };
        } catch (error) {
            console.error('Emergency stop failed:', error);
            return { success: false, message: error.message };
        }
    }
}

module.exports = new RiskManager();
