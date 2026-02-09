/**
 * Calculate Brokerage and Charges for Indian Equity Trading
 * Based on FYERS zero brokerage model (only statutory charges)
 * 
 * Charges applicable:
 * - Brokerage: ₹0 (FYERS zero brokerage)
 * - STT (Securities Transaction Tax)
 * - Exchange Transaction Charges
 * - SEBI Charges
 * - Stamp Duty (only on BUY)
 * - GST (on brokerage + transaction charges)
 */

/**
 * Calculate all charges for a trade
 * @param {String} type - 'BUY' or 'SELL'
 * @param {Number} price - Execution price per share
 * @param {Number} quantity - Number of shares
 * @param {String} exchange - 'NSE' or 'BSE' (default: 'NSE')
 * @param {String} segment - 'DELIVERY' or 'INTRADAY' (default: 'DELIVERY')
 * @returns {Object} Charges breakdown
 */
function calculateCharges(type, price, quantity, exchange = 'NSE', segment = 'DELIVERY') {
    const turnover = price * quantity;

    // Initialize charges object
    const charges = {
        brokerage: 0, // FYERS zero brokerage
        stt: 0,
        exchangeTransactionCharge: 0,
        sebiCharges: 0,
        stampDuty: 0,
        gst: 0,
        totalCharges: 0
    };

    // STT (Securities Transaction Tax)
    // On BUY: 0.1% of turnover (only on delivery)
    // On SELL: 0.1% of turnover (delivery) or 0.025% (intraday)
    if (type === 'BUY' && segment === 'DELIVERY') {
        charges.stt = turnover * 0.001; // 0.1%
    } else if (type === 'SELL') {
        if (segment === 'DELIVERY') {
            charges.stt = turnover * 0.001; // 0.1%
        } else if (segment === 'INTRADAY') {
            charges.stt = turnover * 0.00025; // 0.025%
        }
    }

    // Exchange Transaction Charges
    // NSE: 0.00345% of turnover
    // BSE: 0.003% of turnover
    if (exchange === 'NSE') {
        charges.exchangeTransactionCharge = turnover * 0.0000345; // 0.00345%
    } else if (exchange === 'BSE') {
        charges.exchangeTransactionCharge = turnover * 0.00003; // 0.003%
    }

    // SEBI Charges
    // 0.0001% of turnover (₹10 per crore)
    charges.sebiCharges = turnover * 0.000001; // 0.0001%

    // Stamp Duty (only on BUY)
    // 0.015% of turnover (₹150 per crore) - varies by state, using average
    if (type === 'BUY') {
        charges.stampDuty = turnover * 0.00015; // 0.015%
    }

    // GST (Goods and Services Tax)
    // 18% on (brokerage + exchange transaction charges)
    // Since brokerage is 0, GST is only on exchange transaction charges
    const gstBase = charges.brokerage + charges.exchangeTransactionCharge;
    charges.gst = gstBase * 0.18; // 18%

    // Calculate total charges
    charges.totalCharges = 
        charges.brokerage +
        charges.stt +
        charges.exchangeTransactionCharge +
        charges.sebiCharges +
        charges.stampDuty +
        charges.gst;

    // Round all values to 2 decimal places
    Object.keys(charges).forEach(key => {
        if (typeof charges[key] === 'number') {
            charges[key] = Math.round(charges[key] * 100) / 100;
        }
    });

    return charges;
}

/**
 * Calculate net amount for BUY order
 * @param {Number} price - Execution price per share
 * @param {Number} quantity - Number of shares
 * @param {String} exchange - 'NSE' or 'BSE'
 * @param {String} segment - 'DELIVERY' or 'INTRADAY'
 * @returns {Object} { grossAmount, charges, netAmount }
 */
function calculateBuyAmount(price, quantity, exchange = 'NSE', segment = 'DELIVERY') {
    const grossAmount = price * quantity;
    const charges = calculateCharges('BUY', price, quantity, exchange, segment);
    const netAmount = grossAmount + charges.totalCharges;

    return {
        grossAmount: Math.round(grossAmount * 100) / 100,
        charges,
        netAmount: Math.round(netAmount * 100) / 100
    };
}

/**
 * Calculate net amount for SELL order
 * @param {Number} price - Execution price per share
 * @param {Number} quantity - Number of shares
 * @param {String} exchange - 'NSE' or 'BSE'
 * @param {String} segment - 'DELIVERY' or 'INTRADAY'
 * @returns {Object} { grossAmount, charges, netAmount }
 */
function calculateSellAmount(price, quantity, exchange = 'NSE', segment = 'DELIVERY') {
    const grossAmount = price * quantity;
    const charges = calculateCharges('SELL', price, quantity, exchange, segment);
    const netAmount = grossAmount - charges.totalCharges;

    return {
        grossAmount: Math.round(grossAmount * 100) / 100,
        charges,
        netAmount: Math.round(netAmount * 100) / 100
    };
}

/**
 * Calculate P&L including charges
 * @param {Number} buyPrice - Average buy price per share
 * @param {Number} sellPrice - Sell price per share
 * @param {Number} quantity - Number of shares
 * @param {Object} buyCharges - Charges object from buy order
 * @param {Object} sellCharges - Charges object from sell order
 * @param {String} exchange - 'NSE' or 'BSE'
 * @param {String} segment - 'DELIVERY' or 'INTRADAY'
 * @returns {Object} P&L breakdown
 */
function calculatePnL(buyPrice, sellPrice, quantity, buyCharges, sellCharges, exchange = 'NSE', segment = 'DELIVERY') {
    const buyValue = buyPrice * quantity;
    const sellValue = sellPrice * quantity;

    // If charges not provided, calculate them
    if (!buyCharges) {
        buyCharges = calculateCharges('BUY', buyPrice, quantity, exchange, segment);
    }
    if (!sellCharges) {
        sellCharges = calculateCharges('SELL', sellPrice, quantity, exchange, segment);
    }

    const totalBuyCharges = buyCharges.totalCharges || 0;
    const totalSellCharges = sellCharges.totalCharges || 0;
    const totalCharges = totalBuyCharges + totalSellCharges;

    const grossPnL = sellValue - buyValue;
    const netPnL = grossPnL - totalCharges;
    const netPnLPercent = buyValue > 0 ? (netPnL / (buyValue + totalBuyCharges)) * 100 : 0;

    return {
        buyValue: Math.round(buyValue * 100) / 100,
        sellValue: Math.round(sellValue * 100) / 100,
        buyCharges: totalBuyCharges,
        sellCharges: totalSellCharges,
        totalCharges: Math.round(totalCharges * 100) / 100,
        grossPnL: Math.round(grossPnL * 100) / 100,
        netPnL: Math.round(netPnL * 100) / 100,
        netPnLPercent: Math.round(netPnLPercent * 100) / 100
    };
}

module.exports = {
    calculateCharges,
    calculateBuyAmount,
    calculateSellAmount,
    calculatePnL
};
