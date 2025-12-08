import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../../services/api';
import { 
  Users, Activity, AlertTriangle, Thermometer,
  TrendingUp, Heart, Battery, Clock 
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import VitalChart from '../vitals/VitalChart';
import CriticalAlerts from '../vitals/CriticalAlerts';

const DoctorDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('today');

  useEffect(() => {
    loadDashboardData();
  }, [selectedTimeRange]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [overviewRes, metricsRes] = await Promise.all([
        dashboardApi.getDoctorOverview(),
        dashboardApi.getMetricsSummary(selectedTimeRange)
      ]);
      
      setDashboardData({
        ...overviewRes.data,
        metrics: metricsRes.data.metrics
      });
    } catch (error) {
      toast.error('Failed to load dashboard data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'critical': return 'text-critical';
      case 'warning': return 'text-warning';
      case 'normal': return 'text-normal';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'critical': return <AlertTriangle className="h-5 w-5" />;
      case 'warning': return <Activity className="h-5 w-5" />;
      case 'normal': return <Heart className="h-5 w-5" />;
      default: return <Clock className="h-5 w-5" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-600">Real-time monitoring of all patients</p>
        </div>
        <div className="flex gap-2">
          {['today', 'week', 'month'].map((range) => (
            <button
              key={range}
              onClick={() => setSelectedTimeRange(range)}
              className={`px-4 py-2 rounded-lg ${selectedTimeRange === range ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Patients</p>
              <p className="text-3xl font-bold text-gray-900">
                {dashboardData?.summary.total_patients || 0}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            {dashboardData?.summary.monitored_today || 0} monitored today
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Critical Alerts</p>
              <p className="text-3xl font-bold text-critical">
                {dashboardData?.summary.critical_today || 0}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-critical" />
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            {dashboardData?.summary.warning_today || 0} warnings today
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Heart Rate</p>
              <p className="text-3xl font-bold text-gray-900">
                {Math.round(dashboardData?.metrics.avg_heart_rate || 0)}
              </p>
              <span className="text-xs">BPM</span>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Heart className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            Range: {dashboardData?.metrics.min_heart_rate || 0} - {dashboardData?.metrics.max_heart_rate || 0} BPM
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg SpO2</p>
              <p className="text-3xl font-bold text-gray-900">
                {Math.round(dashboardData?.metrics.avg_spo2 || 0)}
              </p>
              <span className="text-xs">%</span>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Battery className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            Min: {dashboardData?.metrics.min_spo2 || 0}%
          </div>
        </div>
      </div>

      {/* Charts & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Critical Patients */}
        <div className="lg:col-span-2 card">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Critical Patients</h2>
            <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
              {dashboardData?.patients.critical.length || 0} patients
            </span>
          </div>
          
          {dashboardData?.patients.critical.length > 0 ? (
            <div className="space-y-4">
              {dashboardData.patients.critical.map((patient) => (
                <Link
                  key={patient.patient_id}
                  to={`/patients/${patient.patient_id}`}
                  className="block p-4 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium text-gray-900">{patient.name}</h3>
                      <p className="text-sm text-gray-600">Room: {patient.room} • {patient.condition}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`status-badge status-critical flex items-center gap-1`}>
                        <AlertTriangle className="h-4 w-4" />
                        Critical
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{patient.heart_rate} BPM</p>
                        <p className="text-xs text-gray-500">Heart Rate</p>
                      </div>
                    </div>
                  </div>
                  {patient.minutes_since_last_reading > 5 && (
                    <div className="mt-2 text-sm text-yellow-600">
                      ⚠️ No reading for {patient.minutes_since_last_reading} minutes
                    </div>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <AlertTriangle className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p>No critical patients at the moment</p>
            </div>
          )}
        </div>

        {/* Recent Alerts */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Recent Alerts</h2>
          <CriticalAlerts maxAlerts={5} />
        </div>
      </div>

      {/* Patient Status Overview */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">All Patients Status</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Room
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vital Signs
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Reading
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {dashboardData?.patients.total > 0 ? (
                dashboardData.patients.critical
                  .concat(dashboardData.patients.warning)
                  .concat(dashboardData.patients.normal)
                  .map((patient) => (
                    <tr key={patient.patient_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link to={`/patients/${patient.patient_id}`} className="group">
                          <div className="font-medium text-gray-900 group-hover:text-primary-600">
                            {patient.name}
                          </div>
                          <div className="text-sm text-gray-500">ID: {patient.patient_id}</div>
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                          {patient.room || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`status-badge flex items-center gap-1 ${getStatusColor(patient.latest_status)}`}>
                          {getStatusIcon(patient.latest_status)}
                          {patient.latest_status ? patient.latest_status.charAt(0).toUpperCase() + patient.latest_status.slice(1) : 'No Data'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="grid grid-cols-3 gap-2">
                          <div className="text-center">
                            <div className="font-semibold">{patient.heart_rate || '--'}</div>
                            <div className="text-xs text-gray-500">BPM</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold">{patient.spO2 || '--'}</div>
                            <div className="text-xs text-gray-500">SpO2%</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold">{patient.temperature || '--'}</div>
                            <div className="text-xs text-gray-500">°C</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {patient.last_reading_time ? (
                          <>
                            <div>{new Date(patient.last_reading_time).toLocaleTimeString()}</div>
                            <div>{new Date(patient.last_reading_time).toLocaleDateString()}</div>
                          </>
                        ) : (
                          'No readings'
                        )}
                      </td>
                    </tr>
                  ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    No patients assigned yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Daily Statistics Chart */}
      {dashboardData?.daily_statistics && dashboardData.daily_statistics.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Daily Statistics (Last 7 Days)</h2>
          <div className="h-64">
            <VitalChart data={dashboardData.daily_statistics} />
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;