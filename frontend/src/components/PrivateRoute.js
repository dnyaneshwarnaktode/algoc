import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

/**
 * Protected Route Component
 * Redirects to login if user is not authenticated
 */
const PrivateRoute = ({ children }) => {
    const { isAuthenticated } = useSelector((state) => state.auth);

    return isAuthenticated ? children : <Navigate to="/login" replace />;
};

export default PrivateRoute;
