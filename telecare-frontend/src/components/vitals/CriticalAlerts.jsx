import React, { useState, useEffect } from 'react';
import { vitalsApi } from '../../services/api';
import { AlertTriangle, Clock, User, Activity } from 'lucide-react';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../common/LoadingSpinner';

const CriticalAlerts = ({ maxAlerts = 10 }) => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCriticalAlerts();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadCriticalAlerts, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const loadCriticalAlerts = async () => {
    try {
      const response = await vitalsApi.getCriticalAlerts(maxAlerts);
      setAlerts(response.data.alerts);
    } catch (error) {
      console.error('Failed to load critical alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-4">
      {alerts.length === 0 ? (
        <div className="text-center py-6 text-gray-500">
          <AlertTriangle className="h-12 w-12 mx-auto text-gray-300 mb-3" />
          <p>No critical alerts</p>
          <p className="text-sm">All systems normal</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-900">Active Alerts</span>
            <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
              {alerts.length} critical
            </span>
          </div>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="p-4 bg-red-50 border border-red-200 rounded-lg"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {alert.patient_name}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">Room: {alert.room}</p>
                      </div>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {getTimeAgo(alert.created_at)}
                      </span>
                    </div>
                    
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <div className="text-center p-2 bg-white rounded">
                        <div className="font-bold text-red-600">{alert.heart_rate}</div>
                        <div className="text-xs text-gray-500">BPM</div>
                      </div>
                      <div className="text-center p-2 bg-white rounded">
                        <div className="font-bold text-red-600">{alert.spO2}%</div>
                        <div className="text-xs text-gray-500">SpO2</div>
                      </div>
                      <div className="text-center p-2 bg-white rounded">
                        <div className="font-bold text-red-600">{alert.temperature}°</div>
                        <div className="text-xs text-gray-500">Temp</div>
                      </div>
                    </div>
                    
                    <div className="mt-3 flex items-center gap-2">
                      <Activity className="h-4 w-4 text-red-600" />
                      <span className="text-sm text-red-700">Requires immediate attention</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default CriticalAlerts;