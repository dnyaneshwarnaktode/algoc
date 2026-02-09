const Order = require('../models/Order');
const Holding = require('../models/Holding');
const Stock = require('../models/Stock');
const User = require('../models/User');
const { calculateCharges, calculatePnL } = require('../utils/calculateCharges');

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

        // BUY Order Logic
        const buyValue = price * quantity;
        const buyCharges = calculateCharges('BUY', price, quantity, stock.exchange || 'NSE', 'DELIVERY');
        const totalBuyCost = buyValue + buyCharges.totalCharges;

        // Check user's virtual balance
        const user = await User.findById(req.user.id);
        if (user.virtualBalance < totalBuyCost) {
            return res.status(400).json({
                success: false,
                message: `Insufficient balance. Required: ₹${totalBuyCost.toFixed(2)}, Available: ₹${user.virtualBalance.toFixed(2)}`
            });
        }

        // Deduct from virtual balance (including charges)
        user.virtualBalance -= totalBuyCost;
        await user.save();

        // Create order with charges - Store all values
        const order = await Order.create({
            user: req.user.id,
            stock: stock._id,
            symbol: symbol,
            type: 'BUY',
            quantity: quantity,
            price: price, // buy_price
            totalAmount: buyValue, // buy_value
            charges: buyCharges, // buy_charges
            segment: 'DELIVERY',
            status: 'COMPLETED'
        });

        // Update or create holding
        // Note: totalInvested includes charges for accurate cost basis
        let holding = await Holding.findOne({
            user: req.user.id,
            symbol: symbol
        });

        if (holding) {
            // Update existing holding
            const newTotalInvested = holding.totalInvested + totalBuyCost; // Include charges
            const newQuantity = holding.quantity + quantity;
            // Average buy price based on gross amounts (price * quantity), not including charges
            const previousGrossValue = holding.averageBuyPrice * holding.quantity;
            const newGrossValue = previousGrossValue + buyValue;
            const newAverageBuyPrice = newGrossValue / newQuantity;

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
                averageBuyPrice: price, // Gross price per share
                totalInvested: totalBuyCost // Total paid including charges
            });
        }

        res.status(201).json({
            success: true,
            message: `Successfully bought ${quantity} shares of ${symbol}`,
            data: {
                order,
                holding,
                remainingBalance: user.virtualBalance,
                buyValue: buyValue,
                buyCharges: buyCharges,
                totalBuyCost: totalBuyCost
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

        // SELL Order Logic
        const sellValue = price * quantity;
        const sellCharges = calculateCharges('SELL', price, quantity, stock.exchange || 'NSE', 'DELIVERY');
        const netSellValue = sellValue - sellCharges.totalCharges;

        // Get buy charges (estimate based on average buy price)
        const buyCharges = calculateCharges('BUY', holding.averageBuyPrice, quantity, stock.exchange || 'NSE', 'DELIVERY');

        // Calculate P&L including charges
        const pnlCalculation = calculatePnL(
            holding.averageBuyPrice,
            price,
            quantity,
            buyCharges,
            sellCharges,
            stock.exchange || 'NSE',
            'DELIVERY'
        );

        // Add to virtual balance (net amount after charges)
        const user = await User.findById(req.user.id);
        user.virtualBalance += netSellValue;
        await user.save();

        // Create order with charges - Store all values
        const order = await Order.create({
            user: req.user.id,
            stock: stock._id,
            symbol: symbol,
            type: 'SELL',
            quantity: quantity,
            price: price, // sell_price
            totalAmount: sellValue, // sell_value
            charges: sellCharges, // sell_charges
            segment: 'DELIVERY',
            status: 'COMPLETED',
            buyPrice: holding.averageBuyPrice,
            profitLoss: pnlCalculation.netPnL,
            profitLossPercent: pnlCalculation.netPnLPercent
        });

        // Update holding
        // Calculate proportional totalInvested to deduct (including charges)
        const proportionalInvested = (holding.totalInvested / holding.quantity) * quantity;
        holding.quantity -= quantity;
        holding.totalInvested -= proportionalInvested;

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
                profitLoss: pnlCalculation.netPnL,
                profitLossPercent: pnlCalculation.netPnLPercent,
                remainingBalance: user.virtualBalance,
                remainingShares: holding.quantity || 0,
                sellValue: sellValue,
                sellCharges: sellCharges,
                netSellValue: netSellValue,
                pnlBreakdown: pnlCalculation
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
        }).populate('stock', 'exchange');

        // Calculate realized P&L (already includes charges in order.profitLoss)
        let realizedPnL = 0;
        let totalBuyCharges = 0;
        let totalSellCharges = 0;
        let totalBuyValue = 0;
        let totalSellValue = 0;

        sellOrders.forEach(order => {
            realizedPnL += (order.profitLoss || 0);
            totalSellValue += (order.totalAmount || 0);
            totalSellCharges += (order.charges?.totalCharges || 0);
            
            // Estimate buy charges based on buy price
            if (order.buyPrice) {
                const buyValue = order.quantity * order.buyPrice;
                totalBuyValue += buyValue;
                const { calculateCharges } = require('../utils/calculateCharges');
                const buyCharges = calculateCharges(
                    'BUY',
                    order.buyPrice,
                    order.quantity,
                    order.stock?.exchange || 'NSE',
                    order.segment || 'DELIVERY'
                );
                totalBuyCharges += buyCharges.totalCharges;
            }
        });

        // Get holdings for unrealized P&L
        const holdings = await Holding.find({ user: req.user.id })
            .populate('stock', 'basePrice exchange');

        let unrealizedPnL = 0;
        let unrealizedBuyValue = 0;
        let unrealizedBuyCharges = 0;

        holdings.forEach(holding => {
            const currentPrice = holding.stock.basePrice || holding.averageBuyPrice;
            const currentValue = holding.quantity * currentPrice;
            // Unrealized P&L: current value - (total invested which includes charges)
            unrealizedPnL += (currentValue - holding.totalInvested);
            
            // Calculate estimated buy charges for unrealized positions
            const buyValue = holding.quantity * holding.averageBuyPrice;
            unrealizedBuyValue += buyValue;
            const { calculateCharges } = require('../utils/calculateCharges');
            const buyCharges = calculateCharges(
                'BUY',
                holding.averageBuyPrice,
                holding.quantity,
                holding.stock?.exchange || 'NSE',
                'DELIVERY'
            );
            unrealizedBuyCharges += buyCharges.totalCharges;
        });

        const totalPnL = realizedPnL + unrealizedPnL;
        const totalCharges = totalBuyCharges + totalSellCharges + unrealizedBuyCharges;
        const grossRealizedPnL = totalSellValue - totalBuyValue;
        const grossUnrealizedPnL = unrealizedPnL + unrealizedBuyCharges; // Add back charges to get gross

        res.status(200).json({
            success: true,
            data: {
                realizedPnL: Math.round(realizedPnL * 100) / 100,
                unrealizedPnL: Math.round(unrealizedPnL * 100) / 100,
                totalPnL: Math.round(totalPnL * 100) / 100,
                // Detailed breakdown
                breakdown: {
                    realized: {
                        buyValue: Math.round(totalBuyValue * 100) / 100,
                        sellValue: Math.round(totalSellValue * 100) / 100,
                        buyCharges: Math.round(totalBuyCharges * 100) / 100,
                        sellCharges: Math.round(totalSellCharges * 100) / 100,
                        totalCharges: Math.round((totalBuyCharges + totalSellCharges) * 100) / 100,
                        grossPnL: Math.round(grossRealizedPnL * 100) / 100,
                        netPnL: Math.round(realizedPnL * 100) / 100
                    },
                    unrealized: {
                        buyValue: Math.round(unrealizedBuyValue * 100) / 100,
                        buyCharges: Math.round(unrealizedBuyCharges * 100) / 100,
                        grossPnL: Math.round(grossUnrealizedPnL * 100) / 100,
                        netPnL: Math.round(unrealizedPnL * 100) / 100
                    },
                    total: {
                        totalCharges: Math.round(totalCharges * 100) / 100
                    }
                }
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
