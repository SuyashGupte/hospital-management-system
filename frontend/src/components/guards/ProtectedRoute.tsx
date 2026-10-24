import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ROUTES } from '../../utils/constants';

interface ProtectedRouteProps {
  allowedRoles?: string[];
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, children }) => {
  const { isAuthenticated, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner description="Checking authentication..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && role) {
    const hasRole = allowedRoles.some(
      (r) => r.toLowerCase() === role.toLowerCase()
    );

    if (!hasRole) {
      return (
        <div style={{ padding: '2rem' }}>
          <h2>Access Denied</h2>
          <p>You do not have the required permissions to access this page.</p>
        </div>
      );
    }
  }

  return children ? <>{children}</> : <Outlet />;
};
