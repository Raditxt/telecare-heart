import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
 // Import dari file yang sama

export default function RequireAuth({ 
  children, 
  requiredRole = null, 
  patientId = null,
  fallbackPath = "/unauthorized" 
}) {
  const { user, loading, hasPermission } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Memeriksa autentikasi...</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check permissions
  if (!hasPermission(requiredRole, patientId)) {
    return <Navigate to={fallbackPath} replace />;
  }

  return children;
}