import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * StockCard Component
 * Displays stock information with base price
 */
const StockCard = ({ stock }) => {
    const navigate = useNavigate();

    const handleClick = () => {
        navigate(`/stocks/${stock.symbol}`);
    };

    // Use base price (no fluctuations)
    const currentPrice = stock.basePrice;

    // Calculate a small random change for display purposes only (not saved)
    const randomChange = (Math.random() - 0.5) * 0.02; // ±1%
    const change = currentPrice * randomChange;
    const changePercent = randomChange * 100;
    const isPositive = change >= 0;

    return (
        <div
            onClick={handleClick}
            className="card hover:shadow-lg transition-all duration-200 cursor-pointer group"
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div>
                    <h3 className="text-lg font-bold text-neutral-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        {stock.symbol}
                    </h3>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-1">
                        {stock.name}
                    </p>
                </div>
                <span className="px-2 py-1 text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded">
                    {stock.exchange}
                </span>
            </div>

            {/* Price */}
            <div className="mb-3">
                <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                    ₹{currentPrice.toFixed(2)}
                </p>
                <div className="flex items-center gap-2 mt-1">
                    <span
                        className={`text-sm font-semibold ${isPositive
                                ? 'text-success-600 dark:text-success-400'
                                : 'text-danger-600 dark:text-danger-400'
                            }`}
                    >
                        {isPositive ? '+' : ''}
                        {change.toFixed(2)} ({isPositive ? '+' : ''}
                        {changePercent.toFixed(2)}%)
                    </span>
                </div>
            </div>

            {/* Details */}
            <div className="pt-3 border-t border-neutral-200 dark:border-neutral-700 space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="text-neutral-600 dark:text-neutral-400">Sector</span>
                    <span className="font-medium text-neutral-900 dark:text-white">
                        {stock.sector}
                    </span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-neutral-600 dark:text-neutral-400">Industry</span>
                    <span className="font-medium text-neutral-900 dark:text-white line-clamp-1">
                        {stock.industry}
                    </span>
                </div>
            </div>

            {/* Hover Effect */}
            <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-700 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-xs text-center text-primary-600 dark:text-primary-400 font-medium">
                    Click to view details →
                </p>
            </div>
        </div>
    );
};

export default StockCard;
