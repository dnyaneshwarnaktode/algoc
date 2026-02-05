const strategyEngine = require('../services/strategyEngine');

/**
 * Webhook Controller
 * Handles incoming TradingView webhook signals
 */

/**
 * @desc    Receive TradingView webhook signal
 * @route   POST /api/webhook/tradingview
 * @access  Public (authenticated via webhook secret)
 */
exports.receiveTradingViewSignal = async (req, res) => {
    try {
        const signalPayload = req.body;

        console.log('📥 Webhook received:', {
            symbol: signalPayload.symbol,
            action: signalPayload.action,
            timestamp: signalPayload.timestamp
        });

        // Process signal through strategy engine
        const result = await strategyEngine.processSignal(signalPayload);

        if (result.success) {
            return res.status(200).json({
                success: true,
                message: 'Signal processed successfully',
                data: {
                    orderId: result.order?._id,
                    executionPrice: result.executionPrice,
                    slippage: result.slippage,
                    profitLoss: result.profitLoss,
                    executionTime: result.executionTime
                }
            });
        } else {
            return res.status(400).json({
                success: false,
                message: result.reason || result.error || 'Signal processing failed',
                details: result
            });
        }

    } catch (error) {
        console.error('Webhook error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

/**
 * @desc    Test webhook endpoint
 * @route   GET /api/webhook/test
 * @access  Public
 */
exports.testWebhook = async (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Webhook endpoint is active',
        timestamp: new Date().toISOString(),
        info: {
            endpoint: '/api/webhook/tradingview',
            method: 'POST',
            requiredFields: ['symbol', 'action', 'secret'],
            optionalFields: ['quantity', 'price', 'strategy', 'timestamp']
        }
    });
};
