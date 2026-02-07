import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchStocks, fetchSectors } from '../services/stockService';
import { setFilters, clearFilters } from '../redux/slices/stockSlice';
import StockCard from '../components/StockCard';
import websocketService from '../services/websocketService';

const StocksWatchlist = () => {
    const dispatch = useDispatch();
    const { stocks, sectors, loading, error, filters, pagination } = useSelector(
        (state) => state.stock
    );
    const { user } = useSelector((state) => state.auth);

    const [localSearch, setLocalSearch] = useState('');

    // Fetch stocks and sectors on mount
    useEffect(() => {
        dispatch(fetchSectors());
    }, [dispatch]);

    // Fetch stocks when filters change
    useEffect(() => {
        dispatch(fetchStocks(filters));
    }, [filters, dispatch]);

    // Handle WebSocket subscriptions for the current page
    useEffect(() => {
        if (stocks && stocks.length > 0) {
            const symbols = stocks.map(s => s.symbol);
            websocketService.subscribe(symbols);

            return () => {
                websocketService.unsubscribe(symbols);
            };
        }
    }, [stocks]);

    const handleSearchChange = (e) => {
        setLocalSearch(e.target.value);
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        dispatch(setFilters({ search: localSearch, page: 1 }));
    };

    const handleSectorChange = (e) => {
        dispatch(setFilters({ sector: e.target.value, page: 1 }));
    };

    const handleExchangeChange = (e) => {
        dispatch(setFilters({ exchange: e.target.value, page: 1 }));
    };

    const handlePageChange = (newPage) => {
        dispatch(setFilters({ page: newPage }));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleClearFilters = () => {
        setLocalSearch('');
        dispatch(clearFilters());
    };

    const totalPages = Math.ceil((pagination?.total || 0) / (pagination?.limit || 100));
    const currentPage = pagination?.page || 1;

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
            {/* Header */}
            <div className="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
                                Stocks Watchlist
                            </h1>
                            <p className="text-neutral-600 dark:text-neutral-400 mt-1">
                                Browse and track your favorite stocks
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                Virtual Balance
                            </p>
                            <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                                ₹{user?.virtualBalance?.toLocaleString('en-IN')}
                            </p>
                        </div>
                    </div>

                    {/* Search & Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Search */}
                        <form onSubmit={handleSearchSubmit} className="md:col-span-2">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={localSearch}
                                    onChange={handleSearchChange}
                                    placeholder="Search by symbol or name..."
                                    className="input-field pr-10"
                                />
                                <button
                                    type="submit"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <g clipPath="url(#clip0_search)">
                                            <path d="M3.5 11V18.3C3.5 20.96 4.96001 21.59 6.73001 19.69L6.73999 19.68C7.55999 18.81 8.80999 18.88 9.51999 19.83L10.53 21.18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M20.5 11.3V7.04001C20.5 3.01001 19.56 2 15.78 2H8.22C4.44 2 3.5 3.01001 3.5 7.04001" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M18.2 21.4C19.9673 21.4 21.4 19.9673 21.4 18.2C21.4 16.4327 19.9673 15 18.2 15C16.4327 15 15 16.4327 15 18.2C15 19.9673 16.4327 21.4 18.2 21.4Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M22 22L21 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M8 7H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M9 11H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </g>
                                        <defs>
                                            <clipPath id="clip0_search">
                                                <rect width="24" height="24" fill="white" />
                                            </clipPath>
                                        </defs>
                                    </svg>
                                </button>
                            </div>
                        </form>

                        {/* Sector Filter */}
                        <select
                            value={filters.sector}
                            onChange={handleSectorChange}
                            className="input-field"
                        >
                            <option value="">All Sectors</option>
                            {sectors.map((sector) => (
                                <option key={sector} value={sector}>
                                    {sector}
                                </option>
                            ))}
                        </select>

                        {/* Exchange Filter */}
                        <select
                            value={filters.exchange}
                            onChange={handleExchangeChange}
                            className="input-field"
                        >
                            <option value="">All Exchanges</option>
                            <option value="NSE">NSE</option>
                            <option value="BSE">BSE</option>
                        </select>
                    </div>

                    {/* Active Filters */}
                    {(filters.search || filters.sector || filters.exchange) && (
                        <div className="mt-4 flex items-center gap-2">
                            <span className="text-sm text-neutral-600 dark:text-neutral-400">
                                Active filters:
                            </span>
                            {filters.search && (
                                <span className="px-2 py-1 text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded">
                                    Search: {filters.search}
                                </span>
                            )}
                            {filters.sector && (
                                <span className="px-2 py-1 text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded">
                                    Sector: {filters.sector}
                                </span>
                            )}
                            {filters.exchange && (
                                <span className="px-2 py-1 text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded">
                                    Exchange: {filters.exchange}
                                </span>
                            )}
                            <button
                                onClick={handleClearFilters}
                                className="text-xs text-danger-600 dark:text-danger-400 hover:underline"
                            >
                                Clear all
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Loading State */}
                {loading && (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
                        <p className="mt-4 text-neutral-600 dark:text-neutral-400">
                            Loading stocks...
                        </p>
                    </div>
                )}

                {/* Error State */}
                {error && !loading && (
                    <div className="card bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800">
                        <p className="text-danger-700 dark:text-danger-400">{error}</p>
                    </div>
                )}

                {/* Stocks Grid */}
                {!loading && !error && stocks?.length > 0 && (
                    <>
                        <div className="mb-4 flex items-center justify-between">
                            <div className="text-sm text-neutral-600 dark:text-neutral-400">
                                Showing <span className="font-bold text-neutral-900 dark:text-white">{stocks.length}</span> of <span className="font-bold text-neutral-900 dark:text-white">{pagination.total}</span> stocks
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
                            {stocks.map((stock) => (
                                <StockCard
                                    key={stock._id}
                                    stock={stock}
                                />
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-neutral-200 dark:border-neutral-700 pt-8">
                                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                    Page <span className="font-bold text-neutral-900 dark:text-white">{currentPage}</span> of <span className="font-bold text-neutral-900 dark:text-white">{totalPages}</span>
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="btn-primary py-2 px-4 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Previous
                                    </button>

                                    <div className="hidden sm:flex items-center gap-1">
                                        {[...Array(Math.min(5, totalPages))].map((_, i) => {
                                            let pageNum;
                                            if (totalPages <= 5) {
                                                pageNum = i + 1;
                                            } else if (currentPage <= 3) {
                                                pageNum = i + 1;
                                            } else if (currentPage >= totalPages - 2) {
                                                pageNum = totalPages - 4 + i;
                                            } else {
                                                pageNum = currentPage - 2 + i;
                                            }

                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => handlePageChange(pageNum)}
                                                    className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${currentPage === pageNum
                                                        ? 'bg-primary-500 text-white'
                                                        : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                                                        }`}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <button
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className="btn-primary py-2 px-4 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* No Results */}
                {!loading && !error && stocks?.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-xl text-neutral-600 dark:text-neutral-400 mb-2">
                            No stocks found
                        </p>
                        <p className="text-sm text-neutral-500 dark:text-neutral-500">
                            Try adjusting your filters
                        </p>
                        <button
                            onClick={handleClearFilters}
                            className="mt-4 btn-primary bg-primary-500 hover:bg-primary-600 text-white"
                        >
                            Clear Filters
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StocksWatchlist;
