// ... existing code ...
const Strategy = require('../models/Strategy');
const StrategyLog = require('../models/StrategyLog');
const User = require('../models/User'); // Added User import
const riskManager = require('../services/riskManager');
// ... existing code ...

// ... after deactivateStrategy ...

/**
 * @desc    Get all users
 * @route   GET /api/admin/users
 * @access  Admin
 */
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: users.length,
            data: users
        });

    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch users',
            error: error.message
        });
    }
};

/**
 * @desc    Toggle user active status
 * @route   PATCH /api/admin/users/:id/toggle
 * @access  Admin
 */
exports.toggleUserStatus = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Prevent deactivating self
        if (user._id.toString() === req.user.id) {
            return res.status(400).json({
                success: false,
                message: 'You cannot deactivate your own admin account'
            });
        }

        user.isActive = !user.isActive;
        await user.save();

        res.status(200).json({
            success: true,
            data: user,
            message: `User ${user.isActive ? 'activated' : 'deactivated'}`
        });

    } catch (error) {
        console.error('Toggle user status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update user status',
            error: error.message
        });
    }
};

const orderExecutor = require('../services/orderExecutor');
const marketDataService = require('../services/marketDataService');

/**
 * Admin Controller
 * Admin-only operations for system management
 */

/**
 * @desc    Get system statistics
 * @route   GET /api/admin/stats
 * @access  Admin
 */
exports.getSystemStats = async (req, res) => {
    try {
        const totalStrategies = await Strategy.countDocuments();
        const activeStrategies = await Strategy.countDocuments({ isActive: true });
        const totalLogs = await StrategyLog.countDocuments();

        const recentLogs = await StrategyLog.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('strategy', 'name symbol')
            .populate('user', 'name email');

        res.status(200).json({
            success: true,
            data: {
                strategies: {
                    total: totalStrategies,
                    active: activeStrategies,
                    inactive: totalStrategies - activeStrategies
                },
                logs: {
                    total: totalLogs
                },
                marketData: {
                    mode: marketDataService.getMode(),
                    isReady: marketDataService.isReady()
                },
                orderExecutor: orderExecutor.getConfig(),
                recentActivity: recentLogs
            }
        });

    } catch (error) {
        console.error('Get system stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch system statistics',
            error: error.message
        });
    }
};

/**
 * @desc    Emergency stop all strategies
 * @route   POST /api/admin/emergency-stop
 * @access  Admin
 */
exports.emergencyStop = async (req, res) => {
    try {
        const result = await riskManager.emergencyStop();

        res.status(200).json({
            success: result.success,
            message: result.message
        });

    } catch (error) {
        console.error('Emergency stop error:', error);
        res.status(500).json({
            success: false,
            message: 'Emergency stop failed',
            error: error.message
        });
    }
};

/**
 * @desc    Set order executor mode
 * @route   POST /api/admin/executor/mode
 * @access  Admin
 */
exports.setExecutorMode = async (req, res) => {
    try {
        const { mode } = req.body;

        if (!mode || !['PAPER', 'LIVE'].includes(mode)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid mode. Use PAPER or LIVE'
            });
        }

        orderExecutor.setMode(mode);

        res.status(200).json({
            success: true,
            message: `Executor mode set to ${mode}`,
            data: orderExecutor.getConfig()
        });

    } catch (error) {
        console.error('Set executor mode error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to set executor mode',
            error: error.message
        });
    }
};

/**
 * @desc    Get all strategies (admin view)
 * @route   GET /api/admin/strategies
 * @access  Admin
 */
exports.getAllStrategies = async (req, res) => {
    try {
        const strategies = await Strategy.find()
            .populate('user', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: strategies.length,
            data: strategies
        });

    } catch (error) {
        console.error('Get all strategies error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch strategies',
            error: error.message
        });
    }
};

/**
 * @desc    Deactivate user strategy (admin)
 * @route   PATCH /api/admin/strategies/:id/deactivate
 * @access  Admin
 */
exports.deactivateStrategy = async (req, res) => {
    try {
        const strategy = await Strategy.findById(req.params.id);

        if (!strategy) {
            return res.status(404).json({
                success: false,
                message: 'Strategy not found'
            });
        }

        strategy.isActive = false;
        await strategy.save();

        res.status(200).json({
            success: true,
            message: 'Strategy deactivated',
            data: strategy
        });

    } catch (error) {
        console.error('Deactivate strategy error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to deactivate strategy',
            error: error.message
        });
    }
};
