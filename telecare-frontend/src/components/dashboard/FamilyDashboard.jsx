import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../../services/api';
import { 
  Users, Heart, Activity, AlertTriangle,
  Thermometer, Battery, Clock
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../common/LoadingSpinner';

const FamilyDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await dashboardApi.getFamilyOverview();
      setDashboardData(response.data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'normal': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Family Dashboard</h1>
        <p className="text-gray-600">Monitoring your family members</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Patients Assigned</p>
              <p className="text-3xl font-bold text-gray-900">
                {dashboardData?.summary.total_patients || 0}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Require Attention</p>
              <p className="text-3xl font-bold text-critical">
                {dashboardData?.summary.critical || 0}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-critical" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">All Normal</p>
              <p className="text-3xl font-bold text-normal">
                {dashboardData?.summary.normal || 0}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Heart className="h-6 w-6 text-normal" />
            </div>
          </div>
        </div>
      </div>

      {/* Patients List */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Your Family Members</h2>
        
        {dashboardData?.patients.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dashboardData.patients.map((patient) => (
              <Link
                key={patient.patient_id}
                to={`/patients/${patient.patient_id}`}
                className="border rounded-lg p-6 hover:border-primary-500 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">{patient.name}</h3>
                    <p className="text-sm text-gray-600">{patient.relationship}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(patient.latest_status)}`}>
                    {patient.latest_status || 'No Data'}
                  </span>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Heart className="h-4 w-4" />
                      <span className="text-sm">Heart Rate</span>
                    </div>
                    <span className="font-semibold">{patient.heart_rate || '--'} BPM</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Battery className="h-4 w-4" />
                      <span className="text-sm">SpO2</span>
                    </div>
                    <span className="font-semibold">{patient.spO2 || '--'}%</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Thermometer className="h-4 w-4" />
                      <span className="text-sm">Temperature</span>
                    </div>
                    <span className="font-semibold">{patient.temperature || '--'}°C</span>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {patient.last_reading_time ? (
                      <span>{getTimeAgo(patient.last_reading_time)}</span>
                    ) : (
                      <span>No readings</span>
                    )}
                  </div>
                  <span className="text-primary-600 hover:text-primary-700">
                    View Details →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <Users className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <p>No patients assigned to you yet</p>
            <p className="text-sm mt-1">Contact the doctor to be assigned to a patient</p>
          </div>
        )}
      </div>

      {/* Recent Alerts */}
      {dashboardData?.alerts && dashboardData.alerts.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Recent Alerts</h2>
          <div className="space-y-3">
            {dashboardData.alerts.slice(0, 5).map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border ${
                  alert.status === 'critical' 
                    ? 'bg-red-50 border-red-200' 
                    : 'bg-yellow-50 border-yellow-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {alert.status === 'critical' ? (
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                    ) : (
                      <Activity className="h-5 w-5 text-yellow-600" />
                    )}
                    <div>
                      <h4 className="font-medium text-gray-900">{alert.patient_name}</h4>
                      <p className="text-sm text-gray-600">Room: {alert.room}</p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">
                    {getTimeAgo(alert.created_at)}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <div className="text-center">
                    <div className="font-semibold">{alert.heart_rate} BPM</div>
                    <div className="text-xs text-gray-500">Heart Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold">{alert.spO2}%</div>
                    <div className="text-xs text-gray-500">SpO2</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold">{alert.temperature}°C</div>
                    <div className="text-xs text-gray-500">Temperature</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function
function getTimeAgo(timestamp) {
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
}

export default FamilyDashboard;