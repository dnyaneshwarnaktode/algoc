const { getAngelOneClient } = require('./angelone.client');

/**
 * Angel One Health Check
 * 
 * Monitors connection status and provides health endpoints
 */
class AngelOneHealth {
    constructor() {
        this.client = getAngelOneClient();
        this.healthStatus = {
            enabled: false,
            connected: false,
            lastCheck: null,
            lastError: null,
            uptime: 0,
            reconnectCount: 0,
        };
    }

    /**
     * Perform health check
     */
    async check() {
        const status = this.client.getStatus();

        this.healthStatus.enabled = status.enabled;
        this.healthStatus.connected = status.connected;
        this.healthStatus.lastCheck = new Date();

        // If not enabled, return early
        if (!status.enabled) {
            return {
                status: 'disabled',
                message: 'Angel One integration is disabled',
                details: this.healthStatus,
            };
        }

        // If not connected, try to connect
        if (!status.connected || !status.sessionValid) {
            try {
                console.log('[AngelOne Health] Attempting to establish connection...');
                await this.client.login();

                this.healthStatus.connected = true;
                this.healthStatus.lastError = null;

                return {
                    status: 'healthy',
                    message: 'Connected to Angel One SmartAPI',
                    details: this.healthStatus,
                };
            } catch (error) {
                this.healthStatus.connected = false;
                this.healthStatus.lastError = error.message;

                return {
                    status: 'unhealthy',
                    message: 'Failed to connect to Angel One SmartAPI',
                    error: error.message,
                    details: this.healthStatus,
                };
            }
        }

        // Connection is valid
        return {
            status: 'healthy',
            message: 'Connected to Angel One SmartAPI',
            details: this.healthStatus,
        };
    }

    /**
     * Get current health status
     */
    getStatus() {
        return {
            ...this.healthStatus,
            clientStatus: this.client.getStatus(),
        };
    }

    /**
     * Test connection with profile fetch
     */
    async testConnection() {
        if (!this.client.isEnabled()) {
            return {
                success: false,
                message: 'Angel One integration is disabled',
            };
        }

        try {
            // Ensure we're logged in
            if (!this.client.isSessionValid()) {
                await this.client.login();
            }

            // Fetch profile as connection test
            const profile = await this.client.getProfile();

            return {
                success: true,
                message: 'Connection test successful',
                profile: profile.data,
            };
        } catch (error) {
            return {
                success: false,
                message: 'Connection test failed',
                error: error.message,
            };
        }
    }

    /**
     * Force reconnection
     */
    async reconnect() {
        if (!this.client.isEnabled()) {
            return {
                success: false,
                message: 'Angel One integration is disabled',
            };
        }

        try {
            console.log('[AngelOne Health] Manual reconnection requested');

            // Logout first
            await this.client.logout();

            // Reconnect
            const result = await this.client.reconnect();

            if (result.success) {
                this.healthStatus.reconnectCount++;
                this.healthStatus.connected = true;
                this.healthStatus.lastError = null;
            }

            return result;
        } catch (error) {
            this.healthStatus.lastError = error.message;
            return {
                success: false,
                message: 'Reconnection failed',
                error: error.message,
            };
        }
    }

    /**
     * Start periodic health checks
     */
    startMonitoring(intervalMs = 60000) {
        if (this.monitoringInterval) {
            console.log('[AngelOne Health] Monitoring already started');
            return;
        }

        console.log(`[AngelOne Health] Starting health monitoring (interval: ${intervalMs}ms)`);

        this.monitoringInterval = setInterval(async () => {
            try {
                await this.check();
            } catch (error) {
                console.error('[AngelOne Health] Health check failed:', error.message);
            }
        }, intervalMs);
    }

    /**
     * Stop periodic health checks
     */
    stopMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
            console.log('[AngelOne Health] Health monitoring stopped');
        }
    }
}

// Singleton instance
let instance = null;

/**
 * Get AngelOne health instance
 */
function getAngelOneHealth() {
    if (!instance) {
        instance = new AngelOneHealth();
    }
    return instance;
}

module.exports = {
    AngelOneHealth,
    getAngelOneHealth,
};
