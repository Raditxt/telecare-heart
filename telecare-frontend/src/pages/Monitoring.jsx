import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { patientsApi, vitalsApi } from '../services/api';
import { 
  Activity, Heart, Thermometer, Battery,
  Wifi, WifiOff, AlertTriangle, Clock,
  RefreshCw, Play, Pause, Download
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../components/common/LoadingSpinner';
import VitalChart from '../components/vitals/VitalChart';

const Monitoring = () => {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [liveVitals, setLiveVitals] = useState([]);
  const [isPlaying, setIsPlaying] = useState(true);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadPatients();
    
    // Auto-refresh interval
    const interval = setInterval(() => {
      if (autoRefresh && selectedPatient) {
        loadVitals(selectedPatient);
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [autoRefresh, selectedPatient]);

  const loadPatients = async () => {
    try {
      setLoading(true);
      const response = await patientsApi.getAll({ limit: 20 });
      setPatients(response.data.patients);
      
      // Auto-select first patient
      if (response.data.patients.length > 0 && !selectedPatient) {
        setSelectedPatient(response.data.patients[0].patient_id);
        loadVitals(response.data.patients[0].patient_id);
      }
    } catch (error) {
      toast.error('Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  const loadVitals = async (patientId) => {
    try {
      const response = await vitalsApi.getPatientVitals(patientId, { limit: 30 });
      setLiveVitals(response.data.vitals);
    } catch (error) {
      console.error('Failed to load vitals:', error);
    }
  };

  const handlePatientSelect = (patientId) => {
    setSelectedPatient(patientId);
    loadVitals(patientId);
  };

  const exportVitals = () => {
    if (!selectedPatient) return;
    
    const csvContent = [
      ['Timestamp', 'Heart Rate (BPM)', 'SpO2 (%)', 'Temperature (°C)', 'Status'],
      ...liveVitals.map(v => [
        new Date(v.created_at).toLocaleString(),
        v.heart_rate,
        v.spO2,
        v.temperature,
        v.status
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vitals_${selectedPatient}_${new Date().toISOString()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    toast.success('Vitals exported as CSV');
  };

  const getCurrentVital = () => {
    return liveVitals[0] || null;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'critical': return 'bg-red-500';
      case 'warning': return 'bg-yellow-500';
      case 'normal': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  const currentVital = getCurrentVital();
  const selectedPatientData = patients.find(p => p.patient_id === selectedPatient);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="h-6 w-6" />
            Live Monitoring
          </h1>
          <p className="text-gray-600">Real-time vital signs monitoring</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`p-2 rounded-lg ${autoRefresh ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}
            title="Auto-refresh"
          >
            {autoRefresh ? (
              <Wifi className="h-5 w-5" />
            ) : (
              <WifiOff className="h-5 w-5" />
            )}
          </button>
          
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`p-2 rounded-lg ${isPlaying ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}
          >
            {isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5" />
            )}
          </button>
          
          <button
            onClick={exportVitals}
            className="btn-secondary flex items-center gap-2"
            disabled={!currentVital}
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Patient List */}
        <div className="lg:col-span-1">
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Patients</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {patients.map((patient) => (
                <button
                  key={patient.patient_id}
                  onClick={() => handlePatientSelect(patient.patient_id)}
                  className={`w-full text-left p-4 rounded-lg transition-colors ${
                    selectedPatient === patient.patient_id
                      ? 'bg-primary-50 border border-primary-200'
                      : 'hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">{patient.name}</h3>
                      <p className="text-sm text-gray-600">{patient.room}</p>
                    </div>
                    {patient.latest_status && (
                      <div className={`h-3 w-3 rounded-full ${getStatusColor(patient.latest_status)}`}></div>
                    )}
                  </div>
                  <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {patient.last_reading_time 
                      ? `${getTimeAgo(patient.last_reading_time)}`
                      : 'No data'
                    }
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Monitoring Panel */}
        <div className="lg:col-span-3 space-y-6">
          {/* Current Vital Display */}
          <div className="card">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {selectedPatientData?.name || 'Select a patient'}
                </h2>
                <p className="text-gray-600">
                  {selectedPatientData?.patient_id ? `ID: ${selectedPatientData.patient_id}` : ''}
                </p>
              </div>
              
              {currentVital && (
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(currentVital.status)} text-white`}>
                    {currentVital.status.toUpperCase()}
                  </span>
                  <span className="text-sm text-gray-500 flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {new Date(currentVital.created_at).toLocaleTimeString()}
                  </span>
                </div>
              )}
            </div>
            
            {currentVital ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-8 border-2 border-red-200 rounded-xl bg-red-50">
                  <Heart className="h-12 w-12 mx-auto text-red-600 mb-4" />
                  <div className="text-5xl font-bold text-gray-900 mb-2">
                    {currentVital.heart_rate}
                  </div>
                  <div className="text-lg text-gray-700">Heart Rate</div>
                  <div className="text-sm text-gray-500">Beats per minute</div>
                  <div className="mt-4 text-xs">
                    {currentVital.heart_rate < 60 ? 'Bradycardia' : 
                     currentVital.heart_rate > 100 ? 'Tachycardia' : 
                     'Normal'}
                  </div>
                </div>
                
                <div className="text-center p-8 border-2 border-green-200 rounded-xl bg-green-50">
                  <Battery className="h-12 w-12 mx-auto text-green-600 mb-4" />
                  <div className="text-5xl font-bold text-gray-900 mb-2">
                    {currentVital.spO2}%
                  </div>
                  <div className="text-lg text-gray-700">Oxygen Saturation</div>
                  <div className="text-sm text-gray-500">SpO2 Level</div>
                  <div className="mt-4 text-xs">
                    {currentVital.spO2 < 90 ? 'Hypoxemia' : 
                     currentVital.spO2 < 95 ? 'Mild Hypoxia' : 
                     'Normal'}
                  </div>
                </div>
                
                <div className="text-center p-8 border-2 border-yellow-200 rounded-xl bg-yellow-50">
                  <Thermometer className="h-12 w-12 mx-auto text-yellow-600 mb-4" />
                  <div className="text-5xl font-bold text-gray-900 mb-2">
                    {currentVital.temperature}°
                  </div>
                  <div className="text-lg text-gray-700">Temperature</div>
                  <div className="text-sm text-gray-500">Celsius</div>
                  <div className="mt-4 text-xs">
                    {currentVital.temperature < 36 ? 'Hypothermia' : 
                     currentVital.temperature > 37.5 ? 'Fever' : 
                     'Normal'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Activity className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No vital data available</p>
                <p className="text-sm text-gray-400 mt-1">
                  {selectedPatient ? 'Waiting for IoT device data' : 'Select a patient to monitor'}
                </p>
              </div>
            )}
          </div>

          {/* Real-time Chart */}
          {liveVitals.length > 0 && (
            <div className="card">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Real-time Trends</h2>
                <span className="text-sm text-gray-500">
                  Last {liveVitals.length} readings
                </span>
              </div>
              <div className="h-80">
                <VitalChart 
                  data={liveVitals.slice().reverse()} 
                  type="area" 
                />
              </div>
            </div>
          )}

          {/* Recent Readings */}
          {liveVitals.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Recent Readings</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Time</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Heart Rate</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">SpO2</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Temp</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {liveVitals.slice(0, 10).map((vital) => (
                      <tr key={vital.id}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          {new Date(vital.created_at).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit',
                            second: '2-digit' 
                          })}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Heart className="h-4 w-4 text-red-500" />
                            <span className="font-medium">{vital.heart_rate}</span>
                            <span className="text-xs text-gray-500">BPM</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Battery className="h-4 w-4 text-green-500" />
                            <span className="font-medium">{vital.spO2}</span>
                            <span className="text-xs text-gray-500">%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Thermometer className="h-4 w-4 text-yellow-500" />
                            <span className="font-medium">{vital.temperature}</span>
                            <span className="text-xs text-gray-500">°C</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded text-xs ${getStatusColor(vital.status)} text-white`}>
                            {vital.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
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

export default Monitoring;