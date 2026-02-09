/**
 * Calculate Brokerage and Charges for Indian Equity Trading (Frontend)
 * Matches backend calculation logic
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
export function calculateCharges(type, price, quantity, exchange = 'NSE', segment = 'DELIVERY') {
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
    if (exchange === 'NSE') {
        charges.exchangeTransactionCharge = turnover * 0.0000345; // 0.00345%
    } else if (exchange === 'BSE') {
        charges.exchangeTransactionCharge = turnover * 0.00003; // 0.003%
    }

    // SEBI Charges
    charges.sebiCharges = turnover * 0.000001; // 0.0001%

    // Stamp Duty (only on BUY)
    if (type === 'BUY') {
        charges.stampDuty = turnover * 0.00015; // 0.015%
    }

    // GST (18% on brokerage + exchange transaction charges)
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
