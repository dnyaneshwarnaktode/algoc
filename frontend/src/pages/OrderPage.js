import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../services/api';
import websocketService from '../services/websocketService';
import { calculateCharges } from '../utils/calculateCharges';

/**
 * Order Page
 * Handles buy/sell order placement
 */
const OrderPage = () => {
    const { type, symbol } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    const { stock, currentPrice: initialPrice } = location.state || {};
    const { user } = useSelector((state) => state.auth);

    // Get live price from Redux store for this symbol
    const reduxStock = useSelector((state) =>
        state.stock.stocks.find(s => s.symbol === symbol) || state.stock.selectedStock
    );

    const livePrice = reduxStock?.currentPrice || initialPrice;

    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const isBuy = type === 'buy';
    
    // Calculate order values with charges
    const orderCalculation = useMemo(() => {
        if (!livePrice || quantity < 1) return null;
        
        const price = livePrice;
        // Get exchange from stock or reduxStock, default to NSE
        const exchange = (stock?.exchange || reduxStock?.exchange) ? (stock?.exchange || reduxStock?.exchange) : 'NSE';
        
        if (isBuy) {
            // BUY Order Logic
            const buyValue = price * quantity;
            const buyCharges = calculateCharges('BUY', price, quantity, exchange, 'DELIVERY');
            const totalBuyCost = buyValue + buyCharges.totalCharges;
            
            return {
                value: buyValue,
                charges: buyCharges,
                totalCost: totalBuyCost,
                netAmount: totalBuyCost
            };
        } else {
            // SELL Order Logic
            const sellValue = price * quantity;
            const sellCharges = calculateCharges('SELL', price, quantity, exchange, 'DELIVERY');
            const netSellValue = sellValue - sellCharges.totalCharges;
            
            return {
                value: sellValue,
                charges: sellCharges,
                totalCost: sellValue,
                netAmount: netSellValue
            };
        }
    }, [livePrice, quantity, isBuy, stock]);

    useEffect(() => {
        if (!stock || !livePrice) {
            setError('Missing stock information. Please go back and try again.');
        }

        // Subscribe to live price updates for this symbol
        if (symbol) {
            websocketService.subscribe([symbol]);
        }

        return () => {
            // Unsubscribe when leaving the page
            if (symbol) {
                websocketService.unsubscribe([symbol]);
            }
        };
    }, [stock, livePrice, symbol]);

    const handleQuantityChange = (e) => {
        const value = parseInt(e.target.value) || 0;
        setQuantity(Math.max(1, value));
        setError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Validate
            if (quantity < 1) {
                setError('Quantity must be at least 1');
                setLoading(false);
                return;
            }

            if (isBuy && orderCalculation && orderCalculation.totalCost > user.virtualBalance) {
                setError(`Insufficient balance. Required: ₹${orderCalculation.totalCost.toFixed(2)}, Available: ₹${user.virtualBalance.toFixed(2)}`);
                setLoading(false);
                return;
            }

            // Place order
            const endpoint = isBuy ? '/orders/buy' : '/orders/sell';
            const { data } = await api.post(endpoint, {
                symbol: symbol,
                quantity: quantity,
                price: livePrice
            });

            if (data.success) {
                // Success - navigate to order history
                navigate('/orders/history', {
                    state: {
                        message: data.message,
                        order: data.data.order
                    }
                });
            } else {
                setError(data.message || 'Failed to place order');
            }

        } catch (err) {
            console.error('Order error:', err);
            setError(err.response?.data?.message || 'Failed to place order. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!stock || !livePrice) {
        return (
            <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center p-4">
                <div className="card max-w-md w-full bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800">
                    <h2 className="text-xl font-bold text-danger-700 dark:text-danger-400 mb-2">
                        Invalid Order
                    </h2>
                    <p className="text-danger-600 dark:text-danger-300 mb-4">
                        {error || 'Missing stock information'}
                    </p>
                    <button
                        onClick={() => navigate('/stocks')}
                        className="btn-primary bg-primary-500 hover:bg-primary-600 text-white w-full"
                    >
                        Back to Watchlist
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 p-4">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={() => navigate(`/stocks/${symbol}`)}
                        className="text-primary-600 dark:text-primary-400 hover:underline mb-2"
                    >
                        ← Back to Analysis
                    </button>
                    <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
                        {isBuy ? 'Buy' : 'Sell'} Order
                    </h1>
                    <p className="text-neutral-600 dark:text-neutral-400 mt-1">
                        {stock.name} ({symbol})
                    </p>
                </div>

                {/* Order Form */}
                <div className="card">
                    <form onSubmit={handleSubmit}>
                        {/* Stock Info */}
                        <div className="mb-6 p-4 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-neutral-600 dark:text-neutral-400">
                                    Current Price
                                </span>
                                <span className="text-xl font-bold text-neutral-900 dark:text-white">
                                    ₹{livePrice.toFixed(2)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-neutral-600 dark:text-neutral-400">
                                    Your Balance
                                </span>
                                <span className="text-lg font-semibold text-primary-600 dark:text-primary-400">
                                    ₹{user?.virtualBalance?.toLocaleString('en-IN')}
                                </span>
                            </div>
                        </div>

                        {/* Quantity Input */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                Quantity
                            </label>
                            <input
                                type="number"
                                min="1"
                                value={quantity}
                                onChange={handleQuantityChange}
                                className="input-field text-lg"
                                placeholder="Enter quantity"
                                required
                            />
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                                Minimum: 1 share
                            </p>
                        </div>

                        {/* Order Summary */}
                        <div className="mb-6 p-4 border-2 border-neutral-200 dark:border-neutral-600 rounded-lg">
                            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-3">
                                Order Summary
                            </h3>

                            {orderCalculation ? (
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-neutral-600 dark:text-neutral-400">
                                            Quantity
                                        </span>
                                        <span className="font-medium text-neutral-900 dark:text-white">
                                            {quantity} {quantity === 1 ? 'share' : 'shares'}
                                        </span>
                                    </div>

                                    <div className="flex justify-between">
                                        <span className="text-neutral-600 dark:text-neutral-400">
                                            Price per share
                                        </span>
                                        <span className="font-medium text-neutral-900 dark:text-white">
                                            ₹{livePrice.toFixed(2)}
                                        </span>
                                    </div>

                                    <div className="flex justify-between">
                                        <span className="text-neutral-600 dark:text-neutral-400">
                                            {isBuy ? 'Buy Value' : 'Sell Value'}
                                        </span>
                                        <span className="font-medium text-neutral-900 dark:text-white">
                                            ₹{orderCalculation.value.toFixed(2)}
                                        </span>
                                    </div>

                                    {/* Charges Breakdown */}
                                    <div className="pt-2 mt-2 border-t border-neutral-200 dark:border-neutral-600">
                                        <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                            Charges & Taxes:
                                        </p>
                                        <div className="space-y-1 text-sm">
                                            {orderCalculation.charges.stt > 0 && (
                                                <div className="flex justify-between">
                                                    <span className="text-neutral-500 dark:text-neutral-400">STT</span>
                                                    <span className="text-neutral-700 dark:text-neutral-300">₹{orderCalculation.charges.stt.toFixed(2)}</span>
                                                </div>
                                            )}
                                            {orderCalculation.charges.exchangeTransactionCharge > 0 && (
                                                <div className="flex justify-between">
                                                    <span className="text-neutral-500 dark:text-neutral-400">Exchange Charges</span>
                                                    <span className="text-neutral-700 dark:text-neutral-300">₹{orderCalculation.charges.exchangeTransactionCharge.toFixed(2)}</span>
                                                </div>
                                            )}
                                            {orderCalculation.charges.sebiCharges > 0 && (
                                                <div className="flex justify-between">
                                                    <span className="text-neutral-500 dark:text-neutral-400">SEBI Charges</span>
                                                    <span className="text-neutral-700 dark:text-neutral-300">₹{orderCalculation.charges.sebiCharges.toFixed(2)}</span>
                                                </div>
                                            )}
                                            {orderCalculation.charges.stampDuty > 0 && (
                                                <div className="flex justify-between">
                                                    <span className="text-neutral-500 dark:text-neutral-400">Stamp Duty</span>
                                                    <span className="text-neutral-700 dark:text-neutral-300">₹{orderCalculation.charges.stampDuty.toFixed(2)}</span>
                                                </div>
                                            )}
                                            {orderCalculation.charges.gst > 0 && (
                                                <div className="flex justify-between">
                                                    <span className="text-neutral-500 dark:text-neutral-400">GST</span>
                                                    <span className="text-neutral-700 dark:text-neutral-300">₹{orderCalculation.charges.gst.toFixed(2)}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between pt-1 border-t border-neutral-200 dark:border-neutral-600 mt-1">
                                                <span className="font-medium text-neutral-700 dark:text-neutral-300">Total Charges</span>
                                                <span className="font-medium text-neutral-900 dark:text-white">₹{orderCalculation.charges.totalCharges.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border-t border-neutral-200 dark:border-neutral-600 pt-2 mt-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-lg font-semibold text-neutral-900 dark:text-white">
                                                {isBuy ? 'Total Cost' : 'Net Amount'}
                                            </span>
                                            <span className={`text-2xl font-bold ${isBuy ? 'text-danger-600 dark:text-danger-400' : 'text-success-600 dark:text-success-400'
                                                }`}>
                                                {isBuy ? '-' : '+'}₹{orderCalculation.netAmount.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>

                                    {isBuy && (
                                        <div className="flex justify-between text-sm pt-2">
                                            <span className="text-neutral-600 dark:text-neutral-400">
                                                Balance after order
                                            </span>
                                            <span className={`font-medium ${(user?.virtualBalance - orderCalculation.netAmount) < 0
                                                ? 'text-danger-600 dark:text-danger-400'
                                                : 'text-neutral-900 dark:text-white'
                                                }`}>
                                                ₹{(user?.virtualBalance - orderCalculation.netAmount).toFixed(2)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p className="text-neutral-500 dark:text-neutral-400">Calculating...</p>
                            )}
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="mb-4 p-3 bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 rounded-lg">
                                <p className="text-sm text-danger-700 dark:text-danger-400">
                                    {error}
                                </p>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading || !!error}
                            className={`w-full py-4 text-lg font-semibold rounded-lg transition-all duration-200 ${isBuy
                                ? 'btn-buy'
                                : 'btn-sell'
                                } ${loading || error ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                    Placing Order...
                                </span>
                            ) : (
                                `Confirm ${isBuy ? 'BUY' : 'SELL'} Order`
                            )}
                        </button>
                    </form>

                    {/* Disclaimer */}
                    <div className="mt-4 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                        <p className="text-xs text-primary-700 dark:text-primary-400">
                            💡 This is paper trading with virtual money. No real money is involved.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderPage;
