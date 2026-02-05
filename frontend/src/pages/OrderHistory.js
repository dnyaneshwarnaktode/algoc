import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';

/**
 * Order History Page
 * Displays all past orders with filters
 */
const OrderHistory = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('ALL'); // ALL, BUY, SELL
    const [successMessage, setSuccessMessage] = useState(location.state?.message || null);

    useEffect(() => {
        fetchOrders();
    }, [filter]);

    useEffect(() => {
        // Clear success message after 5 seconds
        if (successMessage) {
            const timer = setTimeout(() => setSuccessMessage(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const params = filter !== 'ALL' ? `?type=${filter}` : '';
            const { data } = await api.get(`/orders${params}`);

            if (data.success) {
                setOrders(data.data);
            } else {
                setError(data.message || 'Failed to fetch orders');
            }
        } catch (err) {
            console.error('Fetch orders error:', err);
            setError(err.response?.data?.message || 'Failed to fetch orders');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 p-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={() => navigate('/stocks')}
                        className="text-primary-600 dark:text-primary-400 hover:underline mb-2"
                    >
                        ← Back to Watchlist
                    </button>
                    <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
                        Order History
                    </h1>
                    <p className="text-neutral-600 dark:text-neutral-400 mt-1">
                        View all your past orders
                    </p>
                </div>

                {/* Success Message */}
                {successMessage && (
                    <div className="mb-4 p-4 bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 rounded-lg">
                        <p className="text-success-700 dark:text-success-400">
                            ✓ {successMessage}
                        </p>
                    </div>
                )}

                {/* Filters */}
                <div className="card mb-6">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            Filter:
                        </span>
                        {['ALL', 'BUY', 'SELL'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${filter === f
                                        ? 'bg-primary-500 text-white'
                                        : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600'
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
                        <p className="mt-4 text-neutral-600 dark:text-neutral-400">
                            Loading orders...
                        </p>
                    </div>
                )}

                {/* Error State */}
                {error && !loading && (
                    <div className="card bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800">
                        <p className="text-danger-700 dark:text-danger-400">{error}</p>
                    </div>
                )}

                {/* Orders List */}
                {!loading && !error && orders.length > 0 && (
                    <div className="space-y-4">
                        {orders.map((order) => (
                            <div
                                key={order._id}
                                className="card hover:shadow-lg transition-shadow cursor-pointer"
                                onClick={() => navigate(`/stocks/${order.symbol}`)}
                            >
                                <div className="flex items-center justify-between">
                                    {/* Left Side - Stock Info */}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span
                                                className={`px-3 py-1 text-xs font-bold rounded ${order.type === 'BUY'
                                                        ? 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400'
                                                        : 'bg-danger-100 dark:bg-danger-900/30 text-danger-700 dark:text-danger-400'
                                                    }`}
                                            >
                                                {order.type}
                                            </span>
                                            <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                                                {order.symbol}
                                            </h3>
                                            <span className="text-sm text-neutral-600 dark:text-neutral-400">
                                                {order.stock?.name}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-4 text-sm text-neutral-600 dark:text-neutral-400">
                                            <span>
                                                Qty: <span className="font-medium text-neutral-900 dark:text-white">{order.quantity}</span>
                                            </span>
                                            <span>
                                                Price: <span className="font-medium text-neutral-900 dark:text-white">₹{order.price.toFixed(2)}</span>
                                            </span>
                                            <span>
                                                Total: <span className="font-medium text-neutral-900 dark:text-white">₹{order.totalAmount.toFixed(2)}</span>
                                            </span>
                                        </div>

                                        <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-2">
                                            {formatDate(order.orderDate)}
                                        </p>
                                    </div>

                                    {/* Right Side - P&L (for SELL orders) */}
                                    {order.type === 'SELL' && order.profitLoss !== undefined && (
                                        <div className="text-right">
                                            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">
                                                P&L
                                            </p>
                                            <p
                                                className={`text-xl font-bold ${order.profitLoss >= 0
                                                        ? 'text-success-600 dark:text-success-400'
                                                        : 'text-danger-600 dark:text-danger-400'
                                                    }`}
                                            >
                                                {order.profitLoss >= 0 ? '+' : ''}₹{order.profitLoss.toFixed(2)}
                                            </p>
                                            <p
                                                className={`text-sm font-medium ${order.profitLoss >= 0
                                                        ? 'text-success-600 dark:text-success-400'
                                                        : 'text-danger-600 dark:text-danger-400'
                                                    }`}
                                            >
                                                {order.profitLoss >= 0 ? '+' : ''}{order.profitLossPercent.toFixed(2)}%
                                            </p>
                                        </div>
                                    )}

                                    {/* Status Badge */}
                                    <div className="ml-4">
                                        <span
                                            className={`px-3 py-1 text-xs font-medium rounded-full ${order.status === 'COMPLETED'
                                                    ? 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400'
                                                    : order.status === 'PENDING'
                                                        ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                                                        : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
                                                }`}
                                        >
                                            {order.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* No Orders */}
                {!loading && !error && orders.length === 0 && (
                    <div className="card text-center py-12">
                        <p className="text-xl text-neutral-600 dark:text-neutral-400 mb-2">
                            No orders found
                        </p>
                        <p className="text-sm text-neutral-500 dark:text-neutral-500 mb-4">
                            {filter !== 'ALL' ? `No ${filter} orders yet` : 'Start trading to see your order history'}
                        </p>
                        <button
                            onClick={() => navigate('/stocks')}
                            className="btn-primary bg-primary-500 hover:bg-primary-600 text-white"
                        >
                            Browse Stocks
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrderHistory;
