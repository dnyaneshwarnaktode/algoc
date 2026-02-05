import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../services/api';

const RefreshIcon = ({ size = 24, color = "currentColor" }) => {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 22.75C6.07 22.75 1.25 17.93 1.25 12C1.25 6.07 6.07 1.25 12 1.25C17.93 1.25 22.75 6.07 22.75 12C22.75 17.93 17.93 22.75 12 22.75ZM12 2.75C6.9 2.75 2.75 6.9 2.75 12C2.75 17.1 6.9 21.25 12 21.25C17.1 21.25 21.25 17.1 21.25 12C21.25 6.9 17.1 2.75 12 2.75Z" fill={color} />
            <path d="M11.9999 17.4701C10.5999 17.4701 9.19994 16.9401 8.12994 15.8701C7.84994 15.5901 7.59993 15.2801 7.36993 14.9101C7.14993 14.5601 7.25992 14.1001 7.60992 13.8801C7.95992 13.6601 8.41995 13.7701 8.63995 14.1201C8.80995 14.4001 8.98994 14.6201 9.18994 14.8201C10.7399 16.3701 13.2599 16.3701 14.8099 14.8201C15.4099 14.2201 15.79 13.4401 15.92 12.5701C15.98 12.1601 16.3599 11.8601 16.7699 11.9301C17.1799 11.9901 17.4599 12.3701 17.4099 12.7801C17.2399 13.9701 16.7099 15.0401 15.8799 15.8801C14.7999 16.9401 13.3999 17.4701 11.9999 17.4701Z" fill={color} />
            <path d="M7.3399 12.08C7.2999 12.08 7.26991 12.08 7.22991 12.07C6.81991 12.01 6.5299 11.6299 6.5899 11.2199C6.7599 10.0299 7.2899 8.95996 8.1199 8.11996C10.2499 5.98996 13.7199 5.98996 15.8599 8.11996C16.1399 8.39996 16.3899 8.70999 16.6199 9.08999C16.8399 9.43999 16.7299 9.89996 16.3799 10.12C16.0299 10.34 15.5699 10.23 15.3499 9.87997C15.1799 9.60997 14.9999 9.37996 14.7999 9.17996C13.2499 7.62996 10.7299 7.62996 9.17989 9.17996C8.57989 9.77996 8.19991 10.56 8.06991 11.43C8.02991 11.81 7.7099 12.08 7.3399 12.08Z" fill={color} />
            <path d="M7.82031 17.9297C7.41031 17.9297 7.07031 17.5897 7.07031 17.1797V14.5098C7.07031 14.0998 7.41031 13.7598 7.82031 13.7598H10.4903C10.9003 13.7598 11.2403 14.0998 11.2403 14.5098C11.2403 14.9198 10.9003 15.2598 10.4903 15.2598H8.57031V17.1797C8.57031 17.5897 8.24031 17.9297 7.82031 17.9297Z" fill={color} />
            <path d="M16.1797 10.2403H13.5098C13.0998 10.2403 12.7598 9.9003 12.7598 9.4903C12.7598 9.0803 13.0998 8.7403 13.5098 8.7403H15.4297V6.82031C15.4297 6.41031 15.7697 6.07031 16.1797 6.07031C16.5897 6.07031 16.9297 6.41031 16.9297 6.82031V9.4903C16.9297 9.9103 16.5897 10.2403 16.1797 10.2403Z" fill={color} />
        </svg>
    );
};

const MarketStructureIcon = ({ size = 24, color = "currentColor" }) => {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g clipPath="url(#clip0_4418_7635)">
                <path d="M17.79 22.7402H6.21C3.47 22.7402 1.25 20.5102 1.25 17.7702V10.3602C1.25 9.00021 2.09 7.29021 3.17 6.45021L8.56 2.25021C10.18 0.990208 12.77 0.930208 14.45 2.11021L20.63 6.44021C21.82 7.27021 22.75 9.05021 22.75 10.5002V17.7802C22.75 20.5102 20.53 22.7402 17.79 22.7402ZM9.48 3.43021L4.09 7.63021C3.38 8.19021 2.75 9.46021 2.75 10.3602V17.7702C2.75 19.6802 4.3 21.2402 6.21 21.2402H17.79C19.7 21.2402 21.25 19.6902 21.25 17.7802V10.5002C21.25 9.54021 20.56 8.21021 19.77 7.67021L13.59 3.34021C12.45 2.54021 10.57 2.58021 9.48 3.43021Z" fill={color} />
                <path d="M16.5 17.2495C16.31 17.2495 16.12 17.1795 15.97 17.0295L12.42 13.4795L11.33 15.1195C11.21 15.3095 11 15.4295 10.78 15.4495C10.55 15.4695 10.33 15.3895 10.18 15.2295L6.97995 12.0295C6.68995 11.7395 6.68995 11.2595 6.97995 10.9695C7.26995 10.6795 7.74995 10.6795 8.03995 10.9695L10.59 13.5195L11.68 11.8795C11.8 11.6895 12.01 11.5695 12.23 11.5495C12.46 11.5295 12.68 11.6095 12.83 11.7695L17.03 15.9695C17.32 16.2595 17.32 16.7395 17.03 17.0295C16.88 17.1795 16.69 17.2495 16.5 17.2495Z" fill={color} />
                <path d="M16.5 17.25H14.5C14.09 17.25 13.75 16.91 13.75 16.5C13.75 16.09 14.09 15.75 14.5 15.75H15.75V14.5C15.75 14.09 16.09 13.75 16.5 13.75C16.91 13.75 17.25 14.09 17.25 14.5V16.5C17.25 16.91 16.91 17.25 16.5 17.25Z" fill={color} />
            </g>
            <defs>
                <clipPath id="clip0_4418_7635">
                    <rect width="24" height="24" fill="white" />
                </clipPath>
            </defs>
        </svg>
    );
};

const ConnectionIcon = ({ size = 24, color = "currentColor" }) => {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g clipPath="url(#clip0_4418_6523)">
                <path d="M9.5 3.25H14.5C18.35 3.25 21.5 6.4 21.5 10.25C21.5 14.1 18.35 17.25 14.5 17.25H3.5" stroke={color} strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                <path opacity="0.4" d="M3.16992 6.75H13.8099C15.8399 6.75 17.4999 8.41 17.4999 10.44C17.4999 12.47 15.8399 14.13 13.8099 14.13H7.99994" stroke={color} strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                <path opacity="0.4" d="M8.5 10.75H5.5" stroke={color} strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                <path opacity="0.4" d="M6.5 20.75H2.5" stroke={color} strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
            </g>
            <defs>
                <clipPath id="clip0_4418_6523">
                    <rect width="24" height="24" fill="white" />
                </clipPath>
            </defs>
        </svg>
    );
};

const UserIcon = ({ size = 24, color = "currentColor" }) => {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M20.5899 22C20.5899 18.13 16.7399 15 11.9999 15C7.25991 15 3.40991 18.13 3.40991 22" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
};

/**
 * Admin Settings Page
 * 
 * Manage Angel One integration and market data settings
 * Admin-only access
 */
const AdminSettings = () => {
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);

    // State
    const [loading, setLoading] = useState(true);
    const [angelOneStatus, setAngelOneStatus] = useState(null);
    const [marketDataStatus, setMarketDataStatus] = useState(null);
    const [symbolMappings, setSymbolMappings] = useState([]);
    const [switching, setSwitching] = useState(false);
    const [testing, setTesting] = useState(false);
    const [reconnecting, setReconnecting] = useState(false);

    // Check admin access
    useEffect(() => {
        if (user?.role !== 'admin') {
            navigate('/stocks');
        }
    }, [user, navigate]);

    // Load initial data
    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            await Promise.all([
                loadAngelOneStatus(),
                loadMarketDataStatus(),
                loadSymbolMappings(),
            ]);
        } catch (error) {
            console.error('Error loading data:', error);
        }
        setLoading(false);
    };

    const loadAngelOneStatus = async () => {
        try {
            const { data } = await api.get('/angelone/status');
            if (data.success) {
                setAngelOneStatus(data.data);
            }
        } catch (error) {
            console.error('Error loading Angel One status:', error);
        }
    };

    const loadMarketDataStatus = async () => {
        try {
            const { data } = await api.get('/angelone/marketdata/status');
            if (data.success) {
                setMarketDataStatus(data.data);
            }
        } catch (error) {
            console.error('Error loading market data status:', error);
        }
    };

    const loadSymbolMappings = async () => {
        try {
            const { data } = await api.get('/angelone/symbols');
            if (data.success) {
                setSymbolMappings(data.data.mappings || []);
            }
        } catch (error) {
            console.error('Error loading symbol mappings:', error);
        }
    };

    const handleSwitchDataSource = async (newSource) => {
        if (switching) return;

        const confirmed = window.confirm(
            `Switch market data source to ${newSource}?\n\nThis will affect all users.`
        );

        if (!confirmed) return;

        setSwitching(true);
        try {
            const { data } = await api.post('/angelone/marketdata/switch', {
                source: newSource,
            });

            if (data.success) {
                alert(`Successfully switched to ${newSource} data source`);
                await loadMarketDataStatus();
            } else {
                alert(`Failed to switch: ${data.message}`);
            }
        } catch (error) {
            alert(`Error: ${error.response?.data?.message || error.message}`);
        }
        setSwitching(false);
    };

    const handleTestConnection = async () => {
        if (testing) return;

        setTesting(true);
        try {
            const { data } = await api.post('/angelone/test');

            if (data.success) {
                alert(`Connection test successful!\n\nClient: ${data.data?.clientCode}\nName: ${data.data?.name}`);
            } else {
                alert(`Connection test failed:\n${data.message || data.error}`);
            }
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message;
            if (errorMsg.includes('disabled') || errorMsg.includes('not configured')) {
                alert(`⚠️ Angel One Not Configured\n\nAngel One integration is currently disabled.\n\nTo enable:\n1. Add credentials to backend/.env\n2. Set ANGEL_ENABLED=true\n3. Restart backend server`);
            } else {
                alert(`Error testing connection:\n${errorMsg}`);
            }
        }
        setTesting(false);
    };

    const handleReconnect = async () => {
        if (reconnecting) return;

        const confirmed = window.confirm('Reconnect to Angel One?\n\nThis will logout and login again.');

        if (!confirmed) return;

        setReconnecting(true);
        try {
            const { data } = await api.post('/angelone/reconnect');

            if (data.success) {
                alert('Successfully reconnected to Angel One');
                await loadAngelOneStatus();
            } else {
                alert(`Reconnection failed:\n${data.message || data.error}`);
            }
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message;
            if (errorMsg.includes('disabled') || errorMsg.includes('not configured')) {
                alert(`⚠️ Angel One Not Configured\n\nAngel One integration is currently disabled.\n\nTo enable:\n1. Add credentials to backend/.env\n2. Set ANGEL_ENABLED=true\n3. Restart backend server`);
            } else {
                alert(`Error reconnecting:\n${errorMsg}`);
            }
        }
        setReconnecting(false);
    };

    const handleRefresh = () => {
        loadData();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
                    <p className="mt-4 text-neutral-600 dark:text-neutral-400">
                        Loading settings...
                    </p>
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
                            Admin Settings
                        </h1>
                        <p className="text-neutral-600 dark:text-neutral-400 mt-1">
                            System configuration and user management
                        </p>
                    </div>
                    <button
                        onClick={handleRefresh}
                        className="btn-primary bg-primary-500 hover:bg-primary-600 text-white flex items-center gap-2"
                    >
                        <RefreshIcon size={20} color="currentColor" />
                        <span>Refresh</span>
                    </button>
                </div>

                {/* User Management Link */}
                <div className="card mb-6">
                    <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                        <UserIcon size={24} color="currentColor" />
                        <span>User Management</span>
                    </h2>

                    <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                        Manage registered users, user roles, and account status.
                    </p>

                    <button
                        onClick={() => navigate('/admin/users')}
                        className="btn-primary bg-primary-500 hover:bg-primary-600 text-white"
                    >
                        Manage Users →
                    </button>
                </div>

                {/* Market Data Source */}
                <div className="card mb-6">
                    <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                        <MarketStructureIcon size={24} color="currentColor" />
                        <span>Market Data Source</span>
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="p-4 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
                            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">
                                Current Source
                            </p>
                            <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                                {marketDataStatus?.dataSource || 'SIMULATED'}
                            </p>
                        </div>

                        <div className="p-4 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
                            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">
                                Angel One Status
                            </p>
                            <p className="text-2xl font-bold">
                                {marketDataStatus?.angelOneEnabled ? (
                                    <span className="text-success-600 dark:text-success-400">Enabled</span>
                                ) : (
                                    <span className="text-neutral-600 dark:text-neutral-400">Disabled</span>
                                )}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={() => handleSwitchDataSource('SIMULATED')}
                            disabled={switching || marketDataStatus?.dataSource === 'SIMULATED'}
                            className="flex-1 btn-primary bg-neutral-600 hover:bg-neutral-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {switching ? 'Switching...' : 'Use Simulated Data'}
                        </button>
                        <button
                            onClick={() => handleSwitchDataSource('ANGELONE')}
                            disabled={switching || marketDataStatus?.dataSource === 'ANGELONE' || !marketDataStatus?.angelOneEnabled}
                            className="flex-1 btn-primary bg-success-600 hover:bg-success-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {switching ? 'Switching...' : 'Use Angel One Data'}
                        </button>
                    </div>

                    {!marketDataStatus?.angelOneEnabled && (
                        <div className="mt-4 p-4 bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg">
                            <p className="text-sm text-warning-700 dark:text-warning-400">
                                ⚠️ Angel One is not configured. Add credentials to .env to enable live market data.
                            </p>
                        </div>
                    )}
                </div>

                {/* Angel One Connection */}
                <div className="card mb-6">
                    <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                        <ConnectionIcon size={24} color="currentColor" />
                        <span>Angel One Connection</span>
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="p-4 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
                            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">
                                Enabled
                            </p>
                            <p className="text-lg font-bold">
                                {angelOneStatus?.clientStatus?.enabled ? (
                                    <span className="text-success-600 dark:text-success-400">✓ Yes</span>
                                ) : (
                                    <span className="text-neutral-600 dark:text-neutral-400">✗ No</span>
                                )}
                            </p>
                        </div>

                        <div className="p-4 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
                            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">
                                Connected
                            </p>
                            <p className="text-lg font-bold">
                                {angelOneStatus?.clientStatus?.connected ? (
                                    <span className="text-success-600 dark:text-success-400">✓ Yes</span>
                                ) : (
                                    <span className="text-neutral-600 dark:text-neutral-400">✗ No</span>
                                )}
                            </p>
                        </div>

                        <div className="p-4 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
                            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">
                                Session Valid
                            </p>
                            <p className="text-lg font-bold">
                                {angelOneStatus?.clientStatus?.sessionValid ? (
                                    <span className="text-success-600 dark:text-success-400">✓ Yes</span>
                                ) : (
                                    <span className="text-danger-600 dark:text-danger-400">✗ No</span>
                                )}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={handleTestConnection}
                            disabled={testing || !angelOneStatus?.clientStatus?.enabled}
                            className="flex-1 btn-primary bg-primary-500 hover:bg-primary-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {testing ? 'Testing...' : '🧪 Test Connection'}
                        </button>
                        <button
                            onClick={handleReconnect}
                            disabled={reconnecting || !angelOneStatus?.clientStatus?.enabled}
                            className="flex-1 btn-primary bg-warning-500 hover:bg-warning-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {reconnecting ? 'Reconnecting...' : '🔄 Reconnect'}
                        </button>
                    </div>
                </div>

                {/* Symbol Mappings */}
                <div className="card">
                    <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">
                        🔗 Symbol Mappings ({symbolMappings.length})
                    </h2>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-neutral-200 dark:border-neutral-700">
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                                        Symbol
                                    </th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                                        Angel One Token
                                    </th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                                        Exchange
                                    </th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                                        Trading Symbol
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {symbolMappings.map((mapping) => (
                                    <tr
                                        key={mapping.symbol}
                                        className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                                    >
                                        <td className="py-3 px-4 font-medium text-neutral-900 dark:text-white">
                                            {mapping.symbol}
                                        </td>
                                        <td className="py-3 px-4 text-neutral-600 dark:text-neutral-400">
                                            {mapping.token}
                                        </td>
                                        <td className="py-3 px-4 text-neutral-600 dark:text-neutral-400">
                                            {mapping.exchange}
                                        </td>
                                        <td className="py-3 px-4 text-neutral-600 dark:text-neutral-400">
                                            {mapping.tradingSymbol}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {symbolMappings.length === 0 && (
                        <div className="text-center py-8 text-neutral-600 dark:text-neutral-400">
                            No symbol mappings found
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminSettings;
