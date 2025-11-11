import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import styles from './PatientDetail.module.css';

export default function PatientDetail() {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [vitals, setVitals] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPatientData();
  }, [id]);

  const loadPatientData = async () => {
    try {
      // Mock data - replace with actual API call
      const mockPatient = {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        age: 65,
        gender: 'Male',
        deviceId: 'ESP32-A1B2C3',
        status: 'critical',
        lastHR: 95,
        lastSpO2: 96,
        lastTemp: 37.2,
        lastUpdate: new Date('2024-01-15T10:30:00Z'),
        address: '123 Main Street, Jakarta',
        phone: '+62 812-3456-7890',
        emergencyContact: 'Jane Doe (+62 813-9876-5432)',
        medicalNotes: 'Patient has history of hypertension. Monitor BP regularly.'
      };

      const mockVitals = [
        { timestamp: new Date('2024-01-15T10:30:00Z'), hr: 95, spo2: 96, temp: 37.2, status: 'critical' },
        { timestamp: new Date('2024-01-15T10:25:00Z'), hr: 92, spo2: 97, temp: 37.1, status: 'warning' },
        { timestamp: new Date('2024-01-15T10:20:00Z'), hr: 88, spo2: 98, temp: 36.9, status: 'normal' },
        { timestamp: new Date('2024-01-15T10:15:00Z'), hr: 85, spo2: 98, temp: 36.8, status: 'normal' },
        { timestamp: new Date('2024-01-15T10:10:00Z'), hr: 82, spo2: 99, temp: 36.7, status: 'normal' },
      ];

      setPatient(mockPatient);
      setVitals(mockVitals);
    } catch (error) {
      console.error('Error loading patient data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'critical': return styles.critical;
      case 'warning': return styles.warning;
      case 'normal': return styles.normal;
      default: return styles.normal;
    }
  };

  const getHRStatus = (hr) => {
    if (hr < 60) return 'low';
    if (hr > 90) return 'high';
    return 'normal';
  };

  if (loading) {
    return <div className={styles.loading}>Loading patient data...</div>;
  }

  if (!patient) {
    return <div className={styles.notFound}>Patient not found</div>;
  }

  return (
    <div className={styles.patientDetail}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.breadcrumb}>
          <Link to="/patients" className={styles.backLink}>← Back to Patients</Link>
        </div>
        <div className={styles.headerContent}>
          <div className={styles.patientHeader}>
            <div className={styles.avatar}>
              {patient.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className={styles.patientInfo}>
              <h1>{patient.name}</h1>
              <div className={styles.meta}>
                <span>Age: {patient.age}</span>
                <span>•</span>
                <span>{patient.gender}</span>
                <span>•</span>
                <span className={`${styles.status} ${getStatusColor(patient.status)}`}>
                  {patient.status}
                </span>
              </div>
            </div>
          </div>
          <div className={styles.headerActions}>
            <Link 
              to={`/monitor?patient=${patient.id}`}
              className={styles.monitorButton}
            >
              📊 Real-time Monitor
            </Link>
            <button className={styles.messageButton}>
              💬 Send Message
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'overview' ? styles.active : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'vitals' ? styles.active : ''}`}
          onClick={() => setActiveTab('vitals')}
        >
          Vital History
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'medical' ? styles.active : ''}`}
          onClick={() => setActiveTab('medical')}
        >
          Medical Info
        </button>
      </div>

      {/* Tab Content */}
      <div className={styles.tabContent}>
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className={styles.overview}>
            <div className={styles.overviewGrid}>
              {/* Current Vitals */}
              <div className={styles.vitalsCard}>
                <h3>Current Vital Signs</h3>
                <div className={styles.vitalsGrid}>
                  <div className={styles.vitalItem}>
                    <span className={styles.vitalLabel}>Heart Rate</span>
                    <span className={`${styles.vitalValue} ${styles[getHRStatus(patient.lastHR)]}`}>
                      {patient.lastHR} BPM
                    </span>
                    <span className={styles.vitalTime}>
                      Last updated: {patient.lastUpdate.toLocaleTimeString()}
                    </span>
                  </div>
                  <div className={styles.vitalItem}>
                    <span className={styles.vitalLabel}>SpO₂</span>
                    <span className={styles.vitalValue}>
                      {patient.lastSpO2}%
                    </span>
                  </div>
                  <div className={styles.vitalItem}>
                    <span className={styles.vitalLabel}>Temperature</span>
                    <span className={styles.vitalValue}>
                      {patient.lastTemp}°C
                    </span>
                  </div>
                </div>
              </div>

              {/* Device Info */}
              <div className={styles.infoCard}>
                <h3>Device Information</h3>
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Device ID</span>
                    <span className={styles.infoValue}>{patient.deviceId}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Connection</span>
                    <span className={styles.connected}>🟢 Connected</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Last Sync</span>
                    <span className={styles.infoValue}>
                      {patient.lastUpdate.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className={styles.infoCard}>
                <h3>Contact Information</h3>
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Phone</span>
                    <span className={styles.infoValue}>{patient.phone}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Emergency Contact</span>
                    <span className={styles.infoValue}>{patient.emergencyContact}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Address</span>
                    <span className={styles.infoValue}>{patient.address}</span>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className={styles.statsCard}>
                <h3>Today's Summary</h3>
                <div className={styles.statsGrid}>
                  <div className={styles.statItem}>
                    <span className={styles.statNumber}>
                      {vitals.filter(v => v.status === 'critical').length}
                    </span>
                    <span className={styles.statLabel}>Critical Events</span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statNumber}>
                      {vitals.length}
                    </span>
                    <span className={styles.statLabel}>Total Readings</span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statNumber}>
                      {Math.round(vitals.reduce((sum, v) => sum + v.hr, 0) / vitals.length)}
                    </span>
                    <span className={styles.statLabel}>Avg Heart Rate</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Vital History Tab */}
        {activeTab === 'vitals' && (
          <div className={styles.vitalsHistory}>
            <div className={styles.sectionHeader}>
              <h3>Vital Sign History</h3>
              <button className={styles.exportButton}>📥 Export Data</button>
            </div>
            
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Heart Rate</th>
                    <th>SpO₂</th>
                    <th>Temperature</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {vitals.map((vital, index) => (
                    <tr key={index}>
                      <td className={styles.timestamp}>
                        {vital.timestamp.toLocaleString()}
                      </td>
                      <td>
                        <span className={`${styles.vitalValue} ${styles[getHRStatus(vital.hr)]}`}>
                          {vital.hr} BPM
                        </span>
                      </td>
                      <td>
                        <span className={styles.vitalValue}>
                          {vital.spo2}%
                        </span>
                      </td>
                      <td>
                        <span className={styles.vitalValue}>
                          {vital.temp}°C
                        </span>
                      </td>
                      <td>
                        <span className={`${styles.status} ${getStatusColor(vital.status)}`}>
                          {vital.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Simple Chart Visualization */}
            <div className={styles.chartSection}>
              <h4>Heart Rate Trend</h4>
              <div className={styles.chartContainer}>
                <div className={styles.chart}>
                  {vitals.map((vital, index) => (
                    <div
                      key={index}
                      className={styles.chartBar}
                      style={{
                        height: `${((vital.hr - 60) / 40) * 100}%`,
                        backgroundColor: getHRStatus(vital.hr) === 'normal' ? '#10b981' : '#ef4444'
                      }}
                      title={`${vital.hr} BPM`}
                    />
                  ))}
                </div>
                <div className={styles.chartLabels}>
                  {vitals.map((vital, index) => (
                    <span key={index} className={styles.chartLabel}>
                      {vital.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Medical Info Tab */}
        {activeTab === 'medical' && (
          <div className={styles.medicalInfo}>
            <div className={styles.medicalSection}>
              <h3>Medical Notes</h3>
              <div className={styles.notes}>
                {patient.medicalNotes}
              </div>
            </div>

            <div className={styles.medicalSection}>
              <h3>Medications</h3>
              <div className={styles.medicationList}>
                <div className={styles.medicationItem}>
                  <span className={styles.medName}>Lisinopril 10mg</span>
                  <span className={styles.medDosage}>Once daily</span>
                  <span className={styles.medPurpose}>Hypertension</span>
                </div>
                <div className={styles.medicationItem}>
                  <span className={styles.medName}>Aspirin 81mg</span>
                  <span className={styles.medDosage}>Once daily</span>
                  <span className={styles.medPurpose}>Blood thinner</span>
                </div>
              </div>
            </div>

            <div className={styles.medicalSection}>
              <h3>Allergies</h3>
              <div className={styles.allergies}>
                <span className={styles.allergyTag}>Penicillin</span>
                <span className={styles.allergyTag}>Sulfa drugs</span>
              </div>
            </div>

            <div className={styles.medicalSection}>
              <h3>Medical History</h3>
              <ul className={styles.historyList}>
                <li>Hypertension (diagnosed 2018)</li>
                <li>Type 2 Diabetes (diagnosed 2020)</li>
                <li>High Cholesterol</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}