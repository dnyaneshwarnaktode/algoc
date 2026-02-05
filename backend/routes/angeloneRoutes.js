const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');

/**
 * @desc    Get Angel One info (public)
 * @route   GET /api/angelone/info
 * @access  Public
 */
router.get('/info', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Angel One SmartAPI Integration',
        data: {
            enabled: process.env.ANGEL_ENABLED === 'true',
            version: '1.0.0',
            phase: 'Phase A - Client Setup Complete',
            features: [
                'Market Data Streaming (Coming Soon)',
                'Health Monitoring',
                'Admin Controls'
            ],
            note: 'Angel One is optional. Paper trading works without it.',
        },
    });
});

/**
 * @desc    Get Angel One status
 * @route   GET /api/angelone/status
 * @access  Private/Admin
 */
router.get('/status', protect, admin, (req, res) => {
    try {
        const { getAngelOneHealth } = require('../services/broker/angelone/angelone.health');
        const health = getAngelOneHealth();
        const status = health.getStatus();

        res.status(200).json({
            success: true,
            data: status,
        });
    } catch (error) {
        console.error('Angel One status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get status',
            error: error.message,
        });
    }
});

/**
 * @desc    Get Angel One health status
 * @route   GET /api/angelone/health
 * @access  Private/Admin
 */
router.get('/health', protect, admin, async (req, res) => {
    try {
        const { getAngelOneHealth } = require('../services/broker/angelone/angelone.health');
        const health = getAngelOneHealth();
        const status = await health.check();

        res.status(200).json({
            success: true,
            data: status,
        });
    } catch (error) {
        console.error('Angel One health check error:', error);
        res.status(500).json({
            success: false,
            message: 'Health check failed',
            error: error.message,
        });
    }
});

/**
 * @desc    Test Angel One connection
 * @route   POST /api/angelone/test
 * @access  Private/Admin
 */
router.post('/test', protect, admin, async (req, res) => {
    try {
        const { getAngelOneHealth } = require('../services/broker/angelone/angelone.health');
        const health = getAngelOneHealth();
        const result = await health.testConnection();

        res.status(result.success ? 200 : 500).json({
            success: result.success,
            message: result.message,
            data: result.profile || null,
            error: result.error || null,
        });
    } catch (error) {
        console.error('Angel One connection test error:', error);
        res.status(500).json({
            success: false,
            message: 'Connection test failed',
            error: error.message,
        });
    }
});

/**
 * @desc    Reconnect to Angel One
 * @route   POST /api/angelone/reconnect
 * @access  Private/Admin
 */
router.post('/reconnect', protect, admin, async (req, res) => {
    try {
        const { getAngelOneHealth } = require('../services/broker/angelone/angelone.health');
        const health = getAngelOneHealth();
        const result = await health.reconnect();

        res.status(result.success ? 200 : 500).json({
            success: result.success,
            message: result.message,
            error: result.error || null,
        });
    } catch (error) {
        console.error('Angel One reconnect error:', error);
        res.status(500).json({
            success: false,
            message: 'Reconnection failed',
            error: error.message,
        });
    }
});

/**
 * @desc    Get market data status
 * @route   GET /api/angelone/marketdata/status
 * @access  Private/Admin
 */
router.get('/marketdata/status', protect, admin, (req, res) => {
    try {
        const { getMarketDataStatus } = require('../controllers/marketDataController');
        const status = getMarketDataStatus();

        res.status(200).json({
            success: true,
            data: status,
        });
    } catch (error) {
        console.error('Market data status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get market data status',
            error: error.message,
        });
    }
});

/**
 * @desc    Switch market data source
 * @route   POST /api/angelone/marketdata/switch
 * @access  Private/Admin
 */
router.post('/marketdata/switch', protect, admin, async (req, res) => {
    try {
        const { source } = req.body;

        if (!source) {
            return res.status(400).json({
                success: false,
                message: 'Data source is required (SIMULATED or ANGELONE)',
            });
        }

        const { switchDataSource } = require('../controllers/marketDataController');
        const result = await switchDataSource(source);

        res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
        console.error('Switch data source error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to switch data source',
            error: error.message,
        });
    }
});

/**
 * @desc    Get symbol mappings
 * @route   GET /api/angelone/symbols
 * @access  Private/Admin
 */
router.get('/symbols', protect, admin, (req, res) => {
    try {
        const symbolMapper = require('../services/broker/angelone/angelone.mapper');
        const mappings = symbolMapper.getAllMappings();
        const stats = symbolMapper.getStats();

        res.status(200).json({
            success: true,
            data: {
                mappings,
                stats,
            },
        });
    } catch (error) {
        console.error('Get symbols error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get symbol mappings',
            error: error.message,
        });
    }
});

module.exports = router;
