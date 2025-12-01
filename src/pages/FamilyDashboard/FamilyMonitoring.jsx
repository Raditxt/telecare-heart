// src/pages/FamilyDashboard/FamilyMonitoring.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { patientService } from '../../services/patientService';
import styles from './FamilyMonitoring.module.css';

export default function FamilyMonitoring() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const { user, canAccessPatient } = useAuth();
  const [patient, setPatient] = useState(null);
  const [vitals, setVitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [realtimeData, setRealtimeData] = useState(null);

  useEffect(() => {
    // Check permission
    if (!canAccessPatient(patientId)) {
      navigate('/unauthorized');
      return;
    }
    
    loadPatientData();
    
    // Set up realtime updates (simulated)
    const interval = setInterval(fetchRealtimeVitals, 30000); // Every 30 seconds
    
    return () => clearInterval(interval);
  }, [patientId, user]);

  const loadPatientData = async () => {
    try {
      setLoading(true);
      
      // Load patient details
      const patientData = await patientService.getPatient(patientId);
      setPatient(patientData);
      
      // Load vitals history
      const vitalsData = await patientService.getMonitoringHistory(patientId, 10);
      setVitals(vitalsData);
      
      // Load current vitals
      await fetchRealtimeVitals();
      
    } catch (error) {
      console.error('Error loading patient data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRealtimeVitals = async () => {
    try {
      const currentVitals = await patientService.getRealtimeVitals(patientId);
      setRealtimeData(currentVitals);
    } catch (error) {
      console.error('Error fetching realtime vitals:', error);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading patient monitoring data...</p>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className={styles.errorContainer}>
        <h2>Patient Not Found</h2>
        <p>The patient you're looking for doesn't exist or you don't have access.</p>
        <button 
          className={styles.backButton}
          onClick={() => navigate('/family/patients')}
        >
          ← Back to Patients
        </button>
      </div>
    );
  }

  return (
    <div className={styles.familyMonitoring}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <button 
            className={styles.backButton}
            onClick={() => navigate('/family/patients')}
          >
            ← Back to Patients
          </button>
          <h1>❤️ Patient Monitoring</h1>
          <p>Real-time health monitoring for {patient.name}</p>
        </div>
        
        <div className={styles.patientInfo}>
          <div className={styles.patientHeader}>
            <h2>{patient.name}</h2>
            <div className={styles.patientTags}>
              <span className={styles.roomTag}>🏥 Room {patient.room}</span>
              <span className={styles.conditionTag}>{patient.condition}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Realtime Vitals Display */}
      <div className={styles.realtimeSection}>
        <h3>📊 Current Vital Signs</h3>
        {realtimeData ? (
          <div className={styles.vitalsGrid}>
            <div className={`${styles.vitalCard} ${styles.heartRate}`}>
              <div className={styles.vitalIcon}>❤️</div>
              <div className={styles.vitalContent}>
                <h4>Heart Rate</h4>
                <p className={styles.vitalValue}>
                  {realtimeData.heart_rate || '--'} <span className={styles.vitalUnit}>BPM</span>
                </p>
                <small>Last updated: {realtimeData.timestamp ? new Date(realtimeData.timestamp).toLocaleTimeString() : '--'}</small>
              </div>
            </div>
            
            <div className={`${styles.vitalCard} ${styles.bloodPressure}`}>
              <div className={styles.vitalIcon}>🩸</div>
              <div className={styles.vitalContent}>
                <h4>Blood Pressure</h4>
                <p className={styles.vitalValue}>
                  {realtimeData.blood_pressure_systolic || '--'}/{realtimeData.blood_pressure_diastolic || '--'} 
                  <span className={styles.vitalUnit}>mmHg</span>
                </p>
              </div>
            </div>
            
            <div className={`${styles.vitalCard} ${styles.temperature}`}>
              <div className={styles.vitalIcon}>🌡️</div>
              <div className={styles.vitalContent}>
                <h4>Temperature</h4>
                <p className={styles.vitalValue}>
                  {realtimeData.temperature || '--'} <span className={styles.vitalUnit}>°C</span>
                </p>
              </div>
            </div>
            
            <div className={`${styles.vitalCard} ${styles.oxygen}`}>
              <div className={styles.vitalIcon}>💨</div>
              <div className={styles.vitalContent}>
                <h4>Oxygen Saturation</h4>
                <p className={styles.vitalValue}>
                  {realtimeData.oxygen_saturation || '--'} <span className={styles.vitalUnit}>%</span>
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.noData}>
            <p>No real-time data available. The monitoring device might be offline.</p>
          </div>
        )}
      </div>

      {/* Vitals History */}
      <div className={styles.historySection}>
        <div className={styles.sectionHeader}>
          <h3>📈 Vitals History</h3>
          <button 
            className={styles.refreshButton}
            onClick={loadPatientData}
            disabled={loading}
          >
            🔄 Refresh
          </button>
        </div>
        
        {vitals.length > 0 ? (
          <div className={styles.historyTable}>
            <div className={styles.tableHeader}>
              <div className={styles.headerCell}>Time</div>
              <div className={styles.headerCell}>Heart Rate</div>
              <div className={styles.headerCell}>Blood Pressure</div>
              <div className={styles.headerCell}>Temperature</div>
              <div className={styles.headerCell}>Oxygen</div>
            </div>
            
            <div className={styles.tableBody}>
              {vitals.map((record, index) => (
                <div key={index} className={styles.tableRow}>
                  <div className={styles.tableCell}>
                    {record.timestamp ? new Date(record.timestamp).toLocaleString() : '--'}
                  </div>
                  <div className={styles.tableCell}>
                    <span className={styles.vitalValue}>
                      {record.heart_rate || '--'} BPM
                    </span>
                  </div>
                  <div className={styles.tableCell}>
                    <span className={styles.vitalValue}>
                      {record.blood_pressure_systolic || '--'}/{record.blood_pressure_diastolic || '--'} mmHg
                    </span>
                  </div>
                  <div className={styles.tableCell}>
                    <span className={styles.vitalValue}>
                      {record.temperature || '--'} °C
                    </span>
                  </div>
                  <div className={styles.tableCell}>
                    <span className={styles.vitalValue}>
                      {record.oxygen_saturation || '--'} %
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className={styles.noHistory}>
            <p>No historical data available for this patient.</p>
          </div>
        )}
      </div>

      {/* Emergency Contact Section */}
      <div className={styles.emergencySection}>
        <h3>🚨 Important Information</h3>
        <div className={styles.emergencyCard}>
          <div className={styles.emergencyIcon}>📞</div>
          <div className={styles.emergencyContent}>
            <h4>Emergency Contacts</h4>
            <p>If you notice any concerning changes in vital signs, please contact:</p>
            <ul className={styles.contactList}>
              <li>🏥 Hospital Emergency: (021) 1234-5678</li>
              <li>👨‍⚕️ Attending Doctor: Dr. Smith - (021) 9876-5432</li>
              <li>🚑 Ambulance: 112 or 119</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}