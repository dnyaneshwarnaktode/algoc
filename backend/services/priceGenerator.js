/**
 * Price Generator Service
 * Generates realistic stock price movements
 */
class PriceGenerator {
    constructor() {
        this.stockPrices = new Map();
    }

    /**
     * Initialize stock with base price
     */
    initializeStock(symbol, basePrice) {
        if (!this.stockPrices.has(symbol)) {
            this.stockPrices.set(symbol, {
                currentPrice: basePrice,
                previousPrice: basePrice,
                basePrice: basePrice,
                change: 0,
                changePercent: 0,
                lastUpdate: Date.now(),
            });
        }
    }

    /**
     * Generate next price with realistic movement
     * Uses random walk with mean reversion
     */
    generateNextPrice(symbol) {
        const stock = this.stockPrices.get(symbol);
        if (!stock) return null;

        const { currentPrice, basePrice } = stock;

        // Random walk parameters
        const volatility = 0.002; // 0.2% volatility per update
        const meanReversion = 0.05; // 5% mean reversion strength
        const randomChange = (Math.random() - 0.5) * 2 * volatility;

        // Mean reversion component (pulls price back to base)
        let reversionForce = 0;
        if (basePrice > 0) {
            const deviation = (currentPrice - basePrice) / basePrice;
            reversionForce = -deviation * meanReversion;
        }

        // Calculate new price
        const priceChange = currentPrice * (randomChange + reversionForce);
        const newPrice = currentPrice + priceChange;

        // Ensure price doesn't go below 10% of base or above 200% of base
        const minPrice = basePrice * 0.1;
        const maxPrice = basePrice * 2.0;
        const boundedPrice = Math.max(minPrice, Math.min(maxPrice, newPrice));

        // Calculate change from previous price
        const change = boundedPrice - stock.previousPrice;
        const changePercent = (change / stock.previousPrice) * 100;

        // Update stock data
        this.stockPrices.set(symbol, {
            currentPrice: boundedPrice,
            previousPrice: stock.currentPrice,
            basePrice: basePrice,
            change: change,
            changePercent: changePercent,
            lastUpdate: Date.now(),
        });

        return {
            symbol,
            price: parseFloat(boundedPrice.toFixed(2)),
            change: parseFloat(change.toFixed(2)),
            changePercent: parseFloat(changePercent.toFixed(2)),
            timestamp: Date.now(),
        };
    }

    /**
     * Get current price for a stock
     */
    getCurrentPrice(symbol) {
        const stock = this.stockPrices.get(symbol);
        if (!stock) return null;

        return {
            symbol,
            price: parseFloat(stock.currentPrice.toFixed(2)),
            change: parseFloat(stock.change.toFixed(2)),
            changePercent: parseFloat(stock.changePercent.toFixed(2)),
            timestamp: stock.lastUpdate,
        };
    }

    /**
     * Reset stock to base price
     */
    resetStock(symbol) {
        const stock = this.stockPrices.get(symbol);
        if (stock) {
            this.stockPrices.set(symbol, {
                currentPrice: stock.basePrice,
                previousPrice: stock.basePrice,
                basePrice: stock.basePrice,
                change: 0,
                changePercent: 0,
                lastUpdate: Date.now(),
            });
        }
    }
}

module.exports = new PriceGenerator();
