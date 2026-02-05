const { getAngelOneMarketData } = require('../services/broker/angelone/angelone.marketData');

/**
 * Market Data Controller
 * 
 * Provides unified interface for market data
 * Handles switching between Angel One and simulated data
 */

let marketDataSource = process.env.MARKET_DATA_SOURCE || 'SIMULATED';
let angelOneMarketData = null;

/**
 * Initialize market data service
 */
async function initializeMarketData() {
    console.log(`[MarketData] Initializing market data service...`);
    console.log(`[MarketData] Data source: ${marketDataSource}`);

    if (marketDataSource === 'ANGELONE') {
        try {
            angelOneMarketData = getAngelOneMarketData();
            const result = await angelOneMarketData.initialize();

            if (result.success) {
                console.log('[MarketData] Angel One market data initialized');
            } else {
                console.warn('[MarketData] Angel One initialization failed, falling back to SIMULATED');
                marketDataSource = 'SIMULATED';
            }
        } catch (error) {
            console.error('[MarketData] Angel One error:', error.message);
            console.log('[MarketData] Falling back to SIMULATED data');
            marketDataSource = 'SIMULATED';
        }
    }

    console.log(`[MarketData] Active data source: ${marketDataSource}`);
}

/**
 * Start market data streaming
 */
async function startMarketData(symbols = []) {
    if (marketDataSource === 'ANGELONE' && angelOneMarketData) {
        return await angelOneMarketData.startStreaming(symbols);
    }

    return {
        success: true,
        message: 'Using simulated market data',
        source: 'SIMULATED',
    };
}

/**
 * Stop market data streaming
 */
async function stopMarketData() {
    if (marketDataSource === 'ANGELONE' && angelOneMarketData) {
        return await angelOneMarketData.stopStreaming();
    }

    return { success: true, message: 'Simulated data stopped' };
}

/**
 * Subscribe to symbols
 */
async function subscribeToSymbols(symbols) {
    if (marketDataSource === 'ANGELONE' && angelOneMarketData) {
        return await angelOneMarketData.subscribe(symbols);
    }

    return {
        success: true,
        message: 'Simulated data - no subscription needed',
        source: 'SIMULATED',
    };
}

/**
 * Unsubscribe from symbols
 */
async function unsubscribeFromSymbols(symbols) {
    if (marketDataSource === 'ANGELONE' && angelOneMarketData) {
        return await angelOneMarketData.unsubscribe(symbols);
    }

    return { success: true, message: 'Simulated data - no unsubscription needed' };
}

/**
 * Register price update callback
 */
function onPriceUpdate(callback) {
    if (marketDataSource === 'ANGELONE' && angelOneMarketData) {
        return angelOneMarketData.onPriceUpdate(callback);
    }

    // For simulated data, return no-op unsubscribe function
    return () => { };
}

/**
 * Get current price for a symbol
 */
function getPrice(symbol) {
    if (marketDataSource === 'ANGELONE' && angelOneMarketData) {
        return angelOneMarketData.getPrice(symbol);
    }

    return null; // Simulated data handled elsewhere
}

/**
 * Get all prices
 */
function getAllPrices() {
    if (marketDataSource === 'ANGELONE' && angelOneMarketData) {
        return angelOneMarketData.getAllPrices();
    }

    return [];
}

/**
 * Switch data source
 */
async function switchDataSource(newSource) {
    if (newSource !== 'SIMULATED' && newSource !== 'ANGELONE') {
        return {
            success: false,
            message: 'Invalid data source. Must be SIMULATED or ANGELONE',
        };
    }

    const oldSource = marketDataSource;

    try {
        // Stop current source
        await stopMarketData();

        // Switch source
        marketDataSource = newSource;
        process.env.MARKET_DATA_SOURCE = newSource;

        // Initialize new source
        await initializeMarketData();

        console.log(`[MarketData] Switched from ${oldSource} to ${newSource}`);

        return {
            success: true,
            message: `Switched to ${newSource} data source`,
            oldSource,
            newSource,
        };
    } catch (error) {
        console.error('[MarketData] Failed to switch data source:', error.message);

        // Rollback
        marketDataSource = oldSource;
        process.env.MARKET_DATA_SOURCE = oldSource;

        return {
            success: false,
            message: 'Failed to switch data source',
            error: error.message,
        };
    }
}

/**
 * Get market data status
 */
function getMarketDataStatus() {
    const status = {
        dataSource: marketDataSource,
        angelOneEnabled: process.env.ANGEL_ENABLED === 'true',
    };

    if (marketDataSource === 'ANGELONE' && angelOneMarketData) {
        status.angelOne = angelOneMarketData.getStatus();
    }

    return status;
}

module.exports = {
    initializeMarketData,
    startMarketData,
    stopMarketData,
    subscribeToSymbols,
    unsubscribeFromSymbols,
    onPriceUpdate,
    getPrice,
    getAllPrices,
    switchDataSource,
    getMarketDataStatus,
};
