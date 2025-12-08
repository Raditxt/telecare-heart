import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Home = () => {
  const { isAuthenticated, user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (isAuthenticated) {
        // Redirect based on role
        if (user?.role === 'doctor') {
          navigate('/dashboard');
        } else {
          navigate('/patients');
        }
      } else {
        navigate('/login');
      }
    }
  }, [isAuthenticated, loading, navigate, user]);

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return null;
};

export default Home;