import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { patientsApi, vitalsApi, assignmentsApi } from '../../services/api';
import { 
  ArrowLeft, Edit, Download, User, Calendar, Phone, 
  MapPin, Activity, Heart, Thermometer, Battery,
  AlertTriangle, Clock, Users, FileText
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../common/LoadingSpinner';
import VitalChart from '../vitals/VitalChart';

const PatientDetail = () => {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [vitals, setVitals] = useState([]);
  const [assignments, setAssignments] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadPatientData();
  }, [id]);

  const loadPatientData = async () => {
    try {
      setLoading(true);
      const [patientRes, vitalsRes, assignmentsRes] = await Promise.all([
        patientsApi.getById(id),
        vitalsApi.getPatientVitals(id, { limit: 50 }),
        assignmentsApi.getPatientAssignments(id)
      ]);
      
      setPatient(patientRes.data);
      setVitals(vitalsRes.data.vitals);
      setAssignments(assignmentsRes.data);
    } catch (error) {
      toast.error('Failed to load patient data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const exportData = async (format) => {
    try {
      const response = await patientsApi.exportData(id, format);
      if (format === 'csv') {
        const blob = new Blob([response.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `patient_${id}_export.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
      toast.success(`Data exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error('Failed to export data');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'critical':
        return (
          <span className="status-badge status-critical flex items-center gap-1">
            <AlertTriangle className="h-4 w-4" />
            Critical
          </span>
        );
      case 'warning':
        return (
          <span className="status-badge status-warning flex items-center gap-1">
            <Activity className="h-4 w-4" />
            Warning
          </span>
        );
      case 'normal':
        return (
          <span className="status-badge status-normal flex items-center gap-1">
            <Heart className="h-4 w-4" />
            Normal
          </span>
        );
      default:
        return null;
    }
  };

  if (loading || !patient) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            to="/patients"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Patients
          </Link>
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <User className="h-6 w-6" />
                {patient.patient.name}
              </h1>
              <p className="text-gray-600">ID: {patient.patient.patient_id}</p>
            </div>
            {patient.patient.latest_status && getStatusBadge(patient.patient.latest_status)}
          </div>
        </div>
        
        <div className="flex gap-3">
          <Link
            to={`/patients/${id}/edit`}
            className="btn-secondary flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            Edit
          </Link>
          <button
            onClick={() => exportData('csv')}
            className="btn-secondary flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="-mb-px flex space-x-8">
          {['overview', 'vitals', 'assignments', 'reports'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Patient Info */}
          <div className="lg:col-span-1">
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Patient Information</h2>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Date of Birth</p>
                    <p className="font-medium">
                      {patient.patient.date_of_birth 
                        ? new Date(patient.patient.date_of_birth).toLocaleDateString()
                        : 'N/A'}
                      {patient.patient.age && ` (${patient.patient.age} years)`}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Gender</p>
                    <p className="font-medium">{patient.patient.gender || 'N/A'}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Activity className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Room</p>
                    <p className="font-medium">{patient.patient.room || 'N/A'}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-medium">{patient.patient.phone || 'N/A'}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Address</p>
                    <p className="font-medium">{patient.patient.address || 'N/A'}</p>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-600 mb-2">Medical Condition</p>
                  <p className="text-gray-900">{patient.patient.condition || 'No condition specified'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Vital Signs & Charts */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Status */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Current Status</h2>
              
              {patient.vitals.latest ? (
                <div className="grid grid-cols-3 gap-6">
                  <div className="text-center p-6 border rounded-lg">
                    <Heart className="h-8 w-8 mx-auto text-red-500 mb-3" />
                    <div className="text-3xl font-bold text-gray-900">
                      {patient.vitals.latest.heart_rate || '--'}
                    </div>
                    <div className="text-sm text-gray-500">Heart Rate (BPM)</div>
                    <div className={`text-xs mt-2 ${getStatusBadge(patient.vitals.latest.status)}`}>
                      {patient.vitals.latest.status}
                    </div>
                  </div>
                  
                  <div className="text-center p-6 border rounded-lg">
                    <Battery className="h-8 w-8 mx-auto text-green-500 mb-3" />
                    <div className="text-3xl font-bold text-gray-900">
                      {patient.vitals.latest.spO2 || '--'}
                    </div>
                    <div className="text-sm text-gray-500">SpO2 (%)</div>
                  </div>
                  
                  <div className="text-center p-6 border rounded-lg">
                    <Thermometer className="h-8 w-8 mx-auto text-yellow-500 mb-3" />
                    <div className="text-3xl font-bold text-gray-900">
                      {patient.vitals.latest.temperature || '--'}
                    </div>
                    <div className="text-sm text-gray-500">Temperature (°C)</div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Activity className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <p>No vital readings available</p>
                  <p className="text-sm">Waiting for IoT device data</p>
                </div>
              )}
              
              {patient.vitals.latest && (
                <div className="mt-6 text-sm text-gray-500 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Last reading: {new Date(patient.vitals.latest.created_at).toLocaleString()}
                </div>
              )}
            </div>

            {/* Vital Trends Chart */}
            {vitals.length > 0 && (
              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Vital Trends (Last 24 Hours)</h2>
                <div className="h-64">
                  <VitalChart 
                    data={vitals.slice(0, 24)} 
                    type="line" 
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'vitals' && (
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Vital Signs History</h2>
            <span className="text-sm text-gray-500">
              Showing {vitals.length} readings
            </span>
          </div>
          
          {vitals.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Heart Rate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SpO2</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Temperature</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {vitals.map((vital) => (
                    <tr key={vital.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {new Date(vital.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Heart className="h-4 w-4 text-red-500" />
                          <span className="font-medium">{vital.heart_rate} BPM</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Battery className="h-4 w-4 text-green-500" />
                          <span className="font-medium">{vital.spO2}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Thermometer className="h-4 w-4 text-yellow-500" />
                          <span className="font-medium">{vital.temperature}°C</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(vital.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Activity className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p>No vital readings recorded yet</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'assignments' && assignments && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Doctors */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <Users className="h-5 w-5" />
              Assigned Doctors
            </h2>
            
            {assignments.doctors.length > 0 ? (
              <div className="space-y-4">
                {assignments.doctors.map((doctor) => (
                  <div key={doctor.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="h-12 w-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{doctor.name}</h4>
                      <p className="text-sm text-gray-600">{doctor.email}</p>
                      <p className="text-sm text-gray-500">Phone: {doctor.phone || 'N/A'}</p>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(doctor.assigned_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p>No doctors assigned</p>
              </div>
            )}
          </div>

          {/* Family Members */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <Users className="h-5 w-5" />
              Family Members
            </h2>
            
            {assignments.family_members.length > 0 ? (
              <div className="space-y-4">
                {assignments.family_members.map((family) => (
                  <div key={family.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium text-gray-900">{family.name}</h4>
                        <p className="text-sm text-gray-600">
                          {family.relationship || 'Family Member'}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${
                        family.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {family.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{family.email}</p>
                    <p className="text-xs text-gray-500">
                      Assigned by: {family.assigned_by_name} • 
                      {new Date(family.assigned_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p>No family members assigned</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Reports & Analytics
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <button
              onClick={() => exportData('csv')}
              className="p-6 border rounded-lg hover:border-primary-500 hover:shadow-md text-center"
            >
              <Download className="h-8 w-8 mx-auto text-gray-400 mb-3" />
              <div className="font-medium text-gray-900">Export CSV</div>
              <p className="text-sm text-gray-600">All patient data</p>
            </button>
            
            <button className="p-6 border rounded-lg hover:border-primary-500 hover:shadow-md text-center">
              <FileText className="h-8 w-8 mx-auto text-gray-400 mb-3" />
              <div className="font-medium text-gray-900">Daily Report</div>
              <p className="text-sm text-gray-600">24-hour summary</p>
            </button>
            
            <button className="p-6 border rounded-lg hover:border-primary-500 hover:shadow-md text-center">
              <Activity className="h-8 w-8 mx-auto text-gray-400 mb-3" />
              <div className="font-medium text-gray-900">Health Trends</div>
              <p className="text-sm text-gray-600">Weekly analysis</p>
            </button>
          </div>
          
          {/* Statistics Summary */}
          {vitals.length > 0 && (
            <div className="border-t pt-6">
              <h3 className="font-semibold text-gray-900 mb-4">Vital Statistics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">
                    {Math.round(vitals.reduce((sum, v) => sum + (v.heart_rate || 0), 0) / vitals.length)}
                  </div>
                  <div className="text-sm text-gray-600">Avg Heart Rate</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">
                    {Math.round(vitals.reduce((sum, v) => sum + (v.spO2 || 0), 0) / vitals.length)}%
                  </div>
                  <div className="text-sm text-gray-600">Avg SpO2</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">
                    {vitals.filter(v => v.status === 'critical').length}
                  </div>
                  <div className="text-sm text-gray-600">Critical Events</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">
                    {vitals.filter(v => v.status === 'warning').length}
                  </div>
                  <div className="text-sm text-gray-600">Warnings</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PatientDetail;