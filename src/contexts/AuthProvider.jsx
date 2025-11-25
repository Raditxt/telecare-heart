// src/contexts/AuthProvider.jsx
import React, { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { AuthContext } from './AuthContext';

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

  const hasPermission = (requiredRole = null, patientId = null) => {
    if (!user) return false;

    // Admin bisa akses semua
    if (user.role === 'admin') return true;

    // Check role permission
    if (requiredRole && user.role !== requiredRole) {
      return false;
    }

    // Doctor bisa akses semua patient yang di-assign
    if (user.role === 'doctor') {
      if (!patientId) return true; // Akses general
      return user.assignedPatients?.includes(patientId);
    }

    // Family hanya bisa akses patient yang terkait
    if (user.role === 'family') {
      if (!patientId) return false; // Tidak bisa akses general patient list
      return user.assignedPatients?.includes(patientId);
    }

    return false;
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
    getRoleDisplay
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}