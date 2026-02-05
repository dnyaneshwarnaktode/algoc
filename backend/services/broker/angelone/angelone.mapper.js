/**
 * Angel One Symbol Mapper
 * 
 * Maps AlgoC stock symbols to Angel One tokens
 * Handles symbol format conversion and token management
 */

/**
 * Symbol mapping cache
 * Format: { 'RELIANCE': { token: '2885', exchange: 'NSE', tradingSymbol: 'RELIANCE-EQ' } }
 */
const symbolCache = new Map();

/**
 * Common NSE stocks with their Angel One tokens
 * This is a starter list - can be expanded
 */
const COMMON_STOCKS = {
    // Top NSE stocks
    'RELIANCE': { token: '2885', exchange: 'NSE', tradingSymbol: 'RELIANCE-EQ' },
    'TCS': { token: '11536', exchange: 'NSE', tradingSymbol: 'TCS-EQ' },
    'HDFCBANK': { token: '1333', exchange: 'NSE', tradingSymbol: 'HDFCBANK-EQ' },
    'INFY': { token: '1594', exchange: 'NSE', tradingSymbol: 'INFY-EQ' },
    'ICICIBANK': { token: '4963', exchange: 'NSE', tradingSymbol: 'ICICIBANK-EQ' },
    'HINDUNILVR': { token: '1394', exchange: 'NSE', tradingSymbol: 'HINDUNILVR-EQ' },
    'ITC': { token: '1660', exchange: 'NSE', tradingSymbol: 'ITC-EQ' },
    'SBIN': { token: '3045', exchange: 'NSE', tradingSymbol: 'SBIN-EQ' },
    'BHARTIARTL': { token: '10604', exchange: 'NSE', tradingSymbol: 'BHARTIARTL-EQ' },
    'KOTAKBANK': { token: '1922', exchange: 'NSE', tradingSymbol: 'KOTAKBANK-EQ' },
    'LT': { token: '11483', exchange: 'NSE', tradingSymbol: 'LT-EQ' },
    'AXISBANK': { token: '5900', exchange: 'NSE', tradingSymbol: 'AXISBANK-EQ' },
    'ASIANPAINT': { token: '3718', exchange: 'NSE', tradingSymbol: 'ASIANPAINT-EQ' },
    'MARUTI': { token: '10999', exchange: 'NSE', tradingSymbol: 'MARUTI-EQ' },
    'TITAN': { token: '3506', exchange: 'NSE', tradingSymbol: 'TITAN-EQ' },
    'SUNPHARMA': { token: '3351', exchange: 'NSE', tradingSymbol: 'SUNPHARMA-EQ' },
    'WIPRO': { token: '3787', exchange: 'NSE', tradingSymbol: 'WIPRO-EQ' },
    'ULTRACEMCO': { token: '11532', exchange: 'NSE', tradingSymbol: 'ULTRACEMCO-EQ' },
    'NESTLEIND': { token: '17963', exchange: 'NSE', tradingSymbol: 'NESTLEIND-EQ' },
    'TATAMOTORS': { token: '3456', exchange: 'NSE', tradingSymbol: 'TATAMOTORS-EQ' },
};

/**
 * Initialize symbol cache
 */
function initializeCache() {
    symbolCache.clear();

    // Load common stocks into cache
    Object.entries(COMMON_STOCKS).forEach(([symbol, data]) => {
        symbolCache.set(symbol, data);
    });

    console.log(`[AngelOne Mapper] Initialized with ${symbolCache.size} symbols`);
}

/**
 * Get Angel One token for a symbol
 */
function getToken(symbol) {
    const upperSymbol = symbol.toUpperCase();
    const mapping = symbolCache.get(upperSymbol);

    if (!mapping) {
        console.warn(`[AngelOne Mapper] No mapping found for symbol: ${symbol}`);
        return null;
    }

    return mapping.token;
}

/**
 * Get trading symbol for Angel One
 */
function getTradingSymbol(symbol) {
    const upperSymbol = symbol.toUpperCase();
    const mapping = symbolCache.get(upperSymbol);

    if (!mapping) {
        return null;
    }

    return mapping.tradingSymbol;
}

/**
 * Get exchange for a symbol
 */
function getExchange(symbol) {
    const upperSymbol = symbol.toUpperCase();
    const mapping = symbolCache.get(upperSymbol);

    if (!mapping) {
        return 'NSE'; // Default to NSE
    }

    return mapping.exchange;
}

/**
 * Get full mapping for a symbol
 */
function getMapping(symbol) {
    const upperSymbol = symbol.toUpperCase();
    return symbolCache.get(upperSymbol) || null;
}

/**
 * Check if symbol is mapped
 */
function isMapped(symbol) {
    const upperSymbol = symbol.toUpperCase();
    return symbolCache.has(upperSymbol);
}

/**
 * Add custom symbol mapping
 */
function addMapping(symbol, token, exchange = 'NSE', tradingSymbol = null) {
    const upperSymbol = symbol.toUpperCase();
    const mapping = {
        token,
        exchange,
        tradingSymbol: tradingSymbol || `${upperSymbol}-EQ`,
    };

    symbolCache.set(upperSymbol, mapping);
    console.log(`[AngelOne Mapper] Added mapping: ${upperSymbol} -> ${token}`);

    return mapping;
}

/**
 * Load mappings from database stocks
 */
async function loadFromDatabase() {
    try {
        const Stock = require('../../models/Stock');

        // Get all active stocks
        const stocks = await Stock.find({ isActive: true }).select('symbol exchange');

        let mappedCount = 0;

        stocks.forEach(stock => {
            const upperSymbol = stock.symbol.toUpperCase();

            // Only add if we have a predefined mapping
            if (COMMON_STOCKS[upperSymbol]) {
                if (!symbolCache.has(upperSymbol)) {
                    symbolCache.set(upperSymbol, COMMON_STOCKS[upperSymbol]);
                    mappedCount++;
                }
            }
        });

        console.log(`[AngelOne Mapper] Loaded ${mappedCount} mappings from database`);
        console.log(`[AngelOne Mapper] Total mapped symbols: ${symbolCache.size}`);

        return { success: true, count: mappedCount };
    } catch (error) {
        console.error('[AngelOne Mapper] Failed to load from database:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Get all mapped symbols
 */
function getAllMappings() {
    return Array.from(symbolCache.entries()).map(([symbol, data]) => ({
        symbol,
        ...data,
    }));
}

/**
 * Get subscription list for Angel One WebSocket
 * Format: [{ exchangeType: 1, tokens: ['2885', '11536'] }]
 */
function getSubscriptionList(symbols) {
    const tokens = [];

    symbols.forEach(symbol => {
        const token = getToken(symbol);
        if (token) {
            tokens.push(token);
        }
    });

    if (tokens.length === 0) {
        return [];
    }

    // Angel One format: exchangeType 1 = NSE, 2 = BSE
    return [
        {
            exchangeType: 1, // NSE
            tokens: tokens,
        },
    ];
}

/**
 * Get symbol from token (reverse lookup)
 */
function getSymbolFromToken(token) {
    for (const [symbol, data] of symbolCache.entries()) {
        if (data.token === token) {
            return symbol;
        }
    }
    return null;
}

/**
 * Get statistics
 */
function getStats() {
    return {
        totalMapped: symbolCache.size,
        symbols: Array.from(symbolCache.keys()),
    };
}

// Initialize cache on module load
initializeCache();

module.exports = {
    getToken,
    getTradingSymbol,
    getExchange,
    getMapping,
    isMapped,
    addMapping,
    loadFromDatabase,
    getAllMappings,
    getSubscriptionList,
    getSymbolFromToken,
    getStats,
    initializeCache,
};
