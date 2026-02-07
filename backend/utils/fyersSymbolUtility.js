const axios = require('axios');
const csv = require('csv-parse/sync');
const Stock = require('../models/Stock');

/**
 * Utility to fetch and sync symbol master from Fyers
 */
class FyersSymbolUtility {
    constructor() {
        this.NSE_CM_URL = 'https://public.fyers.in/sym_details/NSE_CM.csv';
        this.BSE_CM_URL = 'https://public.fyers.in/sym_details/BSE_CM.csv';
    }

    /**
     * Sync NSE and BSE stocks
     */
    async syncAllStocks() {
        console.log('🔄 Starting full Fyers symbol sync...');

        try {
            const nseStocks = await this.fetchAndParse(this.NSE_CM_URL, 'NSE');
            const bseStocks = await this.fetchAndParse(this.BSE_CM_URL, 'BSE');

            const allStocks = [...nseStocks, ...bseStocks];

            console.log(`📊 Found ${allStocks.length} total stocks from Fyers. Updating database...`);

            // We'll update or insert to avoid duplicates
            // Using a bulk operation for efficiency
            const bulkOps = allStocks.map(stock => ({
                updateOne: {
                    filter: { symbol: stock.symbol },
                    update: { $set: stock },
                    upsert: true
                }
            }));

            // Process in chunks of 1000 to avoid memory issues
            const chunkSize = 1000;
            let processed = 0;

            for (let i = 0; i < bulkOps.length; i += chunkSize) {
                const chunk = bulkOps.slice(i, i + chunkSize);
                await Stock.bulkWrite(chunk);
                processed += chunk.length;
                console.log(`✅ Processed ${processed}/${allStocks.length} stocks...`);
            }

            return {
                success: true,
                total: allStocks.length,
                nseCount: nseStocks.length,
                bseCount: bseStocks.length
            };
        } catch (error) {
            console.error('❌ Sync failed:', error);
            throw error;
        }
    }

    /**
     * Fetch CSV and parse it
     */
    async fetchAndParse(url, exchange) {
        try {
            console.log(`📥 Downloading ${exchange} symbol master...`);
            const response = await axios.get(url);
            const content = response.data;

            const records = csv.parse(content, {
                columns: false,
                skip_empty_lines: true
            });

            return records.map(row => {
                // Column 9: Trading Symbol (e.g., NSE:RELIANCE-EQ)
                // Column 1: Description (e.g., RELIANCE INDUSTRIES LTD)
                // Column 13: Pure Symbol (e.g., RELIANCE)

                const fyersSymbol = row[9];
                const pureSymbol = row[13] || (fyersSymbol ? fyersSymbol.split(':')[1]?.split('-')[0] : '');
                const name = row[1];

                return {
                    symbol: pureSymbol || fyersSymbol,
                    name: name || pureSymbol,
                    exchange: exchange,
                    isActive: true,
                    sector: 'Others', // Default
                    tradingSymbol: fyersSymbol,
                    basePrice: Math.floor(Math.random() * (2000 - 100 + 1)) + 100 // Default random price between 100 and 2000
                };
            }).filter(s => s.symbol); // Filter out empty symbols

        } catch (error) {
            console.error(`❌ Error fetching ${exchange} symbols:`, error.message);
            return [];
        }
    }
}

module.exports = new FyersSymbolUtility();
