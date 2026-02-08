const mongoose = require('mongoose');

const fyersTokenSchema = new mongoose.Schema({
    accessToken: {
        type: String,
        required: true
    },
    date: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 86400 * 2 // Automatically delete after 2 days
    }
});

module.exports = mongoose.model('FyersToken', fyersTokenSchema);
