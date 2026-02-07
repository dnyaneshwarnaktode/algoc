import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchStockBySymbol } from '../services/stockService';
import TradingChart from '../components/TradingChart';
import api from '../services/api';
import websocketService from '../services/websocketService';

const SmartAnalysis = () => {
    const { symbol } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [stock, setStock] = useState(null);
    const [holding, setHolding] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const { user } = useSelector((state) => state.auth);

    // Get live price from Redux store
    const reduxStock = useSelector((state) =>
        state.stock.stocks.find(s => s.symbol === symbol) || state.stock.selectedStock
    );

    const currentPrice = reduxStock?.currentPrice || stock?.basePrice || 0;
    const change = reduxStock?.change || 0;
    const changePercent = reduxStock?.changePercent || 0;
    const isPositive = change >= 0;

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            const result = await dispatch(fetchStockBySymbol(symbol));

            if (result.success) {
                setStock(result.data);
                setError(null);

                try {
                    const { data } = await api.get(`/orders/holding/${symbol}`);
                    if (data.success) {
                        setHolding(data.data);
                    }
                } catch (err) {
                    console.error('Failed to fetch holding:', err);
                }
            } else {
                setError(result.message || 'Failed to load stock');
            }
            setLoading(false);
        };

        loadData();

        // Subscribe to live updates
        if (symbol) {
            websocketService.subscribe(symbol);
        }

        return () => {
            if (symbol) {
                websocketService.unsubscribe(symbol);
            }
        };
    }, [symbol, dispatch]);

    const handleBuy = () => {
        navigate(`/order/buy/${symbol}`, { state: { stock, currentPrice } });
    };

    const handleSell = () => {
        if (holding && holding.quantity > 0) {
            navigate(`/order/sell/${symbol}`, { state: { stock, currentPrice } });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
                    <p className="mt-4 text-neutral-600 dark:text-neutral-400">
                        Loading stock details...
                    </p>
                </div>
            </div>
        );
    }

    if (error || !stock) {
        return (
            <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center p-4">
                <div className="card max-w-md w-full bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800">
                    <h2 className="text-xl font-bold text-danger-700 dark:text-danger-400 mb-2">
                        Stock Not Found
                    </h2>
                    <p className="text-danger-600 dark:text-danger-300 mb-4">
                        {error || 'The requested stock could not be found.'}
                    </p>
                    <button
                        onClick={() => navigate('/stocks')}
                        className="btn-primary bg-primary-500 hover:bg-primary-600 text-white"
                    >
                        Back to Watchlist
                    </button>
                </div>
            </div>
        );
    }

    const canSell = holding && holding.quantity > 0;

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 pb-24">
            {/* Header */}
            <div className="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        {/* Back Button & Stock Info */}
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/stocks')}
                                className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                            >
                                ← Back
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
                                    {stock.symbol}
                                </h1>
                                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                    {stock.name}
                                </p>
                            </div>
                        </div>

                        {/* Price Info */}
                        <div className="text-right">
                            <p className="text-3xl font-bold text-neutral-900 dark:text-white">
                                ₹{parseFloat(currentPrice).toFixed(2)}
                            </p>
                            <p
                                className={`text-sm font-semibold ${isPositive
                                    ? 'text-success-600 dark:text-success-400'
                                    : 'text-danger-600 dark:text-danger-400'
                                    }`}
                            >
                                {isPositive ? '+' : ''}
                                {parseFloat(change).toFixed(2)} ({isPositive ? '+' : ''}
                                {parseFloat(changePercent).toFixed(2)}%)
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Chart Section */}
                    <div className="lg:col-span-2">
                        <div className="card">
                            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
                                Price Chart
                            </h2>
                            <TradingChart
                                symbol={stock.symbol}
                                currentPrice={currentPrice}
                                basePrice={stock.basePrice}
                            />
                        </div>
                    </div>

                    {/* Stock Info Section */}
                    <div className="lg:col-span-1">
                        <div className="card">
                            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
                                Stock Information
                            </h2>

                            <div className="space-y-3">
                                <div className="flex justify-between py-2 border-b border-neutral-200 dark:border-neutral-700">
                                    <span className="text-sm text-neutral-600 dark:text-neutral-400">
                                        Exchange
                                    </span>
                                    <span className="text-sm font-medium text-neutral-900 dark:text-white">
                                        {stock.exchange}
                                    </span>
                                </div>

                                <div className="flex justify-between py-2 border-b border-neutral-200 dark:border-neutral-700">
                                    <span className="text-sm text-neutral-600 dark:text-neutral-400">
                                        Sector
                                    </span>
                                    <span className="text-sm font-medium text-neutral-900 dark:text-white">
                                        {stock.sector}
                                    </span>
                                </div>

                                <div className="flex justify-between py-2 border-b border-neutral-200 dark:border-neutral-700">
                                    <span className="text-sm text-neutral-600 dark:text-neutral-400">
                                        Industry
                                    </span>
                                    <span className="text-sm font-medium text-neutral-900 dark:text-white">
                                        {stock.industry}
                                    </span>
                                </div>

                                <div className="flex justify-between py-2 border-b border-neutral-200 dark:border-neutral-700">
                                    <span className="text-sm text-neutral-600 dark:text-neutral-400">
                                        Market Cap
                                    </span>
                                    <span className="text-sm font-medium text-neutral-900 dark:text-white">
                                        ₹{stock.marketCap?.toLocaleString('en-IN')} Cr
                                    </span>
                                </div>

                                <div className="flex justify-between py-2 border-b border-neutral-200 dark:border-neutral-700">
                                    <span className="text-sm text-neutral-600 dark:text-neutral-400">
                                        52W High
                                    </span>
                                    <span className="text-sm font-medium text-success-600 dark:text-success-400">
                                        ₹{stock.high52Week?.toFixed(2)}
                                    </span>
                                </div>

                                <div className="flex justify-between py-2">
                                    <span className="text-sm text-neutral-600 dark:text-neutral-400">
                                        52W Low
                                    </span>
                                    <span className="text-sm font-medium text-danger-600 dark:text-danger-400">
                                        ₹{stock.low52Week?.toFixed(2)}
                                    </span>
                                </div>
                            </div>

                            {/* Holdings Info (New) */}
                            {holding && holding.quantity > 0 && (
                                <div className="mt-6 p-4 bg-success-50 dark:bg-success-900/20 rounded-lg border border-success-200 dark:border-success-800">
                                    <p className="text-xs text-success-700 dark:text-success-400 mb-1">
                                        Your Holdings
                                    </p>
                                    <div className="flex justify-between items-end">
                                        <p className="text-xl font-bold text-success-600 dark:text-success-400">
                                            {holding.quantity} Shares
                                        </p>
                                        <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                                            Avg: ₹{holding.averageBuyPrice.toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Virtual Balance */}
                            <div className="mt-4 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                                <p className="text-xs text-primary-700 dark:text-primary-400 mb-1">
                                    Your Virtual Balance
                                </p>
                                <p className="text-xl font-bold text-primary-600 dark:text-primary-400">
                                    ₹{user?.virtualBalance?.toLocaleString('en-IN')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Fixed Bottom Buy/Sell Buttons */}
            <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700 p-4 z-20">
                <div className="max-w-7xl mx-auto flex flex-col gap-2">
                    <div className="flex gap-4">
                        <button
                            onClick={handleBuy}
                            className="flex-1 btn-buy py-4 text-lg font-semibold"
                        >
                            BUY
                        </button>
                        <div className="flex-1 relative group">
                            <button
                                onClick={handleSell}
                                disabled={!canSell}
                                className={`w-full h-full py-4 text-lg font-semibold rounded-lg transition-all duration-200 ${canSell
                                    ? 'btn-sell'
                                    : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-400 dark:text-neutral-500 cursor-not-allowed'
                                    }`}
                            >
                                SELL
                            </button>
                            {!canSell && (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-full max-w-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                    <div className="bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs px-3 py-2 rounded shadow-lg text-center">
                                        You can sell this stock only after buying it.
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-neutral-900 dark:border-t-white"></div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SmartAnalysis;
