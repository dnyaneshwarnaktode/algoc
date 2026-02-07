import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../services/api';
import websocketService from '../services/websocketService';

/**
 * Portfolio Page
 * Displays user's holdings with current values and P&L
 */
const Portfolio = () => {
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);
    const stocks = useSelector((state) => state.stock.stocks);

    const [portfolio, setPortfolio] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchPortfolio();
    }, []);

    // Update current values when stock prices change
    useEffect(() => {
        if (portfolio && stocks.length > 0) {
            updateCurrentValues();
        }

        // Subscribe to held symbols for live updates
        if (portfolio?.holdings?.length > 0) {
            const symbols = portfolio.holdings.map(h => h.symbol);
            websocketService.subscribe(symbols);
        }

        return () => {
            if (portfolio?.holdings?.length > 0) {
                const symbols = portfolio.holdings.map(h => h.symbol);
                websocketService.unsubscribe(symbols);
            }
        };
    }, [stocks, portfolio?.holdings?.length]);

    const fetchPortfolio = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/orders/portfolio');

            if (data.success) {
                setPortfolio(data.data);
            } else {
                setError(data.message || 'Failed to fetch portfolio');
            }
        } catch (err) {
            console.error('Fetch portfolio error:', err);
            setError(err.response?.data?.message || 'Failed to fetch portfolio');
        } finally {
            setLoading(false);
        }
    };

    const updateCurrentValues = () => {
        if (!portfolio) return;

        const updatedHoldings = portfolio.holdings.map((holding) => {
            const stockData = stocks.find((s) => s.symbol === holding.symbol);
            const currentPrice = stockData?.currentPrice || holding.currentPrice;
            const currentValue = holding.quantity * currentPrice;
            const profitLoss = currentValue - holding.totalInvested;
            const profitLossPercent = (profitLoss / holding.totalInvested) * 100;

            return {
                ...holding,
                currentPrice,
                currentValue,
                profitLoss,
                profitLossPercent,
            };
        });

        const totalInvested = updatedHoldings.reduce((sum, h) => sum + h.totalInvested, 0);
        const totalCurrentValue = updatedHoldings.reduce((sum, h) => sum + h.currentValue, 0);
        const totalProfitLoss = totalCurrentValue - totalInvested;
        const totalProfitLossPercent = totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0;

        setPortfolio({
            holdings: updatedHoldings,
            summary: {
                totalInvested,
                totalCurrentValue,
                totalProfitLoss,
                totalProfitLossPercent,
                holdingsCount: updatedHoldings.length,
            },
        });
    };

    const totalPortfolioValue = portfolio?.summary?.totalCurrentValue || 0;

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 p-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={() => navigate('/stocks')}
                        className="text-primary-600 dark:text-primary-400 hover:underline mb-2"
                    >
                        ← Back to Watchlist
                    </button>
                    <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
                        Portfolio
                    </h1>
                    <p className="text-neutral-600 dark:text-neutral-400 mt-1">
                        Your current holdings and performance
                    </p>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
                        <p className="mt-4 text-neutral-600 dark:text-neutral-400">
                            Loading portfolio...
                        </p>
                    </div>
                )}

                {/* Error State */}
                {error && !loading && (
                    <div className="card bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800">
                        <p className="text-danger-700 dark:text-danger-400">{error}</p>
                    </div>
                )}

                {/* Portfolio Content */}
                {!loading && !error && portfolio && (
                    <>
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                            {/* Total Portfolio Value */}
                            <div className="card bg-gradient-to-br from-primary-500 to-primary-600 text-white">
                                <p className="text-sm opacity-90 mb-1">Total Portfolio Value</p>
                                <p className="text-3xl font-bold">
                                    ₹{totalPortfolioValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                </p>
                            </div>

                            {/* Invested Amount */}
                            <div className="card">
                                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">
                                    Invested Amount
                                </p>
                                <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                                    ₹{portfolio.summary.totalInvested.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                </p>
                            </div>

                            {/* Current Value */}
                            <div className="card">
                                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">
                                    Current Value
                                </p>
                                <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                                    ₹{portfolio.summary.totalCurrentValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                </p>
                            </div>

                            {/* Total P&L */}
                            <div className={`card ${portfolio.summary.totalProfitLoss >= 0
                                ? 'bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800'
                                : 'bg-danger-50 dark:bg-danger-900/20 border-danger-200 dark:border-danger-800'
                                }`}>
                                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">
                                    Unrealized P&L
                                </p>
                                <p className={`text-2xl font-bold ${portfolio.summary.totalProfitLoss >= 0
                                    ? 'text-success-600 dark:text-success-400'
                                    : 'text-danger-600 dark:text-danger-400'
                                    }`}>
                                    {portfolio.summary.totalProfitLoss >= 0 ? '+' : ''}
                                    ₹{portfolio.summary.totalProfitLoss.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                </p>
                                <p className={`text-sm font-medium ${portfolio.summary.totalProfitLoss >= 0
                                    ? 'text-success-600 dark:text-success-400'
                                    : 'text-danger-600 dark:text-danger-400'
                                    }`}>
                                    {portfolio.summary.totalProfitLoss >= 0 ? '+' : ''}
                                    {portfolio.summary.totalProfitLossPercent.toFixed(2)}%
                                </p>
                            </div>
                        </div>

                        {/* Available Balance */}
                        <div className="card mb-6 bg-primary-50 dark:bg-primary-900/20">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-primary-700 dark:text-primary-400 mb-1">
                                        Available Balance
                                    </p>
                                    <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                                        ₹{user?.virtualBalance?.toLocaleString('en-IN')}
                                    </p>
                                </div>
                                <button
                                    onClick={() => navigate('/stocks')}
                                    className="btn-primary bg-primary-500 hover:bg-primary-600 text-white"
                                >
                                    Trade Stocks
                                </button>
                            </div>
                        </div>

                        {/* Holdings Table */}
                        {portfolio.holdings.length > 0 ? (
                            <div className="card overflow-hidden">
                                <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">
                                    Holdings ({portfolio.summary.holdingsCount})
                                </h2>

                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-neutral-100 dark:bg-neutral-700">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-300 uppercase">
                                                    Stock
                                                </th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-600 dark:text-neutral-300 uppercase">
                                                    Qty
                                                </th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-600 dark:text-neutral-300 uppercase">
                                                    Avg Buy Price
                                                </th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-600 dark:text-neutral-300 uppercase">
                                                    Current Price
                                                </th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-600 dark:text-neutral-300 uppercase">
                                                    Invested
                                                </th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-600 dark:text-neutral-300 uppercase">
                                                    Current Value
                                                </th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-600 dark:text-neutral-300 uppercase">
                                                    P&L
                                                </th>
                                                <th className="px-4 py-3 text-center text-xs font-semibold text-neutral-600 dark:text-neutral-300 uppercase">
                                                    Action
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                                            {portfolio.holdings.map((holding) => (
                                                <tr
                                                    key={holding._id}
                                                    className="hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                                                    onClick={() => navigate(`/stocks/${holding.symbol}`)}
                                                >
                                                    <td className="px-4 py-4">
                                                        <div>
                                                            <p className="font-semibold text-neutral-900 dark:text-white">
                                                                {holding.symbol}
                                                            </p>
                                                            <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                                                {holding.stock?.name}
                                                            </p>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 text-right font-medium text-neutral-900 dark:text-white">
                                                        {holding.quantity}
                                                    </td>
                                                    <td className="px-4 py-4 text-right text-neutral-900 dark:text-white">
                                                        ₹{holding.averageBuyPrice.toFixed(2)}
                                                    </td>
                                                    <td className="px-4 py-4 text-right text-neutral-900 dark:text-white">
                                                        ₹{holding.currentPrice.toFixed(2)}
                                                    </td>
                                                    <td className="px-4 py-4 text-right text-neutral-900 dark:text-white">
                                                        ₹{holding.totalInvested.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="px-4 py-4 text-right font-semibold text-neutral-900 dark:text-white">
                                                        ₹{holding.currentValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="px-4 py-4 text-right">
                                                        <div>
                                                            <p className={`font-bold ${holding.profitLoss >= 0
                                                                ? 'text-success-600 dark:text-success-400'
                                                                : 'text-danger-600 dark:text-danger-400'
                                                                }`}>
                                                                {holding.profitLoss >= 0 ? '+' : ''}
                                                                ₹{holding.profitLoss.toFixed(2)}
                                                            </p>
                                                            <p className={`text-sm font-medium ${holding.profitLoss >= 0
                                                                ? 'text-success-600 dark:text-success-400'
                                                                : 'text-danger-600 dark:text-danger-400'
                                                                }`}>
                                                                {holding.profitLoss >= 0 ? '+' : ''}
                                                                {holding.profitLossPercent.toFixed(2)}%
                                                            </p>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 text-center">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                navigate(`/order/sell/${holding.symbol}`, {
                                                                    state: {
                                                                        stock: holding.stock,
                                                                        currentPrice: holding.currentPrice,
                                                                    },
                                                                });
                                                            }}
                                                            className="px-3 py-1 text-sm font-medium bg-danger-100 dark:bg-danger-900/30 text-danger-700 dark:text-danger-400 rounded hover:bg-danger-200 dark:hover:bg-danger-900/50 transition-colors"
                                                        >
                                                            Sell
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <div className="card text-center py-12">
                                <p className="text-xl text-neutral-600 dark:text-neutral-400 mb-2">
                                    No holdings yet
                                </p>
                                <p className="text-sm text-neutral-500 dark:text-neutral-500 mb-4">
                                    Start trading to build your portfolio
                                </p>
                                <button
                                    onClick={() => navigate('/stocks')}
                                    className="btn-primary bg-primary-500 hover:bg-primary-600 text-white"
                                >
                                    Browse Stocks
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default Portfolio;
