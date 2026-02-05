const Stock = require('../models/Stock');

/**
 * @desc    Get all stocks with optional filters
 * @route   GET /api/stocks
 * @access  Private
 */
const getStocks = async (req, res) => {
    try {
        const { search, sector, exchange, limit = 50 } = req.query;

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

        const stocks = await Stock.find(query)
            .limit(parseInt(limit))
            .sort({ symbol: 1 });

        res.status(200).json({
            success: true,
            count: stocks.length,
            data: stocks,
        });
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

module.exports = {
    getStocks,
    getStockBySymbol,
    getSectors,
    addStock,
    updateStock,
    deleteStock,
};
