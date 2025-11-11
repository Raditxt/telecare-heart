import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getPatients, getMonitoringHistory } from '../../services/patientService';
import styles from './PatientList.module.css';

export default function PatientList() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      setError('');
      
      // Get real patients data from Firebase
      const patientsData = await getPatients();
      
      // Get recent vitals to populate lastHR and lastUpdate
      const recentVitals = await getMonitoringHistory({ limit: 200 });
      
      // Enhance patients data with latest vital information
      const enhancedPatients = patientsData.map(patient => {
        // Find the latest vital for this patient
        const patientVitals = recentVitals
          .filter(vital => vital.uid === patient.id)
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        const latestVital = patientVitals[0] || {};
        
        // Determine status based on latest heart rate
        let status = 'normal';
        if (latestVital.hr) {
          if (latestVital.hr > 90 || latestVital.hr < 60) {
            status = 'critical';
          } else if (latestVital.hr > 85 || latestVital.hr < 65) {
            status = 'warning';
          }
        }
        
        return {
          id: patient.id,
          name: patient.name || 'Unknown Patient',
          email: patient.email || 'No email',
          deviceId: patient.deviceId || 'No device',
          status: patient.status || status,
          lastHR: latestVital.hr || '--',
          lastUpdate: latestVital.timestamp || new Date().toISOString(),
          age: patient.age || '--'
        };
      });

      setPatients(enhancedPatients);
      
    } catch (error) {
      console.error('Error loading patients:', error);
      setError('Failed to load patients data. Please try again.');
      
      // Fallback to empty array if Firebase fails
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.deviceId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'critical': return styles.critical;
      case 'warning': return styles.warning;
      case 'normal': return styles.normal;
      default: return styles.normal;
    }
  };

  const formatLastUpdate = (timestamp) => {
    if (!timestamp || timestamp === '--') return 'No data';
    
    const updateTime = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.round((now - updateTime) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    if (diffInMinutes < 1440) return `${Math.round(diffInMinutes / 60)} hours ago`;
    
    return updateTime.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className={styles.patientList}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          Loading patients...
        </div>
      </div>
    );
  }

  return (
    <div className={styles.patientList}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1>Patient List</h1>
          <p>Manage and monitor all patients</p>
        </div>
        <div className={styles.actions}>
          <div className={styles.searchBox}>
            <input
              type="text"
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
            <span className={styles.searchIcon}>🔍</span>
          </div>
          <button 
            onClick={loadPatients}
            className={styles.refreshButton}
            disabled={loading}
          >
            {loading ? '🔄' : '🔄 Refresh'}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className={styles.errorMessage}>
          {error}
        </div>
      )}

      <div className={styles.tableContainer}>
        <div className={styles.tableHeader}>
          <span className={styles.resultCount}>
            Showing {filteredPatients.length} of {patients.length} patients
          </span>
        </div>

        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Age</th>
              <th>Device ID</th>
              <th>Last Heart Rate</th>
              <th>Status</th>
              <th>Last Update</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPatients.map(patient => (
              <tr key={patient.id}>
                <td className={styles.patientName}>
                  <div className={styles.nameSection}>
                    <div className={styles.avatar}>
                      {patient.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className={styles.name}>{patient.name}</div>
                      <div className={styles.email}>{patient.email}</div>
                    </div>
                  </div>
                </td>
                <td>{patient.age}</td>
                <td className={styles.deviceId}>
                  {patient.deviceId !== 'No device' ? patient.deviceId : '--'}
                </td>
                <td>
                  <span className={styles.heartRate}>
                    {patient.lastHR !== '--' ? (
                      <>
                        {patient.lastHR} <small>BPM</small>
                      </>
                    ) : (
                      '--'
                    )}
                  </span>
                </td>
                <td>
                  <span className={`${styles.status} ${getStatusColor(patient.status)}`}>
                    {patient.status}
                  </span>
                </td>
                <td className={styles.lastUpdate}>
                  {formatLastUpdate(patient.lastUpdate)}
                </td>
                <td>
                  <div className={styles.actionButtons}>
                    <Link 
                      to={`/patients/${patient.id}`} 
                      className={styles.viewButton}
                    >
                      View
                    </Link>
                    <Link 
                      to={`/monitor?patient=${patient.id}`}
                      className={styles.monitorButton}
                    >
                      Monitor
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredPatients.length === 0 && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>👥</div>
            <h3>
              {searchTerm ? 'No patients found' : 'No patients available'}
            </h3>
            <p>
              {searchTerm 
                ? 'No patients match your search criteria' 
                : 'There are no patients registered in the system'
              }
            </p>
            {!searchTerm && (
              <Link to="/register" className={styles.addPatientButton}>
                + Add New Patient
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}