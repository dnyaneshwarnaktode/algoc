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

const UserIcon = ({ size = 24, color = "currentColor" }) => {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M20.5899 22C20.5899 18.13 16.7399 15 11.9999 15C7.25991 15 3.40991 18.13 3.40991 22" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
};

const UserManagement = () => {
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);

    // State
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]);
    const [togglingUser, setTogglingUser] = useState(null);

    // Check admin access
    useEffect(() => {
        if (user?.role !== 'admin') {
            navigate('/stocks');
        }
    }, [user, navigate]);

    // Load initial data
    useEffect(() => {
        loadUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/admin/users');
            if (data.success) {
                setUsers(data.data);
            }
        } catch (error) {
            console.error('Error loading users:', error);
        }
        setLoading(false);
    };

    const handleToggleUser = async (userId, currentStatus) => {
        if (togglingUser) return;
        const action = currentStatus ? 'deactivate' : 'activate';
        if (!window.confirm(`Are you sure you want to ${action} this user?`)) return;

        setTogglingUser(userId);
        try {
            const { data } = await api.patch(`/admin/users/${userId}/toggle`);
            if (data.success) {
                // Update local state
                setUsers(users.map(u =>
                    u._id === userId ? { ...u, isActive: !u.isActive } : u
                ));
            } else {
                alert(`Failed to ${action} user: ${data.message}`);
            }
        } catch (error) {
            alert(`Error: ${error.response?.data?.message || error.message}`);
        }
        setTogglingUser(null);
    };

    const handleRefresh = () => {
        loadUsers();
    };

    if (loading && users.length === 0) {
        return (
            <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
                    <p className="mt-4 text-neutral-600 dark:text-neutral-400">
                        Loading users...
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
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => navigate('/admin/settings')}
                                className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                            >
                                ← Back
                            </button>
                            <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
                                User Management
                            </h1>
                        </div>
                        <p className="text-neutral-600 dark:text-neutral-400 mt-1 ml-12">
                            Manage registered users and their status
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

                {/* User List */}
                <div className="card mb-6">
                    <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                        <UserIcon size={24} color="currentColor" />
                        <span>Users ({users.length})</span>
                    </h2>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-neutral-200 dark:border-neutral-700">
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700 dark:text-neutral-300">Name</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700 dark:text-neutral-300">Email</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700 dark:text-neutral-300">Role</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700 dark:text-neutral-300">Balance</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700 dark:text-neutral-300">Status</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700 dark:text-neutral-300">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((u) => (
                                    <tr
                                        key={u._id}
                                        className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                                    >
                                        <td className="py-3 px-4 font-medium text-neutral-900 dark:text-white">{u.name}</td>
                                        <td className="py-3 px-4 text-neutral-600 dark:text-neutral-400">{u.email}</td>
                                        <td className="py-3 px-4 text-neutral-600 dark:text-neutral-400">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${u.role === 'admin'
                                                    ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                                                    : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400'
                                                }`}>
                                                {u.role.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-neutral-600 dark:text-neutral-400">₹{u.virtualBalance?.toLocaleString()}</td>
                                        <td className="py-3 px-4">
                                            <span className={`px-2 py-1 rounded text-xs font-semibold ${u.isActive
                                                    ? 'bg-success-100 dark:bg-success-900/20 text-success-700 dark:text-success-400'
                                                    : 'bg-danger-100 dark:bg-danger-900/20 text-danger-700 dark:text-danger-400'
                                                }`}>
                                                {u.isActive ? 'ACTIVE' : 'INACTIVE'}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            {u.role !== 'admin' && ( // Prevent toggling admin
                                                <button
                                                    onClick={() => handleToggleUser(u._id, u.isActive)}
                                                    disabled={togglingUser === u._id}
                                                    className={`px-3 py-1 rounded text-xs font-bold text-white transition-colors ${u.isActive
                                                            ? 'bg-danger-500 hover:bg-danger-600'
                                                            : 'bg-success-500 hover:bg-success-600'
                                                        }`}
                                                >
                                                    {togglingUser === u._id ? '...' : (u.isActive ? 'Deactivate' : 'Activate')}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserManagement;
