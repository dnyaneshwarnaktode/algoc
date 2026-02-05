const Order = require('../models/Order');
const Holding = require('../models/Holding');
const Stock = require('../models/Stock');
const User = require('../models/User');

/**
 * @desc    Place a BUY order
 * @route   POST /api/orders/buy
 * @access  Private
 */
exports.buyStock = async (req, res) => {
    try {
        const { symbol, quantity, price } = req.body;

        // Validate input
        if (!symbol || !quantity || !price) {
            return res.status(400).json({
                success: false,
                message: 'Please provide symbol, quantity, and price'
            });
        }

        if (quantity <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Quantity must be greater than 0'
            });
        }

        // Find stock
        const stock = await Stock.findOne({ symbol, isActive: true });
        if (!stock) {
            return res.status(404).json({
                success: false,
                message: 'Stock not found'
            });
        }

        // Calculate total amount
        const totalAmount = quantity * price;

        // Check user's virtual balance
        const user = await User.findById(req.user.id);
        if (user.virtualBalance < totalAmount) {
            return res.status(400).json({
                success: false,
                message: `Insufficient balance. Required: ₹${totalAmount.toFixed(2)}, Available: ₹${user.virtualBalance.toFixed(2)}`
            });
        }

        // Deduct from virtual balance
        user.virtualBalance -= totalAmount;
        await user.save();

        // Create order
        const order = await Order.create({
            user: req.user.id,
            stock: stock._id,
            symbol: symbol,
            type: 'BUY',
            quantity: quantity,
            price: price,
            totalAmount: totalAmount,
            status: 'COMPLETED'
        });

        // Update or create holding
        let holding = await Holding.findOne({
            user: req.user.id,
            symbol: symbol
        });

        if (holding) {
            // Update existing holding
            const newTotalInvested = holding.totalInvested + totalAmount;
            const newQuantity = holding.quantity + quantity;
            const newAverageBuyPrice = newTotalInvested / newQuantity;

            holding.quantity = newQuantity;
            holding.averageBuyPrice = newAverageBuyPrice;
            holding.totalInvested = newTotalInvested;
            await holding.save();
        } else {
            // Create new holding
            holding = await Holding.create({
                user: req.user.id,
                stock: stock._id,
                symbol: symbol,
                quantity: quantity,
                averageBuyPrice: price,
                totalInvested: totalAmount
            });
        }

        res.status(201).json({
            success: true,
            message: `Successfully bought ${quantity} shares of ${symbol}`,
            data: {
                order,
                holding,
                remainingBalance: user.virtualBalance
            }
        });

    } catch (error) {
        console.error('Buy order error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to place buy order',
            error: error.message
        });
    }
};

/**
 * @desc    Place a SELL order
 * @route   POST /api/orders/sell
 * @access  Private
 */
exports.sellStock = async (req, res) => {
    try {
        const { symbol, quantity, price } = req.body;

        // Validate input
        if (!symbol || !quantity || !price) {
            return res.status(400).json({
                success: false,
                message: 'Please provide symbol, quantity, and price'
            });
        }

        if (quantity <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Quantity must be greater than 0'
            });
        }

        // Find stock
        const stock = await Stock.findOne({ symbol, isActive: true });
        if (!stock) {
            return res.status(404).json({
                success: false,
                message: 'Stock not found'
            });
        }

        // Check if user has holding
        const holding = await Holding.findOne({
            user: req.user.id,
            symbol: symbol
        });

        if (!holding) {
            return res.status(400).json({
                success: false,
                message: `You don't own any shares of ${symbol}`
            });
        }

        if (holding.quantity < quantity) {
            return res.status(400).json({
                success: false,
                message: `Insufficient shares. You own ${holding.quantity} shares, trying to sell ${quantity}`
            });
        }

        // Calculate total amount and P&L
        const totalAmount = quantity * price;
        const buyValue = quantity * holding.averageBuyPrice;
        const profitLoss = totalAmount - buyValue;
        const profitLossPercent = (profitLoss / buyValue) * 100;

        // Add to virtual balance
        const user = await User.findById(req.user.id);
        user.virtualBalance += totalAmount;
        await user.save();

        // Create order
        const order = await Order.create({
            user: req.user.id,
            stock: stock._id,
            symbol: symbol,
            type: 'SELL',
            quantity: quantity,
            price: price,
            totalAmount: totalAmount,
            status: 'COMPLETED',
            buyPrice: holding.averageBuyPrice,
            profitLoss: profitLoss,
            profitLossPercent: profitLossPercent
        });

        // Update holding
        holding.quantity -= quantity;
        holding.totalInvested -= buyValue;

        if (holding.quantity === 0) {
            // Remove holding if all shares sold
            await Holding.deleteOne({ _id: holding._id });
        } else {
            // Update holding
            await holding.save();
        }

        res.status(201).json({
            success: true,
            message: `Successfully sold ${quantity} shares of ${symbol}`,
            data: {
                order,
                profitLoss: profitLoss,
                profitLossPercent: profitLossPercent,
                remainingBalance: user.virtualBalance,
                remainingShares: holding.quantity
            }
        });

    } catch (error) {
        console.error('Sell order error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to place sell order',
            error: error.message
        });
    }
};

/**
 * @desc    Get user's order history
 * @route   GET /api/orders
 * @access  Private
 */
exports.getOrders = async (req, res) => {
    try {
        const { type, symbol, limit = 50 } = req.query;

        const query = { user: req.user.id };

        if (type) {
            query.type = type.toUpperCase();
        }

        if (symbol) {
            query.symbol = symbol.toUpperCase();
        }

        const orders = await Order.find(query)
            .populate('stock', 'name sector exchange')
            .sort({ orderDate: -1 })
            .limit(parseInt(limit));

        res.status(200).json({
            success: true,
            count: orders.length,
            data: orders
        });

    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch orders',
            error: error.message
        });
    }
};

/**
 * @desc    Get user's portfolio (holdings)
 * @route   GET /api/orders/portfolio
 * @access  Private
 */
exports.getPortfolio = async (req, res) => {
    try {
        const holdings = await Holding.find({ user: req.user.id })
            .populate('stock', 'name sector exchange basePrice');

        // Calculate current values and P&L
        const portfolioData = holdings.map(holding => {
            const currentPrice = holding.stock.basePrice; // In real app, use live price
            const currentValue = holding.quantity * currentPrice;
            const profitLoss = currentValue - holding.totalInvested;
            const profitLossPercent = (profitLoss / holding.totalInvested) * 100;

            return {
                ...holding.toObject(),
                currentPrice,
                currentValue,
                profitLoss,
                profitLossPercent
            };
        });

        // Calculate totals
        const totalInvested = portfolioData.reduce((sum, h) => sum + h.totalInvested, 0);
        const totalCurrentValue = portfolioData.reduce((sum, h) => sum + h.currentValue, 0);
        const totalProfitLoss = totalCurrentValue - totalInvested;
        const totalProfitLossPercent = totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0;

        res.status(200).json({
            success: true,
            data: {
                holdings: portfolioData,
                summary: {
                    totalInvested,
                    totalCurrentValue,
                    totalProfitLoss,
                    totalProfitLossPercent,
                    holdingsCount: portfolioData.length
                }
            }
        });

    } catch (error) {
        console.error('Get portfolio error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch portfolio',
            error: error.message
        });
    }
};

/**
 * @desc    Get P&L summary
 * @route   GET /api/orders/pnl
 * @access  Private
 */
exports.getPnL = async (req, res) => {
    try {
        // Get all sell orders for realized P&L
        const sellOrders = await Order.find({
            user: req.user.id,
            type: 'SELL'
        });

        const realizedPnL = sellOrders.reduce((sum, order) => sum + (order.profitLoss || 0), 0);

        // Get holdings for unrealized P&L
        const holdings = await Holding.find({ user: req.user.id })
            .populate('stock', 'basePrice');

        let unrealizedPnL = 0;
        holdings.forEach(holding => {
            const currentPrice = holding.stock.basePrice;
            const currentValue = holding.quantity * currentPrice;
            unrealizedPnL += (currentValue - holding.totalInvested);
        });

        const totalPnL = realizedPnL + unrealizedPnL;

        res.status(200).json({
            success: true,
            data: {
                realizedPnL,
                unrealizedPnL,
                totalPnL
            }
        });

    } catch (error) {
        console.error('Get P&L error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch P&L',
            error: error.message
        });
    }
};

/**
 * @desc    Get specific holding by symbol
 * @route   GET /api/orders/holding/:symbol
 * @access  Private
 */
exports.getHoldingBySymbol = async (req, res) => {
    try {
        const { symbol } = req.params;

        const holding = await Holding.findOne({
            user: req.user.id,
            symbol: symbol
        });

        if (!holding) {
            return res.status(200).json({
                success: true,
                data: null
            });
        }

        res.status(200).json({
            success: true,
            data: holding
        });

    } catch (error) {
        console.error('Get holding error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch holding',
            error: error.message
        });
    }
};
