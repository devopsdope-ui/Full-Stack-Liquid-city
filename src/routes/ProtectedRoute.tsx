import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { SidebarLayout } from '../layouts/SidebarLayout';
import type { UserRole } from '../types';

interface ProtectedRouteProps {
  allowedRole: UserRole;
}

export function ProtectedRoute({ allowedRole }: ProtectedRouteProps) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== allowedRole) {
    // Redirect to their own dashboard
    return <Navigate to={`/${user?.role}`} replace />;
  }

  return (
    <SidebarLayout>
      <Outlet />
    </SidebarLayout>
  );
}

export function PublicRoute() {
  const { isAuthenticated, user } = useAuth();

  if (isAuthenticated && user) {
    return <Navigate to={`/${user.role}`} replace />;
  }

  return <Outlet />;
}
