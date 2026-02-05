const { SmartAPI } = require('smartapi-javascript');
const speakeasy = require('speakeasy');

/**
 * Angel One SmartAPI Client
 * 
 * Handles authentication and session management
 * ISOLATED MODULE - Does not affect paper trading
 */
class AngelOneClient {
    constructor() {
        this.client = null;
        this.sessionToken = null;
        this.feedToken = null;
        this.isConnected = false;
        this.lastLoginTime = null;

        // Configuration from environment
        this.config = {
            enabled: process.env.ANGEL_ENABLED === 'true',
            apiKey: process.env.ANGEL_API_KEY,
            clientCode: process.env.ANGEL_CLIENT_CODE,
            password: process.env.ANGEL_PASSWORD,
            totpSecret: process.env.ANGEL_TOTP_SECRET,
            reconnectAttempts: parseInt(process.env.ANGEL_RECONNECT_ATTEMPTS) || 3,
            reconnectDelay: parseInt(process.env.ANGEL_RECONNECT_DELAY) || 5000,
            sessionTimeout: parseInt(process.env.ANGEL_SESSION_TIMEOUT) || 86400000, // 24 hours
        };

        // Validate configuration
        if (this.config.enabled) {
            this.validateConfig();
        }
    }

    /**
     * Validate Angel One configuration
     */
    validateConfig() {
        const required = ['apiKey', 'clientCode', 'password', 'totpSecret'];
        const missing = required.filter(key => !this.config[key]);

        if (missing.length > 0) {
            console.warn(`[AngelOne] Missing configuration: ${missing.join(', ')}`);
            console.warn('[AngelOne] Angel One integration disabled. Using simulated data.');
            this.config.enabled = false;
        }
    }

    /**
     * Check if Angel One is enabled
     */
    isEnabled() {
        return this.config.enabled;
    }

    /**
     * Generate TOTP token
     */
    generateTOTP() {
        try {
            const token = speakeasy.totp({
                secret: this.config.totpSecret,
                encoding: 'base32',
            });
            return token;
        } catch (error) {
            console.error('[AngelOne] TOTP generation failed:', this.maskError(error));
            throw new Error('Failed to generate TOTP');
        }
    }

    /**
     * Login to Angel One SmartAPI
     */
    async login() {
        if (!this.config.enabled) {
            throw new Error('Angel One integration is disabled');
        }

        try {
            console.log('[AngelOne] Initiating login...');

            // Initialize SmartAPI client
            this.client = new SmartAPI({
                api_key: this.config.apiKey,
            });

            // Generate TOTP
            const totp = this.generateTOTP();

            // Login
            const loginResponse = await this.client.generateSession(
                this.config.clientCode,
                this.config.password,
                totp
            );

            if (loginResponse.status && loginResponse.data) {
                this.sessionToken = loginResponse.data.jwtToken;
                this.feedToken = loginResponse.data.feedToken;
                this.isConnected = true;
                this.lastLoginTime = Date.now();

                // Set session token
                this.client.setSessionToken(this.sessionToken);

                console.log('[AngelOne] Login successful');
                console.log(`[AngelOne] Session expires in: ${this.config.sessionTimeout / 1000 / 60} minutes`);

                return {
                    success: true,
                    sessionToken: this.sessionToken,
                    feedToken: this.feedToken,
                };
            } else {
                throw new Error(loginResponse.message || 'Login failed');
            }
        } catch (error) {
            this.isConnected = false;
            console.error('[AngelOne] Login failed:', this.maskError(error));
            throw error;
        }
    }

    /**
     * Logout from Angel One
     */
    async logout() {
        if (!this.client || !this.isConnected) {
            return { success: true, message: 'Already logged out' };
        }

        try {
            console.log('[AngelOne] Logging out...');

            await this.client.terminateSession(this.config.clientCode);

            this.sessionToken = null;
            this.feedToken = null;
            this.isConnected = false;
            this.client = null;

            console.log('[AngelOne] Logout successful');
            return { success: true, message: 'Logged out successfully' };
        } catch (error) {
            console.error('[AngelOne] Logout failed:', this.maskError(error));
            // Force disconnect even if logout fails
            this.isConnected = false;
            this.client = null;
            return { success: false, message: error.message };
        }
    }

    /**
     * Check if session is valid
     */
    isSessionValid() {
        if (!this.isConnected || !this.sessionToken) {
            return false;
        }

        // Check if session has expired
        const now = Date.now();
        const elapsed = now - this.lastLoginTime;

        if (elapsed > this.config.sessionTimeout) {
            console.log('[AngelOne] Session expired');
            this.isConnected = false;
            return false;
        }

        return true;
    }

    /**
     * Reconnect to Angel One
     */
    async reconnect() {
        console.log('[AngelOne] Attempting to reconnect...');

        for (let attempt = 1; attempt <= this.config.reconnectAttempts; attempt++) {
            try {
                console.log(`[AngelOne] Reconnect attempt ${attempt}/${this.config.reconnectAttempts}`);

                await this.login();

                console.log('[AngelOne] Reconnection successful');
                return { success: true };
            } catch (error) {
                console.error(`[AngelOne] Reconnect attempt ${attempt} failed:`, this.maskError(error));

                if (attempt < this.config.reconnectAttempts) {
                    console.log(`[AngelOne] Waiting ${this.config.reconnectDelay}ms before retry...`);
                    await this.sleep(this.config.reconnectDelay);
                }
            }
        }

        console.error('[AngelOne] All reconnection attempts failed');
        return { success: false, message: 'Reconnection failed' };
    }

    /**
     * Get user profile
     */
    async getProfile() {
        if (!this.isSessionValid()) {
            throw new Error('Not logged in or session expired');
        }

        try {
            const response = await this.client.getProfile();

            if (response.status && response.data) {
                return {
                    success: true,
                    data: {
                        clientCode: response.data.clientcode,
                        name: response.data.name,
                        email: response.data.email,
                        exchanges: response.data.exchanges,
                    },
                };
            } else {
                throw new Error(response.message || 'Failed to fetch profile');
            }
        } catch (error) {
            console.error('[AngelOne] Get profile failed:', this.maskError(error));
            throw error;
        }
    }

    /**
     * Get RMS limits (funds)
     */
    async getRMSLimits() {
        if (!this.isSessionValid()) {
            throw new Error('Not logged in or session expired');
        }

        try {
            const response = await this.client.rmsLimit();

            if (response.status && response.data) {
                return {
                    success: true,
                    data: response.data,
                };
            } else {
                throw new Error(response.message || 'Failed to fetch RMS limits');
            }
        } catch (error) {
            console.error('[AngelOne] Get RMS limits failed:', this.maskError(error));
            throw error;
        }
    }

    /**
     * Get client instance
     */
    getClient() {
        if (!this.isSessionValid()) {
            throw new Error('Not logged in or session expired');
        }
        return this.client;
    }

    /**
     * Get feed token
     */
    getFeedToken() {
        return this.feedToken;
    }

    /**
     * Get connection status
     */
    getStatus() {
        return {
            enabled: this.config.enabled,
            connected: this.isConnected,
            sessionValid: this.isSessionValid(),
            lastLogin: this.lastLoginTime,
        };
    }

    /**
     * Mask sensitive error information
     */
    maskError(error) {
        const errorStr = error.toString();
        // Mask any potential credentials in error messages
        return errorStr
            .replace(this.config.password || '', '***')
            .replace(this.config.apiKey || '', '***')
            .replace(this.config.totpSecret || '', '***');
    }

    /**
     * Sleep utility
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Singleton instance
let instance = null;

/**
 * Get AngelOne client instance
 */
function getAngelOneClient() {
    if (!instance) {
        instance = new AngelOneClient();
    }
    return instance;
}

module.exports = {
    AngelOneClient,
    getAngelOneClient,
};
