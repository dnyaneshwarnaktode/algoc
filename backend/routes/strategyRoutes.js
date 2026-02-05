const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
    createStrategy,
    getStrategies,
    getStrategy,
    updateStrategy,
    toggleStrategy,
    deleteStrategy,
    getStrategyLogs,
    resetStrategyCounters
} = require('../controllers/strategyController');

/**
 * Strategy Routes
 * All routes require authentication
 */

// @route   POST /api/strategies
// @desc    Create new strategy
// @access  Private
router.post('/', protect, createStrategy);

// @route   GET /api/strategies
// @desc    Get all user strategies
// @access  Private
router.get('/', protect, getStrategies);

// @route   GET /api/strategies/:id
// @desc    Get single strategy with metrics
// @access  Private
router.get('/:id', protect, getStrategy);

// @route   PUT /api/strategies/:id
// @desc    Update strategy
// @access  Private
router.put('/:id', protect, updateStrategy);

// @route   PATCH /api/strategies/:id/toggle
// @desc    Toggle strategy active status
// @access  Private
router.patch('/:id/toggle', protect, toggleStrategy);

// @route   DELETE /api/strategies/:id
// @desc    Delete strategy
// @access  Private
router.delete('/:id', protect, deleteStrategy);

// @route   GET /api/strategies/:id/logs
// @desc    Get strategy execution logs
// @access  Private
router.get('/:id/logs', protect, getStrategyLogs);

// @route   POST /api/strategies/:id/reset
// @desc    Reset strategy counters
// @access  Private
router.post('/:id/reset', protect, resetStrategyCounters);

module.exports = router;
