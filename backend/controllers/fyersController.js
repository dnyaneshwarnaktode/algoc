const fyersAuthService = require('../services/fyersAuthService');
const marketDataService = require('../services/marketDataService');

/**
 * @desc    Get Fyers Login URL
 * @route   GET /api/fyers/login-url
 * @access  Private/Admin
 */
exports.getLoginUrl = async (req, res) => {
    try {
        const loginUrl = fyersAuthService.generateLoginUrl();
        res.status(200).json({
            success: true,
            data: { loginUrl }
        });
    } catch (error) {
        console.error('Fyers login url error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate Fyers login URL'
        });
    }
};

/**
 * @desc    Handle Fyers Redirect Callback
 * @route   GET /api/fyers/callback
 * @access  Public
 */
exports.fyersCallback = async (req, res) => {
    try {
        const { auth_code, s, state } = req.query;

        if (s !== 'ok') {
            return res.status(400).send(`
                <html>
                    <body>
                        <h1>Authentication Failed</h1>
                        <p>Fyers returned status: ${s}</p>
                        <script>setTimeout(() => window.close(), 3000);</script>
                    </body>
                </html>
            `);
        }

        const result = await fyersAuthService.generateAccessToken(auth_code);

        if (result.success) {
            // If successful, we can also try to re-initialize market data if mode is FYERS
            if (marketDataService.getMode() === 'FYERS') {
                await marketDataService.initialize();
                await marketDataService.startMarketFeed();
            }

            res.status(200).send(`
                <html>
                    <body style="font-family: sans-serif; text-align: center; padding: 50px;">
                        <h1 style="color: #10b981;">✅ Authentication Successful!</h1>
                        <p>Fyers access token generated for the day.</p>
                        <p>This window will close automatically.</p>
                        <script>
                            setTimeout(() => {
                                window.close();
                            }, 2000);
                        </script>
                    </body>
                </html>
            `);
        } else {
            res.status(400).send(`
                <html>
                    <body>
                        <h1>Token Generation Failed</h1>
                        <p>${result.message || 'Unknown error'}</p>
                    </body>
                </html>
            `);
        }
    } catch (error) {
        console.error('Fyers callback error:', error);
        res.status(500).send('Internal Server Error during Fyers callback');
    }
};

/**
 * @desc    Get Fyers Status
 * @route   GET /api/fyers/status
 * @access  Private/Admin
 */
exports.getFyersStatus = async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            data: {
                isAuthenticated: fyersAuthService.isAuthenticated(),
                marketDataMode: marketDataService.getMode()
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch Fyers status'
        });
    }
};

/**
 * @desc    Switch Market Data Source to Fyers
 * @route   POST /api/fyers/activate
 * @access  Private/Admin
 */
exports.activateFyers = async (req, res) => {
    try {
        if (!fyersAuthService.isAuthenticated()) {
            return res.status(400).json({
                success: false,
                message: 'Fyers not authenticated. Visit login URL first.'
            });
        }

        await marketDataService.setMode('FYERS');

        res.status(200).json({
            success: true,
            message: 'Market data switched to Fyers'
        });
    } catch (error) {
        console.error('❌ Activate Fyers error details:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Internal Server Error during Fyers activation',
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

/**
 * @desc    Switch Market Data Source to Simulated
 * @route   POST /api/fyers/deactivate
 * @access  Private/Admin
 */
exports.deactivateFyers = async (req, res) => {
    try {
        await marketDataService.setMode('SIMULATED');

        res.status(200).json({
            success: true,
            message: 'Market data switched to Simulated'
        });
    } catch (error) {
        console.error('Deactivate Fyers error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * @desc    Force Refresh All Market Prices
 * @route   POST /api/fyers/refresh-prices
 * @access  Private/Admin
 */
exports.refreshPrices = async (req, res) => {
    try {
        const success = await marketDataService.refreshPrices();
        if (success) {
            res.status(200).json({
                success: true,
                message: 'Market prices refresh triggered'
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Failed to refresh prices. Ensure Fyers is authenticated.'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
