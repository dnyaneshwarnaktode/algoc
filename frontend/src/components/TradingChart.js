import React, { useEffect, useRef, useState } from 'react';
import { createChart } from 'lightweight-charts';

/**
 * TradingChart Component
 * Displays candlestick chart with static historical data
 * Using lightweight-charts v4.x API
 */
const TradingChart = ({ symbol, currentPrice, basePrice }) => {
    const chartContainerRef = useRef(null);
    const chartRef = useRef(null);
    const candleSeriesRef = useRef(null);
    const [timeframe, setTimeframe] = useState('1D');

    // Initialize chart
    useEffect(() => {
        if (!chartContainerRef.current) return;

        // Clear any existing chart
        if (chartRef.current) {
            chartRef.current.remove();
        }

        // Create chart with v4.x API
        const chart = createChart(chartContainerRef.current, {
            width: chartContainerRef.current.clientWidth,
            height: 500,
            layout: {
                backgroundColor: '#ffffff',
                textColor: '#333',
            },
            grid: {
                vertLines: { color: '#f0f0f0' },
                horzLines: { color: '#f0f0f0' },
            },
            crosshair: {
                mode: 1,
            },
            rightPriceScale: {
                borderColor: '#d1d4dc',
            },
            timeScale: {
                borderColor: '#d1d4dc',
                timeVisible: true,
                secondsVisible: false,
            },
        });

        chartRef.current = chart;

        // Add candlestick series (v4.x method)
        const candleSeries = chart.addCandlestickSeries({
            upColor: '#22c55e',
            downColor: '#ef4444',
            borderUpColor: '#22c55e',
            borderDownColor: '#ef4444',
            wickUpColor: '#22c55e',
            wickDownColor: '#ef4444',
        });

        candleSeriesRef.current = candleSeries;

        // Generate and set historical data
        const price = basePrice || currentPrice || 100;
        const historicalData = generateHistoricalData(price, timeframe);
        candleSeries.setData(historicalData);

        // Fit content to view
        chart.timeScale().fitContent();

        // Handle window resize
        const handleResize = () => {
            if (chartContainerRef.current && chartRef.current) {
                chartRef.current.applyOptions({
                    width: chartContainerRef.current.clientWidth,
                });
            }
        };

        window.addEventListener('resize', handleResize);

        // Cleanup function
        return () => {
            window.removeEventListener('resize', handleResize);
            if (chartRef.current) {
                chartRef.current.remove();
                chartRef.current = null;
            }
        };
    }, [basePrice, currentPrice, timeframe]);

    const timeframes = [
        { label: '1m', value: '1m' },
        { label: '5m', value: '5m' },
        { label: '15m', value: '15m' },
        { label: '1H', value: '1H' },
        { label: '1D', value: '1D' },
    ];

    return (
        <div className="w-full">
            {/* Timeframe Selector */}
            <div className="flex items-center gap-2 mb-4">
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Timeframe:
                </span>
                {timeframes.map((tf) => (
                    <button
                        key={tf.value}
                        onClick={() => setTimeframe(tf.value)}
                        className={`px-3 py-1 text-sm font-medium rounded transition-colors ${timeframe === tf.value
                                ? 'bg-primary-500 text-white'
                                : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600'
                            }`}
                    >
                        {tf.label}
                    </button>
                ))}
            </div>

            {/* Chart Container */}
            <div
                ref={chartContainerRef}
                className="w-full bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700"
                style={{ minHeight: '500px' }}
            />
        </div>
    );
};

/**
 * Generate historical candlestick data
 * Creates realistic-looking price data for the chart
 */
function generateHistoricalData(basePrice, timeframe) {
    const data = [];
    const now = Math.floor(Date.now() / 1000);

    // Determine number of candles and interval based on timeframe
    let numCandles = 100;
    let interval = 60; // seconds

    switch (timeframe) {
        case '1m':
            numCandles = 100;
            interval = 60; // 1 minute
            break;
        case '5m':
            numCandles = 100;
            interval = 300; // 5 minutes
            break;
        case '15m':
            numCandles = 100;
            interval = 900; // 15 minutes
            break;
        case '1H':
            numCandles = 100;
            interval = 3600; // 1 hour
            break;
        case '1D':
            numCandles = 100;
            interval = 86400; // 1 day
            break;
        default:
            interval = 86400;
            break;
    }

    let price = basePrice;

    // Generate candles from past to present
    for (let i = numCandles; i >= 0; i--) {
        const time = now - i * interval;

        // Random price movement (±1% per candle)
        const change = (Math.random() - 0.5) * 0.02;
        price = price * (1 + change);

        // Generate OHLC values
        const open = price;
        const close = price * (1 + (Math.random() - 0.5) * 0.01);
        const high = Math.max(open, close) * (1 + Math.random() * 0.005);
        const low = Math.min(open, close) * (1 - Math.random() * 0.005);

        data.push({
            time: time,
            open: parseFloat(open.toFixed(2)),
            high: parseFloat(high.toFixed(2)),
            low: parseFloat(low.toFixed(2)),
            close: parseFloat(close.toFixed(2)),
        });
    }

    return data;
}

export default TradingChart;
