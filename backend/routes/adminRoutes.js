const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
// ... existing imports ...
const {
    getSystemStats,
    emergencyStop,
    setExecutorMode,
    getAllStrategies,
    deactivateStrategy,
    getAllUsers, // Added
    toggleUserStatus // Added
} = require('../controllers/adminController');

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Admin
router.get('/users', protect, admin, getAllUsers);

// @route   PATCH /api/admin/users/:id/toggle
// @desc    Toggle user active status
// @access  Admin
router.patch('/users/:id/toggle', protect, admin, toggleUserStatus);

// @route   GET /api/admin/stats
// @desc    Get system statistics
// @access  Admin
router.get('/stats', protect, admin, getSystemStats);

// @route   POST /api/admin/emergency-stop
// @desc    Emergency stop all strategies
// @access  Admin
router.post('/emergency-stop', protect, admin, emergencyStop);

// @route   POST /api/admin/executor/mode
// @desc    Set order executor mode (PAPER/LIVE)
// @access  Admin
router.post('/executor/mode', protect, admin, setExecutorMode);

// @route   GET /api/admin/strategies
// @desc    Get all strategies (admin view)
// @access  Admin
router.get('/strategies', protect, admin, getAllStrategies);

// @route   PATCH /api/admin/strategies/:id/deactivate
// @desc    Deactivate user strategy
// @access  Admin
router.patch('/strategies/:id/deactivate', protect, admin, deactivateStrategy);

module.exports = router;
