const Stock = require('../models/Stock');
const fyersSymbolUtility = require('../utils/fyersSymbolUtility');
const marketDataService = require('../services/marketDataService');

/**
 * @desc    Get all stocks with optional filters
 * @route   GET /api/stocks
 * @access  Private
 */
const getStocks = async (req, res) => {
    try {
        const { search, sector, exchange, limit = 200, page = 1, liveOnly = 'true' } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Build query
        let query = { isActive: true };

        // Search by symbol or name
        if (search) {
            query.$or = [
                { symbol: { $regex: search, $options: 'i' } },
                { name: { $regex: search, $options: 'i' } },
            ];
        }

        // Filter by sector
        if (sector) {
            query.sector = sector;
        }

        // Filter by exchange
        if (exchange) {
            query.exchange = exchange;
        }

        // Get all matching stocks from DB
        const allStocks = await Stock.find(query).sort({ symbol: 1 });
        
        // Filter stocks with live prices from Fyers if liveOnly is true
        let stocksWithLivePrices = [];
        if (liveOnly === 'true' && marketDataService.getMode() === 'FYERS') {
            // Get all stocks that have non-zero prices in marketDataService cache
            for (const stock of allStocks) {
                const marketData = marketDataService.getMarketData(stock.symbol);
                if (marketData && marketData.ltp > 0) {
                    // Enrich stock with live price data
                    const enrichedStock = stock.toObject();
                    enrichedStock.currentPrice = marketData.ltp;
                    enrichedStock.basePrice = marketData.ltp; // Update basePrice with live price
                    const closePrice = marketData.close || marketData.ltp;
                    enrichedStock.change = marketData.ltp - closePrice;
                    enrichedStock.changePercent = closePrice > 0 
                        ? ((marketData.ltp - closePrice) / closePrice) * 100 
                        : 0;
                    enrichedStock.open = marketData.open;
                    enrichedStock.high = marketData.high;
                    enrichedStock.low = marketData.low;
                    enrichedStock.close = marketData.close;
                    enrichedStock.volume = marketData.volume;
                    enrichedStock.timestamp = marketData.timestamp;
                    stocksWithLivePrices.push(enrichedStock);
                }
            }
            
            // Apply pagination to filtered results
            const totalStocks = stocksWithLivePrices.length;
            const paginatedStocks = stocksWithLivePrices.slice(skip, skip + parseInt(limit));
            
            res.status(200).json({
                success: true,
                total: totalStocks,
                page: parseInt(page),
                limit: parseInt(limit),
                count: paginatedStocks.length,
                data: paginatedStocks,
                liveOnly: true,
            });
        } else {
            // Return all stocks without live price filtering
            const totalStocks = allStocks.length;
            const stocks = allStocks.slice(skip, skip + parseInt(limit));
            
            // Still enrich with live prices if available
            const enrichedStocks = stocks.map(stock => {
                const stockObj = stock.toObject();
                const marketData = marketDataService.getMarketData(stock.symbol);
                if (marketData && marketData.ltp > 0) {
                    const closePrice = marketData.close || marketData.ltp;
                    stockObj.currentPrice = marketData.ltp;
                    stockObj.change = marketData.ltp - closePrice;
                    stockObj.changePercent = closePrice > 0 
                        ? ((marketData.ltp - closePrice) / closePrice) * 100 
                        : 0;
                }
                return stockObj;
            });
            
            res.status(200).json({
                success: true,
                total: totalStocks,
                page: parseInt(page),
                limit: parseInt(limit),
                count: enrichedStocks.length,
                data: enrichedStocks,
                liveOnly: false,
            });
        }
    } catch (error) {
        console.error('Get stocks error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching stocks',
            error: error.message,
        });
    }
};

/**
 * @desc    Get single stock by symbol
 * @route   GET /api/stocks/:symbol
 * @access  Private
 */
const getStockBySymbol = async (req, res) => {
    try {
        const { symbol } = req.params;

        const stock = await Stock.findOne({
            symbol: symbol.toUpperCase(),
            isActive: true,
        });

        if (!stock) {
            return res.status(404).json({
                success: false,
                message: 'Stock not found',
            });
        }

        res.status(200).json({
            success: true,
            data: stock,
        });
    } catch (error) {
        console.error('Get stock error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching stock',
            error: error.message,
        });
    }
};

/**
 * @desc    Get all unique sectors
 * @route   GET /api/stocks/sectors/list
 * @access  Private
 */
const getSectors = async (req, res) => {
    try {
        const sectors = await Stock.distinct('sector', { isActive: true });

        res.status(200).json({
            success: true,
            data: sectors.filter(Boolean).sort(),
        });
    } catch (error) {
        console.error('Get sectors error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching sectors',
            error: error.message,
        });
    }
};

/**
 * @desc    Get market data status
 * @route   GET /api/stocks/market-status
 * @access  Private
 */
const getMarketDataStatus = async (req, res) => {
    try {
        const status = marketDataService.getStatus();

        res.status(200).json({
            success: true,
            data: status,
        });
    } catch (error) {
        console.error('Get market status error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching market data status',
            error: error.message,
        });
    }
};

/**
 * @desc    Add new stock (Admin only)
 * @route   POST /api/stocks
 * @access  Private/Admin
 */
const addStock = async (req, res) => {
    try {
        const stockData = req.body;

        // Check if stock already exists
        const existingStock = await Stock.findOne({ symbol: stockData.symbol });
        if (existingStock) {
            return res.status(400).json({
                success: false,
                message: 'Stock with this symbol already exists',
            });
        }

        const stock = await Stock.create(stockData);

        res.status(201).json({
            success: true,
            message: 'Stock added successfully',
            data: stock,
        });
    } catch (error) {
        console.error('Add stock error:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding stock',
            error: error.message,
        });
    }
};

/**
 * @desc    Update stock (Admin only)
 * @route   PUT /api/stocks/:symbol
 * @access  Private/Admin
 */
const updateStock = async (req, res) => {
    try {
        const { symbol } = req.params;
        const updateData = req.body;

        const stock = await Stock.findOneAndUpdate(
            { symbol: symbol.toUpperCase() },
            updateData,
            { new: true, runValidators: true }
        );

        if (!stock) {
            return res.status(404).json({
                success: false,
                message: 'Stock not found',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Stock updated successfully',
            data: stock,
        });
    } catch (error) {
        console.error('Update stock error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating stock',
            error: error.message,
        });
    }
};

/**
 * @desc    Delete stock (Admin only)
 * @route   DELETE /api/stocks/:symbol
 * @access  Private/Admin
 */
const deleteStock = async (req, res) => {
    try {
        const { symbol } = req.params;

        // Soft delete - set isActive to false
        const stock = await Stock.findOneAndUpdate(
            { symbol: symbol.toUpperCase() },
            { isActive: false },
            { new: true }
        );

        if (!stock) {
            return res.status(404).json({
                success: false,
                message: 'Stock not found',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Stock deleted successfully',
        });
    } catch (error) {
        console.error('Delete stock error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting stock',
            error: error.message,
        });
    }
};

/**
 * @desc    Sync all stocks from Fyers API
 * @route   POST /api/stocks/sync-fyers
 * @access  Private/Admin
 */
const syncFyersStocks = async (req, res) => {
    try {
        const result = await fyersSymbolUtility.syncAllStocks();
        res.status(200).json({
            success: true,
            message: `Synced ${result.total} stocks from Fyers`,
            data: result
        });
    } catch (error) {
        console.error('Sync fyers stocks error:', error);
        res.status(500).json({
            success: false,
            message: 'Error syncing stocks from Fyers',
            error: error.message,
        });
    }
};

module.exports = {
    getStocks,
    getStockBySymbol,
    getSectors,
    getMarketDataStatus,
    addStock,
    updateStock,
    deleteStock,
    syncFyersStocks,
};
