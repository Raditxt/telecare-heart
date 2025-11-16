// contexts/AlertProvider.jsx
import React, { useState, useEffect } from 'react';
import { alertService } from '../services/alertService';
import AlertContext from './alertContext';

// ✅ HANYA export default component, tidak ada export named lainnya
export default function AlertProvider({ children }) {
  const [alerts, setAlerts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    critical: 0,
    warning: 0,
    unread: 0
  });

  useEffect(() => {
    // Subscribe to alert service
    const unsubscribe = alertService.subscribe((newAlert) => {
      setAlerts(prev => [newAlert, ...prev]);
      setUnreadCount(prev => prev + 1);
      updateStats();
    });

    // Load initial alerts
    setAlerts(alertService.getActiveAlerts());
    updateStats();

    return unsubscribe;
  }, []);

  const updateStats = () => {
    const newStats = alertService.getAlertStats();
    setStats(newStats);
    setUnreadCount(newStats.unread);
  };

  const markAsRead = (alertId) => {
    alertService.markAsRead(alertId);
    setAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId ? { ...alert, isRead: true } : alert
      )
    );
    updateStats();
  };

  const dismissAlert = (alertId) => {
    alertService.dismissAlert(alertId);
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    updateStats();
  };

  const dismissAll = () => {
    alertService.clearAllAlerts();
    setAlerts([]);
    updateStats();
  };

  const markAllAsRead = () => {
    alerts.forEach(alert => {
      if (!alert.isRead) {
        alertService.markAsRead(alert.id);
      }
    });
    setAlerts(prev => prev.map(alert => ({ ...alert, isRead: true })));
    updateStats();
  };

  const checkVitals = (vitals, patient = null) => {
    return alertService.checkVitals(vitals, patient);
  };

  const value = {
    alerts,
    unreadCount,
    stats,
    markAsRead,
    dismissAlert,
    dismissAll,
    markAllAsRead,
    checkVitals,
    setMuted: alertService.setMuted.bind(alertService)
  };

  return (
    <AlertContext.Provider value={value}>
      {children}
    </AlertContext.Provider>
  );
}