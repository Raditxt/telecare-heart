import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import  useAuth  from '../../hooks/useAuth'; // Import the useAuth hook from the auth context';
import webSocketService from '../../services/websocket';
import RealTimeAlerts from '../realtime/RealTimeAlerts';

const Layout = () => {
  const { user, token } = useAuth();

  useEffect(() => {
    if (token && user) {
      // Connect WebSocket
      webSocketService.connect(token);
      
      // Subscribe to patient updates if user has patients
      if (user.assignedPatients && user.assignedPatients.length > 0) {
        user.assignedPatients.forEach(patientId => {
          webSocketService.subscribeToPatient(patientId);
        });
      }
    }

    return () => {
      webSocketService.disconnect();
    };
  }, [token, user]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
      
      {/* Real-time Alerts Floating Panel */}
      <div className="fixed bottom-4 right-4 w-96 z-50">
        <RealTimeAlerts />
      </div>
    </div>
  );
};

export default Layout;