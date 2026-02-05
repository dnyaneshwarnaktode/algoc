import api from './api';
import {
    authStart,
    authSuccess,
    authFail,
    logout as logoutAction,
} from '../redux/slices/authSlice';

/**
 * User signup
 */
export const signup = (userData) => async (dispatch) => {
    try {
        dispatch(authStart());

        const { data } = await api.post('/auth/signup', userData);

        dispatch(authSuccess(data.data));

        return { success: true, data: data.data };
    } catch (error) {
        const message =
            error.response?.data?.message || 'Signup failed. Please try again.';
        dispatch(authFail(message));
        return { success: false, message };
    }
};

/**
 * User login
 */
export const login = (credentials) => async (dispatch) => {
    try {
        dispatch(authStart());

        const { data } = await api.post('/auth/login', credentials);

        dispatch(authSuccess(data.data));

        return { success: true, data: data.data };
    } catch (error) {
        const message =
            error.response?.data?.message || 'Login failed. Please try again.';
        dispatch(authFail(message));
        return { success: false, message };
    }
};

/**
 * Get current user
 */
export const getCurrentUser = () => async (dispatch) => {
    try {
        const { data } = await api.get('/auth/me');

        dispatch(authSuccess({ user: data.data.user, token: localStorage.getItem('token') }));

        return { success: true, data: data.data };
    } catch (error) {
        dispatch(logoutAction());
        return { success: false };
    }
};

/**
 * Update password
 */
export const updatePassword = (passwordData) => async () => {
    try {
        const { data } = await api.put('/auth/password', passwordData);

        return { success: true, message: data.message };
    } catch (error) {
        const message =
            error.response?.data?.message || 'Failed to update password.';
        return { success: false, message };
    }
};

/**
 * Logout
 */
export const logout = () => (dispatch) => {
    dispatch(logoutAction());
};
