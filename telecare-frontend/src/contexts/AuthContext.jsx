import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../services/api';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const navigate = useNavigate();

  // Define logout as useCallback to avoid infinite loop
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    toast.success('Logged out successfully');
    navigate('/login');
  }, [navigate]);

  // Load user data on init
  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          const response = await api.get('/auth/verify');
          setUser(response.data.user);
        } catch (error) {
          console.error('Failed to load user:', error);
          logout();
        }
      }
      setLoading(false);
    };

    loadUser();
  }, [token, logout]); // Add logout to dependencies

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      setToken(token);
      setUser(user);
      
      toast.success('Login successful!');
      navigate(user.role === 'doctor' ? '/dashboard' : '/patients');
      
      return { success: true };
    } catch (error) {
      toast.error(error.response?.data?.error || 'Login failed');
      return { success: false, error: error.response?.data?.error };
    }
  };

  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      setToken(token);
      setUser(user);
      
      toast.success('Registration successful!');
      navigate(user.role === 'doctor' ? '/dashboard' : '/patients');
      
      return { success: true };
    } catch (error) {
      toast.error(error.response?.data?.error || 'Registration failed');
      return { success: false, error: error.response?.data?.error };
    }
  };

  const updateProfile = async (profileData) => {
    try {
      await api.put(`/auth/profile/${user.id}`, profileData);
      setUser(prev => ({ ...prev, ...profileData }));
      toast.success('Profile updated successfully');
      return { success: true };
    } catch (error) {
      toast.error(error.response?.data?.error || 'Update failed');
      return { success: false };
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateProfile,
    isAuthenticated: !!user,
    isDoctor: user?.role === 'doctor',
    isFamily: user?.role === 'family'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;