import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStrategies, toggleStrategy, deleteStrategy } from '../services/strategyService';

const StrategiesPage = () => {
    const navigate = useNavigate();
    // Removed unused user selector

    const [strategies, setStrategies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, active, inactive

    const loadStrategies = useCallback(async () => {
        setLoading(true);
        try {
            const filters = {};
            if (filter === 'active') filters.isActive = true;
            if (filter === 'inactive') filters.isActive = false;

            const response = await getStrategies(filters);
            if (response.success) {
                setStrategies(response.data);
            }
        } catch (error) {
            console.error('Failed to load strategies:', error);
        }
        setLoading(false);
    }, [filter]);

    useEffect(() => {
        loadStrategies();
    }, [loadStrategies]);

    const handleToggle = async (strategyId) => {
        try {
            const response = await toggleStrategy(strategyId);
            if (response.success) {
                loadStrategies();
            }
        } catch (error) {
            alert('Failed to toggle strategy: ' + error.message);
        }
    };

    const handleDelete = async (strategyId, strategyName) => {
        if (!window.confirm(`Delete strategy "${strategyName}"?`)) return;

        try {
            const response = await deleteStrategy(strategyId);
            if (response.success) {
                loadStrategies();
            }
        } catch (error) {
            alert('Failed to delete strategy: ' + error.message);
        }
    };

    const [testModal, setTestModal] = useState({
        isOpen: false,
        strategy: null,
        action: 'BUY',
        price: '',
        quantity: 1
    });

    const openTestModal = (strategy) => {
        setTestModal({
            isOpen: true,
            strategy: strategy,
            action: 'BUY',
            price: '', // Will fetch LTP effectively if left empty, but for now user inputs
            quantity: 1
        });
    };

    const handleTestSignal = async (e) => {
        e.preventDefault();
        if (!testModal.strategy) return;

        try {
            const payload = {
                symbol: testModal.strategy.symbol,
                action: testModal.action,
                quantity: parseInt(testModal.quantity),
                price: parseFloat(testModal.price) || 2500, // Default price if empty
                strategy: testModal.strategy.name,
                secret: testModal.strategy.webhookSecret,
                timestamp: new Date().toISOString()
            };

            const response = await import('../services/strategyService').then(m => m.sendTestSignal(payload));

            if (response.success) {
                alert(`✅ Signal Sent Successfully!\n\nExecution Price: ₹${response.data.executionPrice}\nP&L: ₹${response.data.profitLoss}`);
                setTestModal({ ...testModal, isOpen: false });
                loadStrategies(); // Refresh stats
            }
        } catch (error) {
            alert('❌ Signal Failed: ' + (error.message || 'Unknown error'));
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
                    <p className="mt-4 text-neutral-600 dark:text-neutral-400">Loading strategies...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 p-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
                            Trading Strategies
                        </h1>
                        <p className="text-neutral-600 dark:text-neutral-400 mt-1">
                            Manage your automated trading strategies
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/strategies/create')}
                        className="btn-primary bg-primary-500 hover:bg-primary-600 text-white"
                    >
                        + Create Strategy
                    </button>
                </div>

                {/* Filter Tabs */}
                <div className="mb-6 flex gap-2">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'all'
                            ? 'bg-primary-500 text-white'
                            : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                            }`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setFilter('active')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'active'
                            ? 'bg-success-500 text-white'
                            : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                            }`}
                    >
                        Active
                    </button>
                    <button
                        onClick={() => setFilter('inactive')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'inactive'
                            ? 'bg-neutral-500 text-white'
                            : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                            }`}
                    >
                        Inactive
                    </button>
                </div>

                {/* Strategies Grid */}
                {strategies.length === 0 ? (
                    <div className="card text-center py-12">
                        <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                            No strategies found
                        </p>
                        <button
                            onClick={() => navigate('/strategies/create')}
                            className="btn-primary bg-primary-500 hover:bg-primary-600 text-white"
                        >
                            Create Your First Strategy
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {strategies.map((strategy) => (
                            <div
                                key={strategy._id}
                                className="card hover:shadow-lg transition-shadow cursor-pointer relative"
                                onClick={() => navigate(`/strategies/${strategy._id}`)}
                            >
                                {/* Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                                            {strategy.name}
                                        </h3>
                                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                            {strategy.symbol} • {strategy.timeframe}
                                        </p>
                                    </div>
                                    <span
                                        className={`px-2 py-1 rounded text-xs font-semibold ${strategy.isActive
                                            ? 'bg-success-100 dark:bg-success-900/20 text-success-700 dark:text-success-400'
                                            : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400'
                                            }`}
                                    >
                                        {strategy.isActive ? 'ACTIVE' : 'INACTIVE'}
                                    </span>
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <div className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded">
                                        <p className="text-xs text-neutral-600 dark:text-neutral-400">Capital</p>
                                        <p className="text-sm font-bold text-neutral-900 dark:text-white">
                                            ₹{strategy.capitalAllocated.toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded">
                                        <p className="text-xs text-neutral-600 dark:text-neutral-400">Trades</p>
                                        <p className="text-sm font-bold text-neutral-900 dark:text-white">
                                            {strategy.totalTrades}
                                        </p>
                                    </div>
                                    <div className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded">
                                        <p className="text-xs text-neutral-600 dark:text-neutral-400">Win Rate</p>
                                        <p className="text-sm font-bold text-success-600 dark:text-success-400">
                                            {strategy.winRate.toFixed(1)}%
                                        </p>
                                    </div>
                                    <div className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded">
                                        <p className="text-xs text-neutral-600 dark:text-neutral-400">Mode</p>
                                        <p className="text-sm font-bold text-neutral-900 dark:text-white">
                                            {strategy.mode}
                                        </p>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            openTestModal(strategy);
                                        }}
                                        className="flex-1 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded font-medium text-sm"
                                    >
                                        ⚡ Test Signal
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleToggle(strategy._id);
                                        }}
                                        className={`px-3 py-2 rounded font-medium text-sm ${strategy.isActive
                                            ? 'bg-warning-500 hover:bg-warning-600 text-white'
                                            : 'bg-success-500 hover:bg-success-600 text-white'
                                            }`}
                                    >
                                        {strategy.isActive ? 'Stop' : 'Start'}
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(strategy._id, strategy.name);
                                        }}
                                        className="px-3 py-2 bg-danger-500 hover:bg-danger-600 text-white rounded font-medium text-sm"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Test Signal Modal */}
                {testModal.isOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                            <div className="p-6 border-b border-neutral-200 dark:border-neutral-700 flex justify-between items-center">
                                <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
                                    ⚡ Test Strategy Signal
                                </h3>
                                <button
                                    onClick={() => setTestModal({ ...testModal, isOpen: false })}
                                    className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                                >
                                    ✕
                                </button>
                            </div>

                            <form onSubmit={handleTestSignal} className="p-6 space-y-4">
                                <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg text-sm text-primary-800 dark:text-primary-200 mb-4">
                                    Simulate a TradingView webhook signal for <strong>{testModal.strategy?.name}</strong> ({testModal.strategy?.symbol})
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                        Action
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setTestModal({ ...testModal, action: 'BUY' })}
                                            className={`py-2 rounded-lg font-bold ${testModal.action === 'BUY'
                                                ? 'bg-success-500 text-white'
                                                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                                                }`}
                                        >
                                            BUY
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setTestModal({ ...testModal, action: 'SELL' })}
                                            className={`py-2 rounded-lg font-bold ${testModal.action === 'SELL'
                                                ? 'bg-danger-500 text-white'
                                                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                                                }`}
                                        >
                                            SELL
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                            Price (₹)
                                        </label>
                                        <input
                                            type="number"
                                            value={testModal.price}
                                            onChange={(e) => setTestModal({ ...testModal, price: e.target.value })}
                                            className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                                            placeholder="Market Price"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                            Quantity
                                        </label>
                                        <input
                                            type="number"
                                            value={testModal.quantity}
                                            onChange={(e) => setTestModal({ ...testModal, quantity: e.target.value })}
                                            className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                                            min="1"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-bold shadow-lg shadow-primary-500/30 mt-4"
                                >
                                    🚀 Fire Signal
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StrategiesPage;
