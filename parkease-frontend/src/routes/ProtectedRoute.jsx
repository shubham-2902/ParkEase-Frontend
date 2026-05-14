import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PageLoader } from '../components/ui/Spinner';

/**
 * ProtectedRoute — guards routes by auth state and role
 *
 * Props:
 *  allowedRoles → ['DRIVER'] | ['MANAGER'] | ['ADMIN'] | undefined (any)
 *  redirectTo   → path to redirect if not authorized
 */
const ProtectedRoute = ({
  children,
  allowedRoles,
  redirectTo = '/login',
}) => {
  const { isLoggedIn, user, loading } = useAuth();
  const location = useLocation();

  // Still checking localStorage
  if (loading) {
    return <PageLoader message="Checking authorization..." />;
  }

  // Not logged in → redirect to login
  if (!isLoggedIn) {
    return (
      <Navigate
        to={redirectTo}
        state={{ from: location }}
        replace
      />
    );
  }

  // Role check
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // Redirect to their correct dashboard
    const dashboardMap = {
      DRIVER:  '/driver/dashboard',
      MANAGER: '/manager/dashboard',
      ADMIN:   '/admin/dashboard',
    };
    const redirectPath = dashboardMap[user?.role] || '/';
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

export default ProtectedRoute;