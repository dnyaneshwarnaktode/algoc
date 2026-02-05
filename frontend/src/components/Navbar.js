import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../redux/slices/authSlice';

/**
 * Navigation Bar Component
 * Provides navigation to all main pages with dark/light mode toggle
 */
const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [darkMode, setDarkMode] = useState(false);

    // Check for saved theme preference or default to dark mode
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
            setDarkMode(true);
            document.documentElement.classList.add('dark');
        } else {
            setDarkMode(false);
            document.documentElement.classList.remove('dark');
        }
    }, []);

    const toggleDarkMode = () => {
        if (darkMode) {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
            setDarkMode(false);
        } else {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
            setDarkMode(true);
        }
    };

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

    const navItems = [
        {
            path: '/stocks',
            label: 'Watchlist',
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g clipPath="url(#clip0_watchlist)">
                        <path d="M7 10.7402V13.9402" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M12 15.6798V12.7598" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M12 9V10.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M17 10.7402V13.9402" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M2 12.98V15C2 20 4 22 9 22H15C20 22 22 20 22 15V9C22 4 20 2 15 2H9C4 2 2 4 2 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </g>
                    <defs>
                        <clipPath id="clip0_watchlist">
                            <rect width="24" height="24" fill="white" />
                        </clipPath>
                    </defs>
                </svg >
            )
        },
        {
            path: '/portfolio',
            label: 'Portfolio',
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g clipPath="url(#clip0_portfolio)">
                        <g opacity="0.4">
                            <path d="M13.0692 15.3092L10.9492 13.1992" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M13.0497 13.2188L10.9297 15.3387" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                        </g>
                        <path d="M7.99983 22H15.9998C20.0198 22 20.7398 20.39 20.9498 18.43L21.6998 10.43C21.9698 7.99 21.2698 6 16.9998 6H6.99983C2.72983 6 2.02983 7.99 2.29983 10.43L3.04983 18.43C3.25983 20.39 3.97983 22 7.99983 22Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                        <path opacity="0.4" d="M8 6V5.2C8 3.43 8 2 11.2 2H12.8C16 2 16 3.43 16 5.2V6" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                        <g opacity="0.4">
                            <path d="M12 18.1992C14.2091 18.1992 16 16.4084 16 14.1992C16 11.9901 14.2091 10.1992 12 10.1992C9.79086 10.1992 8 11.9901 8 14.1992C8 16.4084 9.79086 18.1992 12 18.1992Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M21.6498 11C19.9198 12.26 17.9998 13.14 16.0098 13.64" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M2.61914 11.2695C4.28914 12.4095 6.10914 13.2195 7.99914 13.6795" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                        </g>
                    </g>
                    <defs>
                        <clipPath id="clip0_portfolio">
                            <rect width="24" height="24" fill="white" />
                        </clipPath>
                    </defs>
                </svg>
            )
        },
        {
            path: '/orders/history',
            label: 'Orders',
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g clipPath="url(#clip0_orders)">
                        <path d="M21.93 6.76099L18.56 20.291C18.32 21.301 17.42 22.001 16.38 22.001H3.24001C1.73001 22.001 0.650023 20.5209 1.10002 19.0709L5.31001 5.55103C5.60001 4.61103 6.47003 3.96094 7.45003 3.96094H19.75C20.7 3.96094 21.49 4.54094 21.82 5.34094C22.01 5.77094 22.05 6.26099 21.93 6.76099Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" />
                        <path d="M16 22H20.78C22.07 22 23.08 20.91 22.99 19.62L22 6" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M9.67993 6.38049L10.7199 2.06055" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M16.38 6.39075L17.32 2.05078" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M7.69995 12H15.7" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M6.69995 16H14.7" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                    </g>
                    <defs>
                        <clipPath id="clip0_orders">
                            <rect width="24" height="24" fill="white" />
                        </clipPath>
                    </defs>
                </svg>
            )
        },
        {
            path: '/pnl',
            label: 'P&L',
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g clipPath="url(#clip0_pnl)">
                        <path d="M6.19005 7.80946C5.95005 7.80946 5.73005 7.69946 5.58005 7.49946C5.41005 7.26946 5.39005 6.96943 5.52005 6.71943C5.69005 6.37943 5.93005 6.04946 6.24005 5.74946L9.49005 2.48945C11.15 0.839453 13.85 0.839453 15.51 2.48945L17.26 4.26948C18 4.99948 18.45 5.97948 18.5 7.01948C18.51 7.24948 18.42 7.46946 18.25 7.61946C18.08 7.76946 17.85 7.83945 17.63 7.79945C17.43 7.76945 17.22 7.75947 17 7.75947H7.00005C6.76005 7.75947 6.53005 7.77946 6.30005 7.80946C6.27005 7.80946 6.23005 7.80946 6.19005 7.80946ZM7.86005 6.24946H16.82C16.69 5.90946 16.48 5.59947 16.2 5.31947L14.44 3.53944C13.37 2.47944 11.62 2.47944 10.54 3.53944L7.86005 6.24946Z" fill="currentColor" />
                        <path d="M5 23.75C3.34 23.75 1.78 22.87 0.94 21.44C0.49 20.72 0.25 19.87 0.25 19C0.25 16.38 2.38 14.25 5 14.25C7.62 14.25 9.75 16.38 9.75 19C9.75 19.87 9.51 20.72 9.06 21.45C8.22 22.87 6.66 23.75 5 23.75ZM5 15.75C3.21 15.75 1.75 17.21 1.75 19C1.75 19.59 1.91 20.17 2.22 20.67C2.81 21.67 3.85 22.25 5 22.25C6.15 22.25 7.19 21.66 7.78 20.68C8.09 20.17 8.25 19.6 8.25 19C8.25 17.21 6.79 15.75 5 15.75Z" fill="currentColor" />
                        <path d="M6.48977 19.7305H3.50977C3.09977 19.7305 2.75977 19.3905 2.75977 18.9805C2.75977 18.5705 3.09977 18.2305 3.50977 18.2305H6.49977C6.90977 18.2305 7.24977 18.5705 7.24977 18.9805C7.24977 19.3905 6.90977 19.7305 6.48977 19.7305Z" fill="currentColor" />
                        <path d="M5 21.2595C4.59 21.2595 4.25 20.9195 4.25 20.5095V17.5195C4.25 17.1095 4.59 16.7695 5 16.7695C5.41 16.7695 5.75 17.1095 5.75 17.5195V20.5095C5.75 20.9295 5.41 21.2595 5 21.2595Z" fill="currentColor" />
                        <path d="M17 22.75H7.62998C7.30998 22.75 7.02998 22.55 6.91998 22.26C6.80998 21.96 6.89998 21.63 7.13998 21.43C7.37998 21.23 7.59998 20.97 7.75998 20.69C8.07998 20.18 8.23998 19.6 8.23998 19.01C8.23998 17.22 6.77998 15.76 4.98998 15.76C4.05998 15.76 3.16998 16.16 2.54998 16.87C2.33998 17.1 2.00998 17.19 1.71998 17.08C1.42998 16.97 1.22998 16.69 1.22998 16.38V12C1.22998 8.92 3.12998 6.69001 6.07998 6.32001C6.34998 6.28001 6.65998 6.25 6.97998 6.25H16.98C17.22 6.25 17.53 6.26 17.85 6.31C20.8 6.65 22.73 8.89 22.73 12V17C22.75 20.44 20.44 22.75 17 22.75ZM9.17998 21.25H17C19.58 21.25 21.25 19.58 21.25 17V12C21.25 9.66 19.88 8.04998 17.66 7.78998C17.42 7.74998 17.21 7.75 17 7.75H6.99998C6.75998 7.75 6.52998 7.76999 6.29998 7.79999C4.09998 8.07999 2.74998 9.68 2.74998 12V14.82C3.42998 14.45 4.20998 14.25 4.99998 14.25C7.61998 14.25 9.74998 16.38 9.74998 19C9.74998 19.79 9.54998 20.57 9.17998 21.25Z" fill="currentColor" />
                        <path d="M22 17.25H19C17.48 17.25 16.25 16.02 16.25 14.5C16.25 12.98 17.48 11.75 19 11.75H22C22.41 11.75 22.75 12.09 22.75 12.5C22.75 12.91 22.41 13.25 22 13.25H19C18.31 13.25 17.75 13.81 17.75 14.5C17.75 15.19 18.31 15.75 19 15.75H22C22.41 15.75 22.75 16.09 22.75 16.5C22.75 16.91 22.41 17.25 22 17.25Z" fill="currentColor" />
                    </g>
                    <defs>
                        <clipPath id="clip0_pnl">
                            <rect width="24" height="24" fill="white" />
                        </clipPath>
                    </defs>
                </svg>
            )
        },
        {
            path: '/strategies',
            label: 'Strategies',
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12.37 8.88H17.62" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M6.38 8.88L7.13 9.63L9.38 7.38" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M12.37 15.88H17.62" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M6.38 15.88L7.13 16.63L9.38 14.38" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M9 22H15C20 22 22 20 22 15V9C22 4 20 2 15 2H9C4 2 2 4 2 9V15C2 20 4 22 9 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            )
        },
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div className="flex items-center">
                        <button
                            onClick={() => navigate('/stocks')}
                            className="text-2xl font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                        >
                            AlgoC
                        </button>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-1">
                        {navItems.map((item) => (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive(item.path)
                                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                                    }`}
                            >
                                <span className="mr-2">{item.icon}</span>
                                {item.label}
                            </button>
                        ))}
                    </div>

                    {/* User Menu & Theme Toggle */}
                    <div className="hidden md:flex items-center space-x-4">
                        {/* Dark Mode Toggle */}
                        <button
                            onClick={toggleDarkMode}
                            className="p-2 rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                        >
                            {darkMode ? (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <g clipPath="url(#clip0_light_toggle)">
                                        <path d="M12 19C15.866 19 19 15.866 19 12C19 8.13401 15.866 5 12 5C8.13401 5 5 8.13401 5 12C5 15.866 8.13401 19 12 19Z" fill="currentColor" />
                                        <path d="M12 22.96C11.45 22.96 11 22.55 11 22V21.92C11 21.37 11.45 20.92 12 20.92C12.55 20.92 13 21.37 13 21.92C13 22.47 12.55 22.96 12 22.96ZM19.14 20.14C18.88 20.14 18.63 20.04 18.43 19.85L18.3 19.72C17.91 19.33 17.91 18.7 18.3 18.31C18.69 17.92 19.32 17.92 19.71 18.31L19.84 18.44C20.23 18.83 20.23 19.46 19.84 19.85C19.65 20.04 19.4 20.14 19.14 20.14ZM4.86 20.14C4.6 20.14 4.35 20.04 4.15 19.85C3.76 19.46 3.76 18.83 4.15 18.44L4.28 18.31C4.67 17.92 5.3 17.92 5.69 18.31C6.08 18.7 6.08 19.33 5.69 19.72L5.56 19.85C5.37 20.04 5.11 20.14 4.86 20.14ZM22 13H21.92C21.37 13 20.92 12.55 20.92 12C20.92 11.45 21.37 11 21.92 11C22.47 11 22.96 11.45 22.96 12C22.96 12.55 22.55 13 22 13ZM2.08 13H2C1.45 13 1 12.55 1 12C1 11.45 1.45 11 2 11C2.55 11 3.04 11.45 3.04 12C3.04 12.55 2.63 13 2.08 13ZM19.01 5.99C18.75 5.99 18.5 5.89 18.3 5.7C17.91 5.31 17.91 4.68 18.3 4.29L18.43 4.16C18.82 3.77 19.45 3.77 19.84 4.16C20.23 4.55 20.23 5.18 19.84 5.57L19.71 5.7C19.52 5.89 19.27 5.99 19.01 5.99ZM4.99 5.99C4.73 5.99 4.48 5.89 4.28 5.7L4.15 5.56C3.76 5.17 3.76 4.54 4.15 4.15C4.54 3.76 5.17 3.76 5.56 4.15L5.69 4.28C6.08 4.67 6.08 5.3 5.69 5.69C5.5 5.89 5.24 5.99 4.99 5.99ZM12 3.04C11.45 3.04 11 2.63 11 2.08V2C11 1.45 11.45 1 12 1C12.55 1 13 1.45 13 2C13 2.55 12.55 3.04 12 3.04Z" fill="currentColor" />
                                    </g>
                                    <defs>
                                        <clipPath id="clip0_light_toggle"><rect width="24" height="24" fill="white" /></clipPath>
                                    </defs>
                                </svg>
                            ) : (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <g clipPath="url(#clip0_dark_toggle)">
                                        <path d="M12 19.25C8 19.25 4.75 16 4.75 12C4.75 8 8 4.75 12 4.75C16 4.75 19.25 8 19.25 12C19.25 16 16 19.25 12 19.25ZM12 6.25C8.83 6.25 6.25 8.83 6.25 12C6.25 15.17 8.83 17.75 12 17.75C15.17 17.75 17.75 15.17 17.75 12C17.75 8.83 15.17 6.25 12 6.25Z" fill="currentColor" />
                                        <path d="M12 22.96C11.45 22.96 11 22.55 11 22V21.92C11 21.37 11.45 20.92 12 20.92C12.55 20.92 13 21.37 13 21.92C13 22.47 12.55 22.96 12 22.96ZM19.14 20.14C18.88 20.14 18.63 20.04 18.43 19.85L18.3 19.72C17.91 19.33 17.91 18.7 18.3 18.31C18.69 17.92 19.32 17.92 19.71 18.31L19.84 18.44C20.23 18.83 20.23 19.46 19.84 19.85C19.65 20.04 19.4 20.14 19.14 20.14ZM4.86 20.14C4.6 20.14 4.35 20.04 4.15 19.85C3.76 19.46 3.76 18.83 4.15 18.44L4.28 18.31C4.67 17.92 5.3 17.92 5.69 18.31C6.08 18.7 6.08 19.33 5.69 19.72L5.56 19.85C5.37 20.04 5.11 20.14 4.86 20.14ZM22 13H21.92C21.37 13 20.92 12.55 20.92 12C20.92 11.45 21.37 11 21.92 11C22.47 11 22.96 11.45 22.96 12C22.96 12.55 22.55 13 22 13ZM2.08 13H2C1.45 13 1 12.55 1 12C1 11.45 1.45 11 2 11C2.55 11 3.04 11.45 3.04 12C3.04 12.55 2.63 13 2.08 13ZM19.01 5.99C18.75 5.99 18.5 5.89 18.3 5.7C17.91 5.31 17.91 4.68 18.3 4.29L18.43 4.16C18.82 3.77 19.45 3.77 19.84 4.16C20.23 4.55 20.23 5.18 19.84 5.57L19.71 5.7C19.52 5.89 19.27 5.99 19.01 5.99ZM4.99 5.99C4.73 5.99 4.48 5.89 4.28 5.7L4.15 5.56C3.76 5.17 3.76 4.54 4.15 4.15C4.54 3.76 5.17 3.76 5.56 4.15L5.69 4.28C6.08 4.67 6.08 5.3 5.69 5.69C5.5 5.89 5.24 5.99 4.99 5.99ZM12 3.04C11.45 3.04 11 2.63 11 2.08V2C11 1.45 11.45 1 12 1C12.55 1 13 1.45 13 2C13 2.55 12.55 3.04 12 3.04Z" fill="currentColor" />
                                    </g>
                                    <defs>
                                        <clipPath id="clip0_dark_toggle"><rect width="24" height="24" fill="white" /></clipPath>
                                    </defs>
                                </svg>
                            )}
                        </button>

                        {/* Admin Settings Link (Admin Only) */}
                        {user?.role === 'admin' && (
                            <button
                                onClick={() => navigate('/admin/settings')}
                                className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/admin/settings')
                                    ? 'bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-400'
                                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                                    }`}
                                title="Admin Settings"
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <g clipPath="url(#clip0_4418_6270)">
                                        <path d="M3 9.10937V14.8794C3 16.9994 3 16.9994 5 18.3494L10.5 21.5294C11.33 22.0094 12.68 22.0094 13.5 21.5294L19 18.3494C21 16.9994 21 16.9994 21 14.8894V9.10937C21 6.99937 21 6.99937 19 5.64937L13.5 2.46937C12.68 1.98937 11.33 1.98937 10.5 2.46937L5 5.64937C3 6.99937 3 6.99937 3 9.10937Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        <path opacity="0.34" d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </g>
                                    <defs>
                                        <clipPath id="clip0_4418_6270">
                                            <rect width="24" height="24" fill="white" />
                                        </clipPath>
                                    </defs>
                                </svg>
                            </button>
                        )}

                        {/* User Info */}
                        <div className="text-right">
                            <p className="text-sm font-medium text-neutral-900 dark:text-white">
                                {user?.name}
                            </p>
                            <p className="text-xs text-neutral-600 dark:text-neutral-400">
                                ₹{user?.virtualBalance?.toLocaleString('en-IN')}
                            </p>
                        </div>

                        {/* Logout Button */}
                        <button
                            onClick={handleLogout}
                            className="p-2 rounded-lg text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/20 transition-colors"
                            title="Logout"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M15.24 22.2705H15.11C10.67 22.2705 8.53002 20.5205 8.16002 16.6005C8.12002 16.1905 8.42002 15.8205 8.84002 15.7805C9.24002 15.7405 9.62002 16.0505 9.66002 16.4605C9.95002 19.6005 11.43 20.7705 15.12 20.7705H15.25C19.32 20.7705 20.76 19.3305 20.76 15.2605V8.74047C20.76 4.67047 19.32 3.23047 15.25 3.23047H15.12C11.41 3.23047 9.93002 4.42047 9.66002 7.62047C9.61002 8.03047 9.26002 8.34047 8.84002 8.30047C8.42002 8.27047 8.12001 7.90047 8.15001 7.49047C8.49001 3.51047 10.64 1.73047 15.11 1.73047H15.24C20.15 1.73047 22.25 3.83047 22.25 8.74047V15.2605C22.25 20.1705 20.15 22.2705 15.24 22.2705Z" fill="currentColor" />
                                <path d="M15.0001 12.75H3.62012C3.21012 12.75 2.87012 12.41 2.87012 12C2.87012 11.59 3.21012 11.25 3.62012 11.25H15.0001C15.4101 11.25 15.7501 11.59 15.7501 12C15.7501 12.41 15.4101 12.75 15.0001 12.75Z" fill="currentColor" />
                                <path d="M5.84994 16.0998C5.65994 16.0998 5.46994 16.0298 5.31994 15.8798L1.96994 12.5298C1.67994 12.2398 1.67994 11.7598 1.96994 11.4698L5.31994 8.11984C5.60994 7.82984 6.08994 7.82984 6.37994 8.11984C6.66994 8.40984 6.66994 8.88984 6.37994 9.17984L3.55994 11.9998L6.37994 14.8198C6.66994 15.1098 6.66994 15.5898 6.37994 15.8798C6.23994 16.0298 6.03994 16.0998 5.84994 16.0998Z" fill="currentColor" />
                            </svg>
                        </button>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center gap-2">
                        {/* Mobile Dark Mode Toggle */}
                        <button
                            onClick={toggleDarkMode}
                            className="p-2 rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                        >
                            {darkMode ? (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <g clipPath="url(#clip0_light_toggle_m)">
                                        <path d="M12 19C15.866 19 19 15.866 19 12C19 8.13401 15.866 5 12 5C8.13401 5 5 8.13401 5 12C5 15.866 8.13401 19 12 19Z" fill="currentColor" />
                                        <path d="M12 22.96C11.45 22.96 11 22.55 11 22V21.92C11 21.37 11.45 20.92 12 20.92C12.55 20.92 13 21.37 13 21.92C13 22.47 12.55 22.96 12 22.96ZM19.14 20.14C18.88 20.14 18.63 20.04 18.43 19.85L18.3 19.72C17.91 19.33 17.91 18.7 18.3 18.31C18.69 17.92 19.32 17.92 19.71 18.31L19.84 18.44C20.23 18.83 20.23 19.46 19.84 19.85C19.65 20.04 19.4 20.14 19.14 20.14ZM4.86 20.14C4.6 20.14 4.35 20.04 4.15 19.85C3.76 19.46 3.76 18.83 4.15 18.44L4.28 18.31C4.67 17.92 5.3 17.92 5.69 18.31C6.08 18.7 6.08 19.33 5.69 19.72L5.56 19.85C5.37 20.04 5.11 20.14 4.86 20.14ZM22 13H21.92C21.37 13 20.92 12.55 20.92 12C20.92 11.45 21.37 11 21.92 11C22.47 11 22.96 11.45 22.96 12C22.96 12.55 22.55 13 22 13ZM2.08 13H2C1.45 13 1 12.55 1 12C1 11.45 1.45 11 2 11C2.55 11 3.04 11.45 3.04 12C3.04 12.55 2.63 13 2.08 13ZM19.01 5.99C18.75 5.99 18.5 5.89 18.3 5.7C17.91 5.31 17.91 4.68 18.3 4.29L18.43 4.16C18.82 3.77 19.45 3.77 19.84 4.16C20.23 4.55 20.23 5.18 19.84 5.57L19.71 5.7C19.52 5.89 19.27 5.99 19.01 5.99ZM4.99 5.99C4.73 5.99 4.48 5.89 4.28 5.7L4.15 5.56C3.76 5.17 3.76 4.54 4.15 4.15C4.54 3.76 5.17 3.76 5.56 4.15L5.69 4.28C6.08 4.67 6.08 5.3 5.69 5.69C5.5 5.89 5.24 5.99 4.99 5.99ZM12 3.04C11.45 3.04 11 2.63 11 2.08V2C11 1.45 11.45 1 12 1C12.55 1 13 1.45 13 2C13 2.55 12.55 3.04 12 3.04Z" fill="currentColor" />
                                    </g>
                                    <defs>
                                        <clipPath id="clip0_light_toggle_m"><rect width="24" height="24" fill="white" /></clipPath>
                                    </defs>
                                </svg>
                            ) : (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <g clipPath="url(#clip0_dark_toggle_m)">
                                        <path d="M12 19.25C8 19.25 4.75 16 4.75 12C4.75 8 8 4.75 12 4.75C16 4.75 19.25 8 19.25 12C19.25 16 16 19.25 12 19.25ZM12 6.25C8.83 6.25 6.25 8.83 6.25 12C6.25 15.17 8.83 17.75 12 17.75C15.17 17.75 17.75 15.17 17.75 12C17.75 8.83 15.17 6.25 12 6.25Z" fill="currentColor" />
                                        <path d="M12 22.96C11.45 22.96 11 22.55 11 22V21.92C11 21.37 11.45 20.92 12 20.92C12.55 20.92 13 21.37 13 21.92C13 22.47 12.55 22.96 12 22.96ZM19.14 20.14C18.88 20.14 18.63 20.04 18.43 19.85L18.3 19.72C17.91 19.33 17.91 18.7 18.3 18.31C18.69 17.92 19.32 17.92 19.71 18.31L19.84 18.44C20.23 18.83 20.23 19.46 19.84 19.85C19.65 20.04 19.4 20.14 19.14 20.14ZM4.86 20.14C4.6 20.14 4.35 20.04 4.15 19.85C3.76 19.46 3.76 18.83 4.15 18.44L4.28 18.31C4.67 17.92 5.3 17.92 5.69 18.31C6.08 18.7 6.08 19.33 5.69 19.72L5.56 19.85C5.37 20.04 5.11 20.14 4.86 20.14ZM22 13H21.92C21.37 13 20.92 12.55 20.92 12C20.92 11.45 21.37 11 21.92 11C22.47 11 22.96 11.45 22.96 12C22.96 12.55 22.55 13 22 13ZM2.08 13H2C1.45 13 1 12.55 1 12C1 11.45 1.45 11 2 11C2.55 11 3.04 11.45 3.04 12C3.04 12.55 2.63 13 2.08 13ZM19.01 5.99C18.75 5.99 18.5 5.89 18.3 5.7C17.91 5.31 17.91 4.68 18.3 4.29L18.43 4.16C18.82 3.77 19.45 3.77 19.84 4.16C20.23 4.55 20.23 5.18 19.84 5.57L19.71 5.7C19.52 5.89 19.27 5.99 19.01 5.99ZM4.99 5.99C4.73 5.99 4.48 5.89 4.28 5.7L4.15 5.56C3.76 5.17 3.76 4.54 4.15 4.15C4.54 3.76 5.17 3.76 5.56 4.15L5.69 4.28C6.08 4.67 6.08 5.3 5.69 5.69C5.5 5.89 5.24 5.99 4.99 5.99ZM12 3.04C11.45 3.04 11 2.63 11 2.08V2C11 1.45 11.45 1 12 1C12.55 1 13 1.45 13 2C13 2.55 12.55 3.04 12 3.04Z" fill="currentColor" />
                                    </g>
                                    <defs>
                                        <clipPath id="clip0_dark_toggle_m"><rect width="24" height="24" fill="white" /></clipPath>
                                    </defs>
                                </svg>
                            )}
                        </button>

                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="p-2 rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                        >
                            {mobileMenuOpen ? '✕' : '☰'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden border-t border-neutral-200 dark:border-neutral-700">
                    <div className="px-4 py-3 space-y-1">
                        {navItems.map((item) => (
                            <button
                                key={item.path}
                                onClick={() => {
                                    navigate(item.path);
                                    setMobileMenuOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive(item.path)
                                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                                    }`}
                            >
                                <span className="mr-2">{item.icon}</span>
                                {item.label}
                            </button>
                        ))}

                        {/* Admin Settings (Mobile) */}
                        {user?.role === 'admin' && (
                            <button
                                onClick={() => {
                                    navigate('/admin/settings');
                                    setMobileMenuOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/admin/settings')
                                    ? 'bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-400'
                                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                                    }`}
                            >
                                <span className="mr-2 inline-flex items-center">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <g clipPath="url(#clip0_mobile_admin)">
                                            <path d="M3 9.10937V14.8794C3 16.9994 3 16.9994 5 18.3494L10.5 21.5294C11.33 22.0094 12.68 22.0094 13.5 21.5294L19 18.3494C21 16.9994 21 16.9994 21 14.8894V9.10937C21 6.99937 21 6.99937 19 5.64937L13.5 2.46937C12.68 1.98937 11.33 1.98937 10.5 2.46937L5 5.64937C3 6.99937 3 6.99937 3 9.10937Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                            <path opacity="0.34" d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </g>
                                        <defs>
                                            <clipPath id="clip0_mobile_admin">
                                                <rect width="24" height="24" fill="white" />
                                            </clipPath>
                                        </defs>
                                    </svg>
                                </span>
                                Admin Settings
                            </button>
                        )}

                        <div className="pt-3 border-t border-neutral-200 dark:border-neutral-700">
                            <div className="px-4 py-2">
                                <p className="text-sm font-medium text-neutral-900 dark:text-white">
                                    {user?.name}
                                </p>
                                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                                    Balance: ₹{user?.virtualBalance?.toLocaleString('en-IN')}
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    handleLogout();
                                    setMobileMenuOpen(false);
                                }}
                                className="w-full text-left px-4 py-2 text-sm font-medium text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors"
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M15.24 22.2705H15.11C10.67 22.2705 8.53002 20.5205 8.16002 16.6005C8.12002 16.1905 8.42002 15.8205 8.84002 15.7805C9.24002 15.7405 9.62002 16.0505 9.66002 16.4605C9.95002 19.6005 11.43 20.7705 15.12 20.7705H15.25C19.32 20.7705 20.76 19.3305 20.76 15.2605V8.74047C20.76 4.67047 19.32 3.23047 15.25 3.23047H15.12C11.41 3.23047 9.93002 4.42047 9.66002 7.62047C9.61002 8.03047 9.26002 8.34047 8.84002 8.30047C8.42002 8.27047 8.12001 7.90047 8.15001 7.49047C8.49001 3.51047 10.64 1.73047 15.11 1.73047H15.24C20.15 1.73047 22.25 3.83047 22.25 8.74047V15.2605C22.25 20.1705 20.15 22.2705 15.24 22.2705Z" fill="currentColor" />
                                    <path d="M15.0001 12.75H3.62012C3.21012 12.75 2.87012 12.41 2.87012 12C2.87012 11.59 3.21012 11.25 3.62012 11.25H15.0001C15.4101 11.25 15.7501 11.59 15.7501 12C15.7501 12.41 15.4101 12.75 15.0001 12.75Z" fill="currentColor" />
                                    <path d="M5.84994 16.0998C5.65994 16.0998 5.46994 16.0298 5.31994 15.8798L1.96994 12.5298C1.67994 12.2398 1.67994 11.7598 1.96994 11.4698L5.31994 8.11984C5.60994 7.82984 6.08994 7.82984 6.37994 8.11984C6.66994 8.40984 6.66994 8.88984 6.37994 9.17984L3.55994 11.9998L6.37994 14.8198C6.66994 15.1098 6.66994 15.5898 6.37994 15.8798C6.23994 16.0298 6.03994 16.0998 5.84994 16.0998Z" fill="currentColor" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
