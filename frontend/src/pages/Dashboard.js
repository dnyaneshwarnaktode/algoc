import React from 'react';
import { useSelector } from 'react-redux';

const Dashboard = () => {
    const { user } = useSelector((state) => state.auth);

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 p-8">
            <div className="max-w-4xl mx-auto">
                <div className="card">
                    <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-4">
                        Welcome, {user?.name}! 👋
                    </h1>
                    <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                        Your paper trading dashboard
                    </p>

                    {/* Virtual Balance */}
                    <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg p-6 text-white mb-6">
                        <p className="text-sm opacity-90 mb-1">Virtual Balance</p>
                        <p className="text-4xl font-bold">
                            ₹{user?.virtualBalance?.toLocaleString('en-IN')}
                        </p>
                    </div>

                    {/* Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
                            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">
                                Email
                            </p>
                            <p className="font-medium text-neutral-900 dark:text-white">
                                {user?.email}
                            </p>
                        </div>
                        <div className="p-4 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
                            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">
                                Account Type
                            </p>
                            <p className="font-medium text-neutral-900 dark:text-white capitalize">
                                {user?.role}
                            </p>
                        </div>
                    </div>

                    {/* Phase Info */}
                    <div className="mt-6 p-4 bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 rounded-lg">
                        <p className="text-success-700 dark:text-success-400 text-sm">
                            ✅ <strong>Phase 1 Complete:</strong> Authentication is working! Stock watchlist and trading features coming in Phase 2.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
