const express = require('express');
const router = express.Router();
const {
    getStocks,
    getStockBySymbol,
    getSectors,
    addStock,
    updateStock,
    deleteStock,
} = require('../controllers/stockController');
const { protect, admin } = require('../middleware/auth');

// Public/User routes (require authentication)
router.get('/', protect, getStocks);
router.get('/sectors/list', protect, getSectors);
router.get('/:symbol', protect, getStockBySymbol);

// Admin routes
router.post('/', protect, admin, addStock);
router.put('/:symbol', protect, admin, updateStock);
router.delete('/:symbol', protect, admin, deleteStock);

module.exports = router;
