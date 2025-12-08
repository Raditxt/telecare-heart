import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { patientsApi } from '../../services/api';
import { 
  Users, Search, Filter, Plus, 
  Download, MoreVertical, Eye, Edit, Trash2,
  AlertTriangle, Activity, Heart
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../common/LoadingSpinner';

const PatientList = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedPatient, setSelectedPatient] = useState(null);

  const loadPatients = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        search: searchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        limit: 10
      };
      
      const response = await patientsApi.getAll(params);
      setPatients(response.data.patients);
      setTotalPages(response.data.pagination.pages);
    } catch (error) {
      toast.error('Failed to load patients');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, [page, statusFilter]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchTerm !== '') {
        loadPatients();
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  const handleDelete = async (patientId) => {
    if (!window.confirm('Are you sure you want to delete this patient?')) {
      return;
    }

    try {
      await patientsApi.delete(patientId);
      toast.success('Patient deleted successfully');
      loadPatients();
    } catch (error) {
      toast.error('Failed to delete patient');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'critical':
        return (
          <span className="status-badge status-critical flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Critical
          </span>
        );
      case 'warning':
        return (
          <span className="status-badge status-warning flex items-center gap-1">
            <Activity className="h-3 w-3" />
            Warning
          </span>
        );
      case 'normal':
        return (
          <span className="status-badge status-normal flex items-center gap-1">
            <Heart className="h-3 w-3" />
            Normal
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
            No Data
          </span>
        );
    }
  };

  const exportData = async (format) => {
    try {
      const response = await patientsApi.exportData(selectedPatient, format);
      if (format === 'csv') {
        const blob = new Blob([response.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `patient_${selectedPatient}_export.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
      toast.success(`Data exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error('Failed to export data');
    }
  };

  if (loading && patients.length === 0) {
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
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="h-6 w-6" />
            Patients
          </h1>
          <p className="text-gray-600">Manage and monitor patient data</p>
        </div>
        
        <div className="flex gap-3">
          <Link
            to="/patients/new"
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Patient
          </Link>
          
          {selectedPatient && (
            <div className="relative">
              <button
                onClick={() => exportData('csv')}
                className="btn-secondary flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filters & Search */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search patients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 input-field"
          />
        </div>
        
        <div className="flex gap-2">
          <Filter className="h-5 w-5 text-gray-400 mt-2" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field"
          >
            <option value="all">All Status</option>
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
            <option value="normal">Normal</option>
          </select>
        </div>
        
        <div className="text-sm text-gray-500">
          Showing {patients.length} of {totalPages * 10} patients
        </div>
      </div>

      {/* Patients Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
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
                  Last Reading
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {patients.length > 0 ? (
                patients.map((patient) => (
                  <tr 
                    key={patient.patient_id} 
                    className={`hover:bg-gray-50 ${selectedPatient === patient.patient_id ? 'bg-blue-50' : ''}`}
                    onClick={() => setSelectedPatient(patient.patient_id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link to={`/patients/${patient.patient_id}`} className="group">
                        <div className="font-medium text-gray-900 group-hover:text-primary-600">
                          {patient.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {patient.patient_id} • Age: {patient.age || 'N/A'}
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                        {patient.room || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(patient.latest_status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {patient.last_reading_time ? (
                        <>
                          <div className="text-sm text-gray-900">
                            {new Date(patient.last_reading_time).toLocaleTimeString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(patient.last_reading_time).toLocaleDateString()}
                          </div>
                        </>
                      ) : (
                        <span className="text-gray-400">No readings</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/patients/${patient.patient_id}`}
                          className="p-1 text-gray-400 hover:text-primary-600"
                          title="View Details"
                        >
                          <Eye className="h-5 w-5" />
                        </Link>
                        <Link
                          to={`/patients/${patient.patient_id}/edit`}
                          className="p-1 text-gray-400 hover:text-blue-600"
                          title="Edit"
                        >
                          <Edit className="h-5 w-5" />
                        </Link>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(patient.patient_id);
                          }}
                          className="p-1 text-gray-400 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      <Users className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                      <p>No patients found</p>
                      <p className="text-sm mt-1">
                        {searchTerm ? 'Try a different search term' : 'Add your first patient'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Page <span className="font-medium">{page}</span> of <span className="font-medium">{totalPages}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientList;