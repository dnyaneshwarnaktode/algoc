import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

/**
 * Profit & Loss Page
 * Displays realized and unrealized P&L
 */
const ProfitLoss = () => {
    const navigate = useNavigate();

    const [pnlData, setPNLData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchPnL();
    }, []);

    const fetchPnL = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/orders/pnl');

            if (data.success) {
                setPNLData(data.data);
            } else {
                setError(data.message || 'Failed to fetch P&L');
            }
        } catch (err) {
            console.error('Fetch P&L error:', err);
            setError(err.response?.data?.message || 'Failed to fetch P&L');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 p-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={() => navigate('/stocks')}
                        className="text-primary-600 dark:text-primary-400 hover:underline mb-2"
                    >
                        ← Back to Watchlist
                    </button>
                    <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
                        Profit & Loss
                    </h1>
                    <p className="text-neutral-600 dark:text-neutral-400 mt-1">
                        Your trading performance summary
                    </p>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
                        <p className="mt-4 text-neutral-600 dark:text-neutral-400">
                            Loading P&L...
                        </p>
                    </div>
                )}

                {/* Error State */}
                {error && !loading && (
                    <div className="card bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800">
                        <p className="text-danger-700 dark:text-danger-400">{error}</p>
                    </div>
                )}

                {/* P&L Content */}
                {!loading && !error && pnlData && (
                    <>
                        {/* Total P&L Card */}
                        <div className={`card mb-6 ${pnlData.totalPnL >= 0
                            ? 'bg-gradient-to-br from-success-500 to-success-600'
                            : 'bg-gradient-to-br from-danger-500 to-danger-600'
                            } text-white`}>
                            <p className="text-sm opacity-90 mb-2">Total Profit & Loss</p>
                            <p className="text-5xl font-bold mb-2">
                                {pnlData.totalPnL >= 0 ? '+' : ''}
                                ₹{Math.abs(pnlData.totalPnL).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                            </p>
                            <p className="text-sm opacity-90">
                                {pnlData.totalPnL >= 0 ? '📈 Profit' : '📉 Loss'}
                            </p>
                        </div>

                        {/* Realized vs Unrealized */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            {/* Realized P&L */}
                            <div className="card">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                                        Realized P&L
                                    </h2>
                                    <span className="px-3 py-1 text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-full">
                                        Closed Positions
                                    </span>
                                </div>

                                <p className={`text-3xl font-bold mb-2 ${pnlData.realizedPnL >= 0
                                    ? 'text-success-600 dark:text-success-400'
                                    : 'text-danger-600 dark:text-danger-400'
                                    }`}>
                                    {pnlData.realizedPnL >= 0 ? '+' : ''}
                                    ₹{pnlData.realizedPnL.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                </p>

                                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                    Profit/loss from completed trades
                                </p>

                                <button
                                    onClick={() => navigate('/orders/history')}
                                    className="mt-4 w-full btn-primary bg-neutral-100 dark:bg-neutral-700 text-neutral-900 dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-600"
                                >
                                    View Order History
                                </button>
                            </div>

                            {/* Unrealized P&L */}
                            <div className="card">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                                        Unrealized P&L
                                    </h2>
                                    <span className="px-3 py-1 text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-full">
                                        Open Positions
                                    </span>
                                </div>

                                <p className={`text-3xl font-bold mb-2 ${pnlData.unrealizedPnL >= 0
                                    ? 'text-success-600 dark:text-success-400'
                                    : 'text-danger-600 dark:text-danger-400'
                                    }`}>
                                    {pnlData.unrealizedPnL >= 0 ? '+' : ''}
                                    ₹{pnlData.unrealizedPnL.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                </p>

                                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                    Profit/loss from current holdings
                                </p>

                                <button
                                    onClick={() => navigate('/portfolio')}
                                    className="mt-4 w-full btn-primary bg-neutral-100 dark:bg-neutral-700 text-neutral-900 dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-600"
                                >
                                    View Portfolio
                                </button>
                            </div>
                        </div>

                        {/* Info Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Realized Info */}
                            <div className="card bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800">
                                <p className="text-xs font-medium text-success-700 dark:text-success-400 mb-1">
                                    💰 REALIZED P&L
                                </p>
                                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                    Money you've actually made or lost from selling stocks
                                </p>
                            </div>

                            {/* Unrealized Info */}
                            <div className="card bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800">
                                <p className="text-xs font-medium text-primary-700 dark:text-primary-400 mb-1">
                                    📊 UNREALIZED P&L
                                </p>
                                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                    Potential profit/loss based on current stock prices
                                </p>
                            </div>

                            {/* Total Info */}
                            <div className="card bg-neutral-100 dark:bg-neutral-700">
                                <p className="text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    📈 TOTAL P&L
                                </p>
                                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                    Combined realized and unrealized profit/loss
                                </p>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="card mt-6 bg-primary-50 dark:bg-primary-900/20">
                            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
                                Quick Actions
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <button
                                    onClick={() => navigate('/stocks')}
                                    className="btn-primary bg-primary-500 hover:bg-primary-600 text-white"
                                >
                                    Browse Stocks
                                </button>
                                <button
                                    onClick={() => navigate('/portfolio')}
                                    className="btn-primary bg-neutral-100 dark:bg-neutral-700 text-neutral-900 dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-600"
                                >
                                    View Portfolio
                                </button>
                                <button
                                    onClick={() => navigate('/orders/history')}
                                    className="btn-primary bg-neutral-100 dark:bg-neutral-700 text-neutral-900 dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-600"
                                >
                                    Order History
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ProfitLoss;
