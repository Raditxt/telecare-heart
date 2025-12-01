// src/components/RoleBasedRoute.jsx
import React from 'react';
import { useParams } from 'react-router-dom';
import RequireAuth from './RequireAuth';

export default function RoleBasedRoute({ 
  children, 
  allowedRoles = [], 
  requirePatientAccess = false,
  fallbackPath = "/unauthorized"
}) {
  const { id } = useParams(); // Patient ID dari URL
  
  return (
    <RequireAuth 
      requiredRole={allowedRoles.length > 0 ? allowedRoles : null}
      patientId={requirePatientAccess ? id : null}
      requirePatientAccess={requirePatientAccess}
      fallbackPath={fallbackPath}
    >
      {children}
    </RequireAuth>
  );
}