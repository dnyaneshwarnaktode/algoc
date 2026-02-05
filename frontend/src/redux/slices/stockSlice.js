import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    stocks: [],
    selectedStock: null,
    sectors: [],
    loading: false,
    error: null,
    filters: {
        search: '',
        sector: '',
        exchange: '',
    },
};

const stockSlice = createSlice({
    name: 'stock',
    initialState,
    reducers: {
        // Fetch stocks start
        fetchStocksStart: (state) => {
            state.loading = true;
            state.error = null;
        },
        // Fetch stocks success
        fetchStocksSuccess: (state, action) => {
            state.loading = false;
            state.stocks = action.payload;
            state.error = null;
        },
        // Fetch stocks failure
        fetchStocksFail: (state, action) => {
            state.loading = false;
            state.error = action.payload;
        },
        // Set selected stock
        setSelectedStock: (state, action) => {
            state.selectedStock = action.payload;
        },
        // Set sectors
        setSectors: (state, action) => {
            state.sectors = action.payload;
        },
        // Update filters
        setFilters: (state, action) => {
            state.filters = { ...state.filters, ...action.payload };
        },
        // Clear filters
        clearFilters: (state) => {
            state.filters = {
                search: '',
                sector: '',
                exchange: '',
            };
        },
        // Update stock price (for real-time updates)
        updateStockPrice: (state, action) => {
            const { symbol, price, change, changePercent } = action.payload;
            const stock = state.stocks.find((s) => s.symbol === symbol);
            if (stock) {
                stock.currentPrice = price;
                stock.change = change;
                stock.changePercent = changePercent;
            }
            if (state.selectedStock?.symbol === symbol) {
                state.selectedStock.currentPrice = price;
                state.selectedStock.change = change;
                state.selectedStock.changePercent = changePercent;
            }
        },
        // Clear error
        clearError: (state) => {
            state.error = null;
        },
    },
});

export const {
    fetchStocksStart,
    fetchStocksSuccess,
    fetchStocksFail,
    setSelectedStock,
    setSectors,
    setFilters,
    clearFilters,
    updateStockPrice,
    clearError,
} = stockSlice.actions;

export default stockSlice.reducer;
