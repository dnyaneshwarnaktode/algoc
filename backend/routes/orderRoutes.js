const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
    buyStock,
    sellStock,
    getOrders,
    getPortfolio,
    getPnL,
    getHoldingBySymbol
} = require('../controllers/orderController');

// All routes are protected (require authentication)

// @route   POST /api/orders/buy
// @desc    Place a buy order
// @access  Private
router.post('/buy', protect, buyStock);

// @route   POST /api/orders/sell
// @desc    Place a sell order
// @access  Private
router.post('/sell', protect, sellStock);

// @route   GET /api/orders
// @desc    Get user's order history
// @access  Private
router.get('/', protect, getOrders);

// @route   GET /api/orders/portfolio
// @desc    Get user's portfolio (holdings)
// @access  Private
router.get('/portfolio', protect, getPortfolio);

// @route   GET /api/orders/pnl
// @desc    Get P&L summary
// @access  Private
router.get('/pnl', protect, getPnL);

// @route   GET /api/orders/holding/:symbol
// @desc    Get specific holding by symbol
// @access  Private
router.get('/holding/:symbol', protect, getHoldingBySymbol);

module.exports = router;
