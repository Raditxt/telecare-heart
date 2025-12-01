// src/contexts/AuthProvider.jsx
import React, { useState, useEffect } from 'react';
import { AuthContext } from './AuthContext';
import { authService } from '../services/authService';

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        const userData = await authService.verifyToken(token);
        setUser(userData);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('authToken');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const result = await authService.login(email, password);
      
      if (result.success) {
        setUser(result.user);
        localStorage.setItem('authToken', result.token);
        return { success: true, user: result.user };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      return { success: false, error: error.message || 'Login failed' };
    }
  };

  const register = async (userData) => {
    try {
      const result = await authService.register(userData);
      
      if (result.success) {
        setUser(result.user);
        localStorage.setItem('authToken', result.token);
        return { success: true, user: result.user };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      return { success: false, error: error.message || 'Registration failed' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('authToken');
  };

  const updateUser = (updatedData) => {
    setUser(prev => ({ ...prev, ...updatedData }));
  };

  const refreshUserData = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        const userData = await authService.verifyToken(token);
        setUser(userData);
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  };

  // 🔐 PERMISSION LOGIC YANG DIPERBARUI
  const hasPermission = (requiredRole = null, patientId = null) => {
    if (!user) return false;

    console.log('🔐 Permission check:', {
      userRole: user.role,
      requiredRole,
      patientId,
      assignedPatients: user.assignedPatients
    });

    // 1. Admin bisa akses semua
    if (user.role === 'admin') return true;

    // 2. Check jika role tidak sesuai
    if (requiredRole && user.role !== requiredRole) {
      console.log(`🚫 Role mismatch: user is ${user.role}, required ${requiredRole}`);
      return false;
    }

    // 3. Untuk halaman general (tanpa patientId)
    if (!patientId) {
      // Doctor bisa akses semua halaman general
      if (user.role === 'doctor') return true;
      
      // Family hanya bisa akses route family-* dan beberapa umum
      if (user.role === 'family') {
        const currentPath = window.location.pathname;
        const allowedRoutes = [
          '/family-dashboard',
          '/family/patients',
          '/family/history',
          '/family/profile',
          '/system-test'
        ];
        
        const isAllowed = allowedRoutes.some(route => currentPath.startsWith(route));
        console.log(`👥 Family route check: ${currentPath} -> ${isAllowed}`);
        return isAllowed;
      }
      
      return true;
    }

    // 4. Untuk halaman dengan patientId
    if (user.role === 'family') {
      const hasAccess = user.assignedPatients?.includes(patientId);
      console.log(`👥 Family patient access: ${patientId} -> ${hasAccess}`);
      return hasAccess;
    }

    // Doctor dan admin bisa akses semua patient
    return true;
  };

  // Helper function untuk check jika user adalah doctor
  const isDoctor = () => {
    return user?.role === 'doctor';
  };

  // Helper function untuk check jika user adalah family
  const isFamily = () => {
    return user?.role === 'family';
  };

  // Helper function untuk check jika user adalah admin
  const isAdmin = () => {
    return user?.role === 'admin';
  };

  // Get user's display name berdasarkan role
  const getDisplayName = () => {
    if (!user) return '';
    
    if (user.role === 'doctor') {
      return `Dr. ${user.name}`;
    }
    return user.name;
  };

  // Get user's role display text
  const getRoleDisplay = () => {
    if (!user) return '';
    
    const roleMap = {
      'doctor': 'Dokter',
      'family': 'Keluarga Pasien', 
      'admin': 'Administrator'
    };
    
    return roleMap[user.role] || user.role;
  };

  // Check jika user memiliki akses ke patient tertentu
  const canAccessPatient = (patientId) => {
    return hasPermission(null, patientId);
  };

  // Check jika user bisa mengelola data (create, update, delete)
  const canManageData = () => {
    return user?.role === 'admin' || user?.role === 'doctor';
  };

  // Check jika user hanya bisa read-only
  const isReadOnly = () => {
    return user?.role === 'family';
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
    refreshUserData,
    hasPermission,
    isDoctor,
    isFamily,
    isAdmin,
    getDisplayName,
    getRoleDisplay,
    canAccessPatient,
    canManageData,
    isReadOnly
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}