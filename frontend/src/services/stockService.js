import api from './api';
import {
    fetchStocksStart,
    fetchStocksSuccess,
    fetchStocksFail,
    setSelectedStock,
    setSectors,
} from '../redux/slices/stockSlice';

/**
 * Fetch all stocks with optional filters
 */
export const fetchStocks = (filters = {}) => async (dispatch) => {
    try {
        dispatch(fetchStocksStart());

        const params = new URLSearchParams();
        if (filters.search) params.append('search', filters.search);
        if (filters.sector) params.append('sector', filters.sector);
        if (filters.exchange) params.append('exchange', filters.exchange);
        if (filters.page) params.append('page', filters.page);
        if (filters.limit) params.append('limit', filters.limit);

        const { data } = await api.get(`/stocks?${params.toString()}`);

        dispatch(fetchStocksSuccess(data));

        return { success: true, data: data.data, pagination: { total: data.total, page: data.page } };
    } catch (error) {
        const message =
            error.response?.data?.message || 'Failed to fetch stocks';
        dispatch(fetchStocksFail(message));
        return { success: false, message };
    }
};

/**
 * Fetch single stock by symbol
 */
export const fetchStockBySymbol = (symbol) => async (dispatch) => {
    try {
        const { data } = await api.get(`/stocks/${symbol}`);

        dispatch(setSelectedStock(data.data));

        return { success: true, data: data.data };
    } catch (error) {
        const message =
            error.response?.data?.message || 'Failed to fetch stock details';
        return { success: false, message };
    }
};

/**
 * Fetch all sectors
 */
export const fetchSectors = () => async (dispatch) => {
    try {
        const { data } = await api.get('/stocks/sectors/list');

        dispatch(setSectors(data.data));

        return { success: true, data: data.data };
    } catch (error) {
        const message =
            error.response?.data?.message || 'Failed to fetch sectors';
        return { success: false, message };
    }
};
