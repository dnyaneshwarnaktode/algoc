import api from './api';

/**
 * Strategy Service
 * API calls for strategy management
 */

// Create new strategy
export const createStrategy = async (strategyData) => {
    try {
        const { data } = await api.post('/strategies', strategyData);
        return data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

// Get all user strategies
export const getStrategies = async (filters = {}) => {
    try {
        const { data } = await api.get('/strategies', { params: filters });
        return data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

// Get single strategy with metrics
export const getStrategy = async (strategyId) => {
    try {
        const { data } = await api.get(`/strategies/${strategyId}`);
        return data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

// Update strategy
export const updateStrategy = async (strategyId, updates) => {
    try {
        const { data } = await api.put(`/strategies/${strategyId}`, updates);
        return data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

// Toggle strategy active status
export const toggleStrategy = async (strategyId) => {
    try {
        const { data } = await api.patch(`/strategies/${strategyId}/toggle`);
        return data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

// Delete strategy
export const deleteStrategy = async (strategyId) => {
    try {
        const { data } = await api.delete(`/strategies/${strategyId}`);
        return data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

// Get strategy logs
export const getStrategyLogs = async (strategyId, filters = {}) => {
    try {
        const { data } = await api.get(`/strategies/${strategyId}/logs`, { params: filters });
        return data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

// Reset strategy counters
export const resetStrategyCounters = async (strategyId) => {
    try {
        const { data } = await api.post(`/strategies/${strategyId}/reset`);
        return data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

// Admin: Get system stats
export const getSystemStats = async () => {
    try {
        const { data } = await api.get('/admin/stats');
        return data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

// Admin: Emergency stop
export const emergencyStop = async () => {
    try {
        const { data } = await api.post('/admin/emergency-stop');
        return data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

// Admin: Set executor mode
export const setExecutorMode = async (mode) => {
    try {
        const { data } = await api.post('/admin/executor/mode', { mode });
        return data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

// Test: Send simulated TradingView signal
export const sendTestSignal = async (payload) => {
    try {
        const { data } = await api.post('/webhook/tradingview', payload);
        return data;
    } catch (error) {
        throw error.response?.data || error;
    }
};
