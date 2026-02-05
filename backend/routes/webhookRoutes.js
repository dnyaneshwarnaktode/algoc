const express = require('express');
const router = express.Router();
const {
    receiveTradingViewSignal,
    testWebhook
} = require('../controllers/webhookController');

/**
 * Webhook Routes
 * Public endpoints for receiving external signals
 */

// @route   POST /api/webhook/tradingview
// @desc    Receive TradingView webhook signal
// @access  Public (authenticated via webhook secret in payload)
router.post('/tradingview', receiveTradingViewSignal);

// @route   GET /api/webhook/test
// @desc    Test webhook endpoint
// @access  Public
router.get('/test', testWebhook);

module.exports = router;
