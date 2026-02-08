const fyers = require('fyers-api-v3');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class FyersAuthService {
    constructor() {
        this.fyersModel = new fyers.fyersModel();
        this.accessToken = null;
        this.isInitialized = false;
        this.tokenFilePath = path.join(__dirname, '../logs/fyers_token.json');

        // Ensure logs directory exists
        const logDir = path.join(__dirname, '../logs');
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }

        // Auto-load token on creation
        this.loadToken();
    }

    /**
     * Initialize Fyers Model with App ID and Redirect URL
     */
    initialize() {
        if (!process.env.FYERS_APP_ID || !process.env.FYERS_REDIRECT_URL) {
            console.error('❌ Fyers App ID or Redirect URL missing in .env');
            return false;
        }

        this.fyersModel.setAppId(process.env.FYERS_APP_ID);
        this.fyersModel.setRedirectUrl(process.env.FYERS_REDIRECT_URL);
        this.isInitialized = true;
        return true;
    }

    /**
     * Generate Login URL for user authentication
     */
    generateLoginUrl() {
        if (!this.isInitialized) this.initialize();

        // Fyers V3 Login URL
        return `https://api-t1.fyers.in/api/v3/generate-authcode?client_id=${process.env.FYERS_APP_ID}&redirect_uri=${encodeURIComponent(process.env.FYERS_REDIRECT_URL)}&response_type=code&state=sample_state`;
    }

    /**
     * Swap Auth Code for Access Token
     * @param {string} authCode 
     */
    async generateAccessToken(authCode) {
        try {
            if (!this.isInitialized) this.initialize();

            const appId = process.env.FYERS_APP_ID?.trim();
            const secretKey = process.env.FYERS_SECRET_ID?.trim();

            if (!appId || !secretKey) throw new Error('FYERS_APP_ID or FYERS_SECRET_ID missing');

            const reqBody = {
                client_id: appId,
                auth_code: authCode,
                secret_key: secretKey // Pass the RAW secret key, SDK hashes it internally
            };

            const response = await this.fyersModel.generate_access_token(reqBody);

            if (response.s === 'ok') {
                this.accessToken = response.access_token;
                this.fyersModel.setAccessToken(this.accessToken);
                this.saveToken(this.accessToken);
                console.log('✅ Fyers Access Token generated and saved');
                return { success: true, accessToken: this.accessToken };
            } else {
                console.error('❌ Fyers Access Token generation failed. Response:', JSON.stringify(response, null, 2));
                console.error('Request Body sent (excluding sensitive):', {
                    auth_code: authCode ? 'PRESENT' : 'MISSING',
                    app_id: process.env.FYERS_APP_ID
                });
                return { success: false, message: response.message || 'Unknown error' };
            }
        } catch (error) {
            console.error('❌ Error generating Fyers Access Token:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Set access token manually (e.g., from cache or previous session same day)
     */
    setAccessToken(token) {
        this.accessToken = token;
        this.fyersModel.setAccessToken(token);
    }

    getAccessToken() {
        return this.accessToken;
    }

    isAuthenticated() {
        return !!this.accessToken;
    }

    /**
     * Get quotes for symbols
     * @param {string[]} symbols - Array of symbols (e.g. ['NSE:SBIN-EQ', 'NSE:RELIANCE-EQ'])
     */
    async getQuotes(symbols) {
        try {
            if (!this.isAuthenticated()) throw new Error('Not authenticated with Fyers');

            // Fyers limit for quotes is 50 symbols per request
            const quotes = await this.fyersModel.get_quotes({ symbols: symbols.join(',') });
            return quotes;
        } catch (error) {
            console.error('Error fetching Fyers quotes:', error);
            throw error;
        }
    }

    /**
     * Save token to file
     */
    saveToken(token) {
        try {
            const data = {
                accessToken: token,
                date: new Date().toLocaleDateString()
            };
            fs.writeFileSync(this.tokenFilePath, JSON.stringify(data));
        } catch (error) {
            console.error('Error saving Fyers token:', error);
        }
    }

    /**
     * Load token from file
     */
    loadToken() {
        try {
            if (fs.existsSync(this.tokenFilePath)) {
                const data = JSON.parse(fs.readFileSync(this.tokenFilePath, 'utf8'));

                // Fyers tokens expire at 3:00 AM. 
                // We check if the token was saved today.
                if (data.date === new Date().toLocaleDateString()) {
                    this.accessToken = data.accessToken;
                    this.fyersModel.setAccessToken(this.accessToken);
                    console.log('📂 Loaded existing Fyers token from file');
                } else {
                    console.log('⌛ Existing Fyers token has expired (new day started)');
                }
            }
        } catch (error) {
            console.error('Error loading Fyers token:', error);
        }
    }
}

module.exports = new FyersAuthService();
