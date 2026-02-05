const Strategy = require('../models/Strategy');
const StrategyLog = require('../models/StrategyLog');
const strategyEngine = require('../services/strategyEngine');
const riskManager = require('../services/riskManager');

/**
 * Strategy Controller
 * Manages automated trading strategies
 */

/**
 * @desc    Create new strategy
 * @route   POST /api/strategies
 * @access  Private
 */
exports.createStrategy = async (req, res) => {
    try {
        const {
            name,
            symbol,
            timeframe,
            mode,
            capitalAllocated,
            maxTradesPerDay,
            maxLossPerDay,
            maxCapitalPerTrade,
            cooldownBetweenTrades,
            description,
            tags
        } = req.body;

        const strategy = await Strategy.create({
            user: req.user.id,
            name,
            symbol: symbol.toUpperCase(),
            timeframe,
            mode: mode || 'PAPER',
            capitalAllocated,
            maxTradesPerDay: maxTradesPerDay || 10,
            maxLossPerDay: maxLossPerDay || 5000,
            maxCapitalPerTrade: maxCapitalPerTrade || 10000,
            cooldownBetweenTrades: cooldownBetweenTrades || 60,
            description,
            tags
        });

        res.status(201).json({
            success: true,
            message: 'Strategy created successfully',
            data: strategy
        });

    } catch (error) {
        console.error('Create strategy error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create strategy',
            error: error.message
        });
    }
};

/**
 * @desc    Get all user strategies
 * @route   GET /api/strategies
 * @access  Private
 */
exports.getStrategies = async (req, res) => {
    try {
        const { isActive, symbol } = req.query;

        const query = { user: req.user.id };

        if (isActive !== undefined) {
            query.isActive = isActive === 'true';
        }

        if (symbol) {
            query.symbol = symbol.toUpperCase();
        }

        const strategies = await Strategy.find(query).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: strategies.length,
            data: strategies
        });

    } catch (error) {
        console.error('Get strategies error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch strategies',
            error: error.message
        });
    }
};

/**
 * @desc    Get single strategy
 * @route   GET /api/strategies/:id
 * @access  Private
 */
exports.getStrategy = async (req, res) => {
    try {
        const strategy = await Strategy.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!strategy) {
            return res.status(404).json({
                success: false,
                message: 'Strategy not found'
            });
        }

        // Get performance metrics
        const metrics = await strategyEngine.getStrategyMetrics(strategy._id);

        res.status(200).json({
            success: true,
            data: {
                strategy,
                metrics
            }
        });

    } catch (error) {
        console.error('Get strategy error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch strategy',
            error: error.message
        });
    }
};

/**
 * @desc    Update strategy
 * @route   PUT /api/strategies/:id
 * @access  Private
 */
exports.updateStrategy = async (req, res) => {
    try {
        const strategy = await Strategy.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!strategy) {
            return res.status(404).json({
                success: false,
                message: 'Strategy not found'
            });
        }

        // Update allowed fields
        const allowedUpdates = [
            'name', 'capitalAllocated', 'maxTradesPerDay',
            'maxLossPerDay', 'maxCapitalPerTrade', 'cooldownBetweenTrades',
            'description', 'tags'
        ];

        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                strategy[field] = req.body[field];
            }
        });

        await strategy.save();

        res.status(200).json({
            success: true,
            message: 'Strategy updated successfully',
            data: strategy
        });

    } catch (error) {
        console.error('Update strategy error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update strategy',
            error: error.message
        });
    }
};

/**
 * @desc    Toggle strategy active status
 * @route   PATCH /api/strategies/:id/toggle
 * @access  Private
 */
exports.toggleStrategy = async (req, res) => {
    try {
        const strategy = await Strategy.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!strategy) {
            return res.status(404).json({
                success: false,
                message: 'Strategy not found'
            });
        }

        strategy.isActive = !strategy.isActive;
        await strategy.save();

        res.status(200).json({
            success: true,
            message: `Strategy ${strategy.isActive ? 'activated' : 'deactivated'}`,
            data: {
                isActive: strategy.isActive
            }
        });

    } catch (error) {
        console.error('Toggle strategy error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to toggle strategy',
            error: error.message
        });
    }
};

/**
 * @desc    Delete strategy
 * @route   DELETE /api/strategies/:id
 * @access  Private
 */
exports.deleteStrategy = async (req, res) => {
    try {
        const strategy = await Strategy.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!strategy) {
            return res.status(404).json({
                success: false,
                message: 'Strategy not found'
            });
        }

        // Deactivate before deleting
        strategy.isActive = false;
        await strategy.save();

        // Delete strategy
        await Strategy.deleteOne({ _id: strategy._id });

        res.status(200).json({
            success: true,
            message: 'Strategy deleted successfully'
        });

    } catch (error) {
        console.error('Delete strategy error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete strategy',
            error: error.message
        });
    }
};

/**
 * @desc    Get strategy logs
 * @route   GET /api/strategies/:id/logs
 * @access  Private
 */
exports.getStrategyLogs = async (req, res) => {
    try {
        const { limit = 50, eventType } = req.query;

        const query = {
            strategy: req.params.id,
            user: req.user.id
        };

        if (eventType) {
            query.eventType = eventType;
        }

        const logs = await StrategyLog.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .populate('order', 'type quantity price totalAmount status');

        res.status(200).json({
            success: true,
            count: logs.length,
            data: logs
        });

    } catch (error) {
        console.error('Get strategy logs error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch strategy logs',
            error: error.message
        });
    }
};

/**
 * @desc    Reset strategy counters
 * @route   POST /api/strategies/:id/reset
 * @access  Private
 */
exports.resetStrategyCounters = async (req, res) => {
    try {
        const strategy = await Strategy.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!strategy) {
            return res.status(404).json({
                success: false,
                message: 'Strategy not found'
            });
        }

        // Reset risk manager counters
        riskManager.resetStrategyCounters(strategy._id);

        res.status(200).json({
            success: true,
            message: 'Strategy counters reset successfully'
        });

    } catch (error) {
        console.error('Reset strategy error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reset strategy counters',
            error: error.message
        });
    }
};
