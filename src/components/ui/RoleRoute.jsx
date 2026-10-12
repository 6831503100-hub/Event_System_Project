import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

// Allows access if the user's role is in `roles`. Admins can always access (for demo/testing).
export default function RoleRoute({ roles, children }) {
  const { user } = useAuth();
  const role = user?.role || 'customer';
  if (role === 'admin' || roles.includes(role)) return children;
  return <Navigate to="/" replace />;
}