const fyers = require('fyers-api-v3');
const crypto = require('crypto');

class FyersAuthService {
    constructor() {
        this.fyersModel = new fyers.fyersModel();
        this.accessToken = null;
        this.isInitialized = false;
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
                console.log('✅ Fyers Access Token generated successfully');
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
}

module.exports = new FyersAuthService();
