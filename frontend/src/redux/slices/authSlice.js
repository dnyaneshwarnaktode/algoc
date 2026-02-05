import { createSlice } from '@reduxjs/toolkit';

// Get user and token from localStorage if available
const userFromStorage = localStorage.getItem('user')
    ? JSON.parse(localStorage.getItem('user'))
    : null;

const tokenFromStorage = localStorage.getItem('token') || null;

const initialState = {
    user: userFromStorage,
    token: tokenFromStorage,
    isAuthenticated: !!tokenFromStorage,
    loading: false,
    error: null,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        // Login/Signup start
        authStart: (state) => {
            state.loading = true;
            state.error = null;
        },
        // Login/Signup success
        authSuccess: (state, action) => {
            state.loading = false;
            state.isAuthenticated = true;
            state.user = action.payload.user;
            state.token = action.payload.token;
            state.error = null;

            // Save to localStorage
            localStorage.setItem('user', JSON.stringify(action.payload.user));
            localStorage.setItem('token', action.payload.token);
        },
        // Login/Signup failure
        authFail: (state, action) => {
            state.loading = false;
            state.isAuthenticated = false;
            state.user = null;
            state.token = null;
            state.error = action.payload;
        },
        // Logout
        logout: (state) => {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            state.loading = false;
            state.error = null;

            // Clear localStorage
            localStorage.removeItem('user');
            localStorage.removeItem('token');
        },
        // Update user data
        updateUser: (state, action) => {
            state.user = { ...state.user, ...action.payload };
            localStorage.setItem('user', JSON.stringify(state.user));
        },
        // Clear error
        clearError: (state) => {
            state.error = null;
        },
    },
});

export const {
    authStart,
    authSuccess,
    authFail,
    logout,
    updateUser,
    clearError,
} = authSlice.actions;

export default authSlice.reducer;
