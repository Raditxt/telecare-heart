import React, { useState, useEffect } from 'react';
import { AlertTriangle, X, Bell, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import webSocketService from '../../services/websocket';
import  useAuth  from '../../hooks/useAuth';

const RealTimeAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const { isDoctor } = useAuth();

  useEffect(() => {
    // Listen for critical alerts
    webSocketService.on('critical_alert', handleCriticalAlert);
    webSocketService.on('vital_reading', handleVitalUpdate);
    
    return () => {
      webSocketService.off('critical_alert', handleCriticalAlert);
      webSocketService.off('vital_reading', handleVitalUpdate);
    };
  }, []);

  const handleCriticalAlert = (data) => {
    const newAlert = {
      id: Date.now(),
      type: 'critical',
      patientId: data.patient_id,
      message: `Critical alert for patient ${data.patient_id}`,
      vital: data.vital,
      timestamp: new Date().toISOString()
    };
    
    setAlerts(prev => [newAlert, ...prev.slice(0, 9)]);
    
    // Show browser notification
    if (Notification.permission === 'granted') {
      new Notification('🚨 Critical Alert', {
        body: `Patient ${data.patient_id} needs immediate attention`,
        icon: '/vite.svg',
        tag: 'critical-alert'
      });
    }
    
    // Show toast
    toast.error(
      <div>
        <strong>🚨 Critical Alert!</strong>
        <p>Patient {data.patient_id}: Heart Rate {data.vital?.heart_rate} BPM</p>
      </div>,
      {
        duration: 10000,
        icon: '🚨',
        position: 'top-right'
      }
    );
  };

  const handleVitalUpdate = (data) => {
    if (data.vital?.status === 'warning') {
      const newAlert = {
        id: Date.now(),
        type: 'warning',
        patientId: data.patient_id,
        message: `Warning for patient ${data.patient_id}`,
        vital: data.vital,
        timestamp: new Date().toISOString()
      };
      
      setAlerts(prev => [newAlert, ...prev.slice(0, 9)]);
    }
  };

  const handleAcknowledge = (alertId, patientId) => {
    if (isDoctor) {
      webSocketService.acknowledgeAlert(alertId, patientId);
    }
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    toast.success('Alert acknowledged');
  };

  const handleDismiss = (alertId) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const getAlertColor = (type) => {
    switch (type) {
      case 'critical': return 'bg-red-50 border-red-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      default: return 'bg-blue-50 border-blue-200';
    }
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'critical': return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'warning': return <Bell className="h-5 w-5 text-yellow-600" />;
      default: return <Bell className="h-5 w-5 text-blue-600" />;
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Real-time Alerts
        </h3>
        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-sm">
          {alerts.length} active
        </span>
      </div>
      
      {alerts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <CheckCircle className="h-12 w-12 mx-auto text-gray-300 mb-3" />
          <p>No active alerts</p>
          <p className="text-sm mt-1">All systems normal</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-lg border ${getAlertColor(alert.type)}`}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-3">
                  {getAlertIcon(alert.type)}
                  <div>
                    <h4 className="font-medium text-gray-900">
                      Patient {alert.patientId}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Heart Rate: <span className="font-semibold">{alert.vital?.heart_rate} BPM</span>
                      {alert.vital?.spO2 && ` • SpO2: ${alert.vital.spO2}%`}
                      {alert.vital?.temperature && ` • Temp: ${alert.vital.temperature}°C`}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {isDoctor && alert.type === 'critical' && (
                    <button
                      onClick={() => handleAcknowledge(alert.id, alert.patientId)}
                      className="px-3 py-1 bg-primary-600 text-white rounded text-sm hover:bg-primary-700"
                    >
                      Acknowledge
                    </button>
                  )}
                  <button
                    onClick={() => handleDismiss(alert.id)}
                    className="p-1 hover:bg-white rounded"
                  >
                    <X className="h-4 w-4 text-gray-400" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RealTimeAlerts;