import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../services/api';

const UserIcon = ({ size = 24, color = "currentColor", className = "" }) => {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M20.5899 22C20.5899 18.13 16.7399 15 11.9999 15C7.25991 15 3.40991 18.13 3.40991 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
};

/**
 * Admin Settings Page
 * 
 * Manage Fyers integration and system settings
 * Admin-only access
 */
const AdminSettings = () => {
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);

    const [loading, setLoading] = useState(true);
    const [fyersStatus, setFyersStatus] = useState({ isAuthenticated: false, marketDataMode: 'SIMULATED' });
    const [activating, setActivating] = useState(false);

    // Check admin access
    useEffect(() => {
        if (user?.role !== 'admin') {
            navigate('/stocks');
        }
    }, [user, navigate]);

    useEffect(() => {
        loadStatus();
    }, []);

    const loadStatus = async () => {
        try {
            const { data } = await api.get('/fyers/status');
            if (data.success) {
                setFyersStatus(data.data);
            }
        } catch (error) {
            console.error('Error loading Fyers status:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFyersLogin = async () => {
        try {
            const { data } = await api.get('/fyers/login-url');
            if (data.success && data.data.loginUrl) {
                // Open Fyers login in a new window
                const width = 600;
                const height = 700;
                const left = window.screen.width / 2 - width / 2;
                const top = window.screen.height / 2 - height / 2;

                const loginWindow = window.open(
                    data.data.loginUrl,
                    'Fyers Login',
                    `width=${width},height=${height},left=${left},top=${top}`
                );

                // Poll for window close to refresh status
                const timer = setInterval(() => {
                    if (loginWindow.closed) {
                        clearInterval(timer);
                        loadStatus();
                    }
                }, 1000);
            }
        } catch (error) {
            alert('Failed to get Fyers Login URL. Check if FYERS_APP_ID is set in .env');
        }
    };

    const handleActivateFyers = async () => {
        if (activating) return;
        setActivating(true);
        try {
            const { data } = await api.post('/fyers/activate');
            if (data.success) {
                alert('Market data source switched to Fyers!');
                loadStatus();
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to activate Fyers');
        } finally {
            setActivating(false);
        }
    };

    const handleSwitchToSimulated = async () => {
        if (activating) return;
        setActivating(true);
        try {
            const { data } = await api.post('/fyers/deactivate');
            if (data.success) {
                alert('Market data source switched back to Simulated!');
                loadStatus();
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to switch to simulated');
        } finally {
            setActivating(false);
        }
    };

    const handleSyncStocks = async () => {
        if (activating) return; // Reuse activating state for loading
        setActivating(true);
        try {
            const { data } = await api.post('/stocks/sync-fyers');
            if (data.success) {
                alert(`Successfully synced ${data.data.total} stocks from Fyers!`);
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to sync stocks');
        } finally {
            setActivating(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 p-4 pb-20">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
                            Admin Settings
                        </h1>
                        <p className="text-neutral-600 dark:text-neutral-400 mt-1">
                            System configuration and broker integrations
                        </p>
                    </div>
                </div>

                {/* Quick Actions Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* User Management Link */}
                    <div
                        onClick={() => navigate('/admin/users')}
                        className="card hover:shadow-lg transition-all cursor-pointer group border-l-4 border-l-primary-500"
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-2 flex items-center gap-2">
                                    <UserIcon size={24} className="text-primary-500" />
                                    <span>User Management</span>
                                </h2>
                                <p className="text-neutral-600 dark:text-neutral-400 text-sm">
                                    Manage registered users, roles, and balances.
                                </p>
                            </div>
                            <div className="bg-primary-50 dark:bg-primary-900/20 p-2 rounded-full group-hover:bg-primary-100 dark:group-hover:bg-primary-900/40 transition-colors">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary-600 dark:text-primary-400">
                                    <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* System Health Summary */}
                    <div className="card border-l-4 border-l-success-500">
                        <div className="flex items-start justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-2 flex items-center gap-2">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-success-500" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="1.5" />
                                        <path d="M8 12L11 15L16 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    <span>System Health</span>
                                </h2>
                                <p className="text-neutral-600 dark:text-neutral-400 text-sm">
                                    All systems operational. Database connected.
                                </p>
                            </div>
                            <div className="bg-success-50 dark:bg-success-900/20 p-2 rounded-lg">
                                <span className="text-success-700 dark:text-success-400 font-bold text-sm">ONLINE</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Broker Integration Section */}
                <div className="card">
                    <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-6">
                        🦊 Fyers Integration
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
                            <p className="text-sm text-neutral-500 mb-1">Auth Status</p>
                            <div className="flex items-center gap-2">
                                <span className={`h-3 w-3 rounded-full ${fyersStatus.isAuthenticated ? 'bg-success-500' : 'bg-neutral-300'}`}></span>
                                <span className="font-bold text-neutral-900 dark:text-white">
                                    {fyersStatus.isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
                                </span>
                            </div>
                            <p className="text-xs text-neutral-400 mt-2">Tokens expire at 3:00 AM daily</p>
                        </div>

                        <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
                            <p className="text-sm text-neutral-500 mb-1">Data Source</p>
                            <p className="font-bold text-neutral-900 dark:text-white">
                                {fyersStatus.marketDataMode === 'FYERS' ? 'LIVE (FYERS)' : 'SIMULATED'}
                            </p>
                            <p className="text-xs text-neutral-400 mt-2">Current feed type in use</p>
                        </div>

                        <div className="flex flex-col gap-3 justify-center">
                            {!fyersStatus.isAuthenticated ? (
                                <button
                                    onClick={handleFyersLogin}
                                    className="btn-primary py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md transition-all font-semibold"
                                >
                                    Login to Fyers
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={handleActivateFyers}
                                        disabled={fyersStatus.marketDataMode === 'FYERS' || activating}
                                        className="btn-primary py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-neutral-400 text-white rounded-lg shadow-md transition-all font-semibold"
                                    >
                                        {fyersStatus.marketDataMode === 'FYERS' ? 'Fyers Feed Active' : 'Switch to Fyers Feed'}
                                    </button>
                                    <button
                                        onClick={handleSyncStocks}
                                        disabled={activating}
                                        className="btn-primary py-2.5 bg-neutral-600 hover:bg-neutral-700 disabled:bg-neutral-400 text-white rounded-lg shadow-md transition-all font-semibold"
                                    >
                                        {activating ? 'Syncing...' : 'Sync Stocks from Fyers'}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminSettings;
