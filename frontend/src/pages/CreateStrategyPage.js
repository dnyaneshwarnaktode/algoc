import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createStrategy } from '../services/strategyService';

const CreateStrategyPage = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: '',
        symbol: '',
        timeframe: '5m',
        mode: 'PAPER',
        capitalAllocated: 10000,
        maxTradesPerDay: 10,
        maxLossPerDay: 5000,
        maxCapitalPerTrade: 10000,
        cooldownBetweenTrades: 60,
        description: ''
    });

    const [loading, setLoading] = useState(false);
    const [webhookSecret, setWebhookSecret] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await createStrategy(formData);

            if (response.success) {
                setWebhookSecret(response.data.webhookSecret);
                alert('Strategy created successfully!');
                // Don't navigate immediately, show webhook secret first
            }
        } catch (error) {
            alert('Failed to create strategy: ' + (error.message || 'Unknown error'));
        }

        setLoading(false);
    };

    if (webhookSecret) {
        return (
            <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 p-4 flex items-center justify-center">
                <div className="card max-w-2xl w-full">
                    <h2 className="text-2xl font-bold text-success-600 dark:text-success-400 mb-4">
                        ✅ Strategy Created Successfully!
                    </h2>

                    <div className="mb-6">
                        <p className="text-neutral-700 dark:text-neutral-300 mb-4">
                            Your strategy has been created. Here is your unique webhook secret:
                        </p>

                        <div className="p-4 bg-neutral-100 dark:bg-neutral-800 rounded-lg border border-neutral-300 dark:border-neutral-700">
                            <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-2">Webhook Secret</p>
                            <code className="text-sm font-mono text-primary-600 dark:text-primary-400 break-all">
                                {webhookSecret}
                            </code>
                        </div>

                        <p className="text-sm text-warning-600 dark:text-warning-400 mt-4">
                            ⚠️ Save this secret securely. You'll need it to configure your TradingView webhook.
                        </p>
                    </div>

                    <div className="mb-6 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                        <h3 className="font-semibold text-neutral-900 dark:text-white mb-2">
                            TradingView Webhook URL:
                        </h3>
                        <code className="text-sm font-mono text-neutral-700 dark:text-neutral-300 break-all">
                            {window.location.origin.replace('3000', '5000')}/api/webhook/tradingview
                        </code>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={() => navigate('/strategies')}
                            className="flex-1 btn-primary bg-primary-500 hover:bg-primary-600 text-white"
                        >
                            View All Strategies
                        </button>
                        <button
                            onClick={() => window.location.reload()}
                            className="flex-1 btn-primary bg-neutral-500 hover:bg-neutral-600 text-white"
                        >
                            Create Another
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 p-4">
            <div className="max-w-3xl mx-auto">
                <div className="mb-6">
                    <button
                        onClick={() => navigate('/strategies')}
                        className="text-primary-600 dark:text-primary-400 hover:underline mb-4"
                    >
                        ← Back to Strategies
                    </button>
                    <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
                        Create New Strategy
                    </h1>
                    <p className="text-neutral-600 dark:text-neutral-400 mt-1">
                        Configure your automated trading strategy
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="card">
                    {/* Basic Info */}
                    <div className="mb-6">
                        <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-4">
                            Basic Information
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                    Strategy Name *
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                                    placeholder="e.g., EMA Crossover Strategy"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                        Symbol *
                                    </label>
                                    <input
                                        type="text"
                                        name="symbol"
                                        value={formData.symbol}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white uppercase"
                                        placeholder="e.g., RELIANCE"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                        Timeframe *
                                    </label>
                                    <select
                                        name="timeframe"
                                        value={formData.timeframe}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                                    >
                                        <option value="1m">1 Minute</option>
                                        <option value="3m">3 Minutes</option>
                                        <option value="5m">5 Minutes</option>
                                        <option value="15m">15 Minutes</option>
                                        <option value="30m">30 Minutes</option>
                                        <option value="1h">1 Hour</option>
                                        <option value="4h">4 Hours</option>
                                        <option value="1d">1 Day</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                    Mode *
                                </label>
                                <select
                                    name="mode"
                                    value={formData.mode}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                                >
                                    <option value="PAPER">Paper Trading</option>
                                    <option value="LIVE" disabled>Live Trading (Coming Soon)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                    Description
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows="3"
                                    className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                                    placeholder="Describe your strategy..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Capital & Risk Management */}
                    <div className="mb-6">
                        <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-4">
                            Capital & Risk Management
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                    Capital Allocated (₹) *
                                </label>
                                <input
                                    type="number"
                                    name="capitalAllocated"
                                    value={formData.capitalAllocated}
                                    onChange={handleChange}
                                    required
                                    min="100"
                                    className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                        Max Trades Per Day
                                    </label>
                                    <input
                                        type="number"
                                        name="maxTradesPerDay"
                                        value={formData.maxTradesPerDay}
                                        onChange={handleChange}
                                        min="1"
                                        className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                        Max Loss Per Day (₹)
                                    </label>
                                    <input
                                        type="number"
                                        name="maxLossPerDay"
                                        value={formData.maxLossPerDay}
                                        onChange={handleChange}
                                        min="100"
                                        className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                        Max Capital Per Trade (₹)
                                    </label>
                                    <input
                                        type="number"
                                        name="maxCapitalPerTrade"
                                        value={formData.maxCapitalPerTrade}
                                        onChange={handleChange}
                                        min="100"
                                        className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                        Cooldown Between Trades (seconds)
                                    </label>
                                    <input
                                        type="number"
                                        name="cooldownBetweenTrades"
                                        value={formData.cooldownBetweenTrades}
                                        onChange={handleChange}
                                        min="0"
                                        className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Submit */}
                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={() => navigate('/strategies')}
                            className="flex-1 btn-primary bg-neutral-500 hover:bg-neutral-600 text-white"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 btn-primary bg-primary-500 hover:bg-primary-600 text-white disabled:opacity-50"
                        >
                            {loading ? 'Creating...' : 'Create Strategy'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateStrategyPage;
