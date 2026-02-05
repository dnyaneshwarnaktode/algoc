const express = require('express');
const router = express.Router();
const {
    signup,
    login,
    getMe,
    updatePassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/signup', signup);
router.post('/login', login);

// Protected routes (require authentication)
router.get('/me', protect, getMe);
router.put('/password', protect, updatePassword);

module.exports = router;
