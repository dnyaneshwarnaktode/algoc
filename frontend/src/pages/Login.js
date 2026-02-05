import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { login } from '../services/authService';

const Login = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { loading, error, isAuthenticated } = useSelector((state) => state.auth);

    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const { email, password } = formData;

    // Redirect if already logged in
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/stocks');
        }
    }, [isAuthenticated, navigate]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const result = await dispatch(login({ email, password }));
        if (result.success) {
            navigate('/stocks');
        }
    };

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center px-4">
            <div className="max-w-md w-full">
                {/* Logo/Brand */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-neutral-900 dark:text-white mb-2">
                        AlgoC
                    </h1>
                    <p className="text-neutral-600 dark:text-neutral-400">
                        Algorithmic Paper Trading Platform
                    </p>
                </div>

                {/* Login Card */}
                <div className="card">
                    <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-6">
                        Login to Your Account
                    </h2>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 p-3 bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 rounded-lg">
                            <p className="text-danger-700 dark:text-danger-400 text-sm">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email */}
                        <div>
                            <label
                                htmlFor="email"
                                className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"
                            >
                                Email Address
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={email}
                                onChange={handleChange}
                                required
                                className="input-field"
                                placeholder="you@example.com"
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label
                                htmlFor="password"
                                className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"
                            >
                                Password
                            </label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={password}
                                onChange={handleChange}
                                required
                                className="input-field"
                                placeholder="••••••••"
                            />
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-primary bg-primary-500 hover:bg-primary-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Logging in...' : 'Login'}
                        </button>
                    </form>

                    {/* Signup Link */}
                    <div className="mt-6 text-center">
                        <p className="text-neutral-600 dark:text-neutral-400">
                            Don't have an account?{' '}
                            <Link
                                to="/signup"
                                className="text-primary-500 hover:text-primary-600 font-medium"
                            >
                                Sign up here
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Demo Info */}
                <div className="mt-6 text-center">
                    <p className="text-sm text-neutral-500 dark:text-neutral-500">
                        Paper trading with virtual money • Risk-free learning
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
