// src/pages/FamilyDashboard/FamilyHistory.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { patientService } from '../../services/patientService';
import styles from './FamilyHistory.module.css';

export default function FamilyHistory() {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFamilyPatients();
  }, [user]);

  useEffect(() => {
    if (selectedPatient) {
      loadPatientHistory(selectedPatient);
    }
  }, [selectedPatient]);

  const loadFamilyPatients = async () => {
    try {
      setLoading(true);
      const familyPatients = await patientService.getFamilyPatients(user.userId);
      setPatients(familyPatients);
      if (familyPatients.length > 0) {
        setSelectedPatient(familyPatients[0].patient_id);
      }
    } catch (error) {
      console.error('Error loading family patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPatientHistory = async (patientId) => {
    try {
      setLoading(true);
      const historyData = await patientService.getMonitoringHistory(patientId, 50);
      setHistory(historyData);
    } catch (error) {
      console.error('Error loading patient history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPatientName = (patientId) => {
    const patient = patients.find(p => p.patient_id === patientId);
    return patient ? patient.name : 'Unknown Patient';
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '--';
    return new Date(timestamp).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={styles.familyHistory}>
      <div className={styles.header}>
        <h1>📈 Medical History</h1>
        <p>View historical health data for your loved ones</p>
      </div>

      <div className={styles.content}>
        {/* Patient Selector */}
        <div className={styles.patientSelector}>
          <h3>Select Patient</h3>
          <div className={styles.patientList}>
            {patients.map(patient => (
              <button
                key={patient.patient_id}
                className={`${styles.patientButton} ${selectedPatient === patient.patient_id ? styles.active : ''}`}
                onClick={() => setSelectedPatient(patient.patient_id)}
              >
                <div className={styles.patientButtonContent}>
                  <div className={styles.patientAvatar}>
                    {patient.name.charAt(0)}
                  </div>
                  <div className={styles.patientInfo}>
                    <strong>{patient.name}</strong>
                    <small>Room {patient.room} • {patient.condition}</small>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* History Content */}
        <div className={styles.historyContent}>
          {loading ? (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              <p>Loading history data...</p>
            </div>
          ) : selectedPatient ? (
            <>
              <div className={styles.sectionHeader}>
                <h2>Health History for {getPatientName(selectedPatient)}</h2>
                <button 
                  className={styles.refreshButton}
                  onClick={() => loadPatientHistory(selectedPatient)}
                >
                  🔄 Refresh
                </button>
              </div>

              {history.length > 0 ? (
                <div className={styles.historyTable}>
                  <div className={styles.tableHeader}>
                    <div className={styles.headerCell}>Date & Time</div>
                    <div className={styles.headerCell}>Heart Rate</div>
                    <div className={styles.headerCell}>Blood Pressure</div>
                    <div className={styles.headerCell}>Temperature</div>
                    <div className={styles.headerCell}>Oxygen</div>
                  </div>
                  
                  <div className={styles.tableBody}>
                    {history.map((record, index) => (
                      <div key={index} className={styles.tableRow}>
                        <div className={styles.tableCell}>
                          {formatDate(record.timestamp)}
                        </div>
                        <div className={styles.tableCell}>
                          <span className={`${styles.value} ${styles.heartRate}`}>
                            {record.heart_rate || '--'} BPM
                          </span>
                        </div>
                        <div className={styles.tableCell}>
                          <span className={`${styles.value} ${styles.bloodPressure}`}>
                            {record.blood_pressure_systolic || '--'}/{record.blood_pressure_diastolic || '--'} mmHg
                          </span>
                        </div>
                        <div className={styles.tableCell}>
                          <span className={`${styles.value} ${styles.temperature}`}>
                            {record.temperature || '--'} °C
                          </span>
                        </div>
                        <div className={styles.tableCell}>
                          <span className={`${styles.value} ${styles.oxygen}`}>
                            {record.oxygen_saturation || '--'} %
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className={styles.noData}>
                  <div className={styles.noDataIcon}>📊</div>
                  <h3>No History Data</h3>
                  <p>No historical data available for this patient yet.</p>
                </div>
              )}
            </>
          ) : (
            <div className={styles.noPatient}>
              <div className={styles.noPatientIcon}>👥</div>
              <h3>No Patient Selected</h3>
              <p>Please select a patient from the list to view their history.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}