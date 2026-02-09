const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const {
    getLoginUrl,
    fyersCallback,
    getFyersStatus,
    activateFyers,
    deactivateFyers,
    refreshPrices
} = require('../controllers/fyersController');

// Public callback route
router.get('/callback', fyersCallback);

// Protected Admin routes
router.get('/login-url', protect, admin, getLoginUrl);
router.get('/status', protect, admin, getFyersStatus);
router.post('/activate', protect, admin, activateFyers);
router.post('/deactivate', protect, admin, deactivateFyers);
router.post('/refresh-prices', protect, admin, refreshPrices);

module.exports = router;
