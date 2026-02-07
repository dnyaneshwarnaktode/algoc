const express = require('express');
const router = express.Router();
const {
    getStocks,
    getStockBySymbol,
    getSectors,
    addStock,
    updateStock,
    deleteStock,
    getMarketDataStatus,
    syncFyersStocks,
} = require('../controllers/stockController');
const { protect, admin } = require('../middleware/auth');

// Public/User routes (require authentication)
router.get('/', protect, getStocks);
router.get('/sectors/list', protect, getSectors);
router.get('/market-status', protect, getMarketDataStatus);
router.get('/:symbol', protect, getStockBySymbol);

// Admin routes
router.post('/sync-fyers', protect, admin, syncFyersStocks);
router.post('/', protect, admin, addStock);
router.put('/:symbol', protect, admin, updateStock);
router.delete('/:symbol', protect, admin, deleteStock);

module.exports = router;
