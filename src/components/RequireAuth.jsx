// src/components/RequireAuth.jsx
import React from 'react';
import { Navigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function RequireAuth({ 
  children, 
  requiredRole = null, 
  patientId = null,
  requirePatientAccess = false,
  fallbackPath = "/unauthorized" 
}) {
  const { user, loading, hasPermission } = useAuth();
  const location = useLocation();
  const params = useParams();

  // Extract patientId from URL if requirePatientAccess is true
  const actualPatientId = requirePatientAccess ? (params.id || params.patientId) : patientId;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Checking authentication...</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Special handling: Jika family mencoba akses dashboard doctor, redirect ke family-dashboard
  if (location.pathname === '/dashboard' && user.role === 'family') {
    console.log('👥 Redirecting family from doctor dashboard to family dashboard');
    return <Navigate to="/family-dashboard" replace />;
  }

  // Special handling: Jika doctor mencoba akses family dashboard, redirect ke dashboard
  if (location.pathname.startsWith('/family') && user.role === 'doctor') {
    console.log('👨‍⚕️ Redirecting doctor from family dashboard to doctor dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  // Check if children is a function (for conditional rendering)
  const isChildrenFunction = typeof children === 'function';

  // For function children, we just need to check if user exists
  if (isChildrenFunction) {
    // If specific role is required, check it
    if (requiredRole && user.role !== requiredRole) {
      console.warn(`🚫 Role mismatch: user is ${user.role}, required ${requiredRole}`);
      return <Navigate to={fallbackPath} replace />;
    }
    
    // Return the function with user as parameter
    return children(user);
  }

  // For regular element children, do full permission check
  const hasAccess = hasPermission(requiredRole, actualPatientId);
  
  console.log('🔐 Access Check:', {
    user: user.role,
    requiredRole,
    patientId: actualPatientId,
    hasAccess,
    path: location.pathname,
    isFunction: isChildrenFunction
  });

  if (!hasAccess) {
    console.warn('🚫 Access denied for:', user.role, 'to', location.pathname);
    return <Navigate to={fallbackPath} replace />;
  }

  return children;
}