import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { signup } from '../services/authService';

const Signup = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { loading, error, isAuthenticated } = useSelector((state) => state.auth);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    });

    const [validationError, setValidationError] = useState('');

    const { name, email, password, confirmPassword } = formData;

    // Redirect if already logged in
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/stocks');
        }
    }, [isAuthenticated, navigate]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setValidationError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (password.length < 6) {
            setValidationError('Password must be at least 6 characters');
            return;
        }

        if (password !== confirmPassword) {
            setValidationError('Passwords do not match');
            return;
        }

        const result = await dispatch(signup({ name, email, password }));
        if (result.success) {
            navigate('/stocks');
        }
    };

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center px-4 py-8">
            <div className="max-w-md w-full">
                {/* Logo/Brand */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-neutral-900 dark:text-white mb-2">
                        AlgoC
                    </h1>
                    <p className="text-neutral-600 dark:text-neutral-400">
                        Start Your Paper Trading Journey
                    </p>
                </div>

                {/* Signup Card */}
                <div className="card">
                    <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-6">
                        Create Your Account
                    </h2>

                    {/* Error Messages */}
                    {(error || validationError) && (
                        <div className="mb-4 p-3 bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 rounded-lg">
                            <p className="text-danger-700 dark:text-danger-400 text-sm">
                                {validationError || error}
                            </p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Name */}
                        <div>
                            <label
                                htmlFor="name"
                                className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"
                            >
                                Full Name
                            </label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={name}
                                onChange={handleChange}
                                required
                                className="input-field"
                                placeholder="John Doe"
                            />
                        </div>

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
                                minLength={6}
                                className="input-field"
                                placeholder="••••••••"
                            />
                            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                                Minimum 6 characters
                            </p>
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label
                                htmlFor="confirmPassword"
                                className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"
                            >
                                Confirm Password
                            </label>
                            <input
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword"
                                value={confirmPassword}
                                onChange={handleChange}
                                required
                                className="input-field"
                                placeholder="••••••••"
                            />
                        </div>

                        {/* Virtual Balance Info */}
                        <div className="p-3 bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 rounded-lg">
                            <p className="text-success-700 dark:text-success-400 text-sm">
                                🎉 You'll start with ₹1,00,000 virtual money for paper trading!
                            </p>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-primary bg-primary-500 hover:bg-primary-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Creating Account...' : 'Create Account'}
                        </button>
                    </form>

                    {/* Login Link */}
                    <div className="mt-6 text-center">
                        <p className="text-neutral-600 dark:text-neutral-400">
                            Already have an account?{' '}
                            <Link
                                to="/login"
                                className="text-primary-500 hover:text-primary-600 font-medium"
                            >
                                Login here
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Info */}
                <div className="mt-6 text-center">
                    <p className="text-sm text-neutral-500 dark:text-neutral-500">
                        100% free • No credit card required • Learn risk-free
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Signup;
