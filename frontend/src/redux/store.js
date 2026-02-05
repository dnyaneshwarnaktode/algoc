import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import stockReducer from './slices/stockSlice';

const store = configureStore({
    reducer: {
        auth: authReducer,
        stock: stockReducer,
    },
});

export default store;
