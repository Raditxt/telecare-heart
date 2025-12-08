import React from 'react';
import  useAuth  from '../hooks/useAuth';
import DoctorDashboard from '../components/dashboard/DoctorDashboard';
import FamilyDashboard from '../components/dashboard/FamilyDashboard';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Dashboard = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!user) {
    return null;
  }

  return (
    <div>
      {user.role === 'doctor' ? (
        <DoctorDashboard />
      ) : (
        <FamilyDashboard />
      )}
    </div>
  );
};

export default Dashboard;