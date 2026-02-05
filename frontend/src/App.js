import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from './redux/store';

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import StocksWatchlist from './pages/StocksWatchlist';
import SmartAnalysis from './pages/SmartAnalysis';
import OrderPage from './pages/OrderPage';
import OrderHistory from './pages/OrderHistory';
import Portfolio from './pages/Portfolio';
import ProfitLoss from './pages/ProfitLoss';
import AdminSettings from './pages/AdminSettings';
import UserManagement from './pages/UserManagement';
import StrategiesPage from './pages/StrategiesPage';
import CreateStrategyPage from './pages/CreateStrategyPage';

// Components
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';

// Layout wrapper for authenticated pages
function AuthenticatedLayout({ children }) {
    return (
        <>
            <Navbar />
            {children}
        </>
    );
}

function App() {
    return (
        <Provider store={store}>
            <Router
                future={{
                    v7_startTransition: true,
                    v7_relativeSplatPath: true,
                }}
            >
                <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-50">
                    <Routes>
                        {/* Public Routes */}
                        <Route path="/login" element={<Login />} />
                        <Route path="/signup" element={<Signup />} />

                        {/* Protected Routes with Navbar */}
                        <Route
                            path="/stocks"
                            element={
                                <PrivateRoute>
                                    <AuthenticatedLayout>
                                        <StocksWatchlist />
                                    </AuthenticatedLayout>
                                </PrivateRoute>
                            }
                        />

                        <Route
                            path="/stocks/:symbol"
                            element={
                                <PrivateRoute>
                                    <AuthenticatedLayout>
                                        <SmartAnalysis />
                                    </AuthenticatedLayout>
                                </PrivateRoute>
                            }
                        />

                        <Route
                            path="/order/:type/:symbol"
                            element={
                                <PrivateRoute>
                                    <AuthenticatedLayout>
                                        <OrderPage />
                                    </AuthenticatedLayout>
                                </PrivateRoute>
                            }
                        />

                        <Route
                            path="/orders/history"
                            element={
                                <PrivateRoute>
                                    <AuthenticatedLayout>
                                        <OrderHistory />
                                    </AuthenticatedLayout>
                                </PrivateRoute>
                            }
                        />

                        <Route
                            path="/portfolio"
                            element={
                                <PrivateRoute>
                                    <AuthenticatedLayout>
                                        <Portfolio />
                                    </AuthenticatedLayout>
                                </PrivateRoute>
                            }
                        />

                        <Route
                            path="/pnl"
                            element={
                                <PrivateRoute>
                                    <AuthenticatedLayout>
                                        <ProfitLoss />
                                    </AuthenticatedLayout>
                                </PrivateRoute>
                            }
                        />

                        <Route
                            path="/strategies"
                            element={
                                <PrivateRoute>
                                    <AuthenticatedLayout>
                                        <StrategiesPage />
                                    </AuthenticatedLayout>
                                </PrivateRoute>
                            }
                        />

                        <Route
                            path="/strategies/create"
                            element={
                                <PrivateRoute>
                                    <AuthenticatedLayout>
                                        <CreateStrategyPage />
                                    </AuthenticatedLayout>
                                </PrivateRoute>
                            }
                        />

                        <Route
                            path="/admin/settings"
                            element={
                                <PrivateRoute>
                                    <AuthenticatedLayout>
                                        <AdminSettings />
                                    </AuthenticatedLayout>
                                </PrivateRoute>
                            }
                        />

                        <Route
                            path="/admin/users"
                            element={
                                <PrivateRoute>
                                    <AuthenticatedLayout>
                                        <UserManagement />
                                    </AuthenticatedLayout>
                                </PrivateRoute>
                            }
                        />

                        {/* Redirect root to stocks (or login if not authenticated) */}
                        <Route path="/" element={<Navigate to="/stocks" replace />} />

                        {/* 404 - Redirect to stocks */}
                        <Route path="*" element={<Navigate to="/stocks" replace />} />
                    </Routes>
                </div>
            </Router>
        </Provider>
    );
}

export default App;
