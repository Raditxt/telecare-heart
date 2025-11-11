import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { subscribeToVitals, getPatient, getPatientVitals } from '../../services/patientService';
import styles from './RealtimeMonitor.module.css';

export default function RealtimeMonitor() {
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get('patient');
  const [patient, setPatient] = useState(null);
  const [vitals, setVitals] = useState([]);
  const [currentVital, setCurrentVital] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [isAlert, setIsAlert] = useState(false);
  const [loading, setLoading] = useState(true);

  // Memoized loadPatientData function
  const loadPatientData = useCallback(async () => {
    try {
      if (patientId) {
        const patientData = await getPatient(patientId);
        setPatient(patientData);
        
        // Load recent vitals history
        const vitalsHistory = await getPatientVitals(patientId, 50);
        setVitals(vitalsHistory);
      }
    } catch (error) {
      console.error('Error loading patient data:', error);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  // Memoized setupRealtimeSubscription function
  const setupRealtimeSubscription = useCallback(() => {
    if (!patientId) return null;

    const unsubscribe = subscribeToVitals(patientId, (vital) => {
      if (vital) {
        setCurrentVital(vital);
        setVitals(prev => {
          const newVitals = [...prev, vital];
          return newVitals.slice(-50); // Keep last 50 readings
        });
        
        // Check for critical values
        const isCritical = vital.hr > 90 || vital.hr < 60 || vital.spo2 < 95;
        setIsAlert(isCritical);
        
        setConnectionStatus('connected');
      }
    });

    return unsubscribe;
  }, [patientId]);

  // Memoized setupGeneralMonitor function
  const setupGeneralMonitor = useCallback(() => {
    // Simulate real-time data updates for general monitoring
    const interval = setInterval(() => {
      const newHR = Math.floor(Math.random() * 40) + 60; // 60-100 BPM
      const newSpO2 = Math.floor(Math.random() * 5) + 95; // 95-100%
      const newTemp = 36.5 + (Math.random() * 1.5); // 36.5-38°C

      const mockVital = {
        hr: newHR,
        spo2: newSpO2,
        temp: newTemp,
        timestamp: new Date()
      };

      setCurrentVital(mockVital);
      setVitals(prev => {
        const newVitals = [...prev, mockVital];
        return newVitals.slice(-20); // Keep last 20 readings
      });

      // Check for critical values
      setIsAlert(newHR > 90 || newHR < 60 || newSpO2 < 95);
      setConnectionStatus('connected');
    }, 2000);

    setLoading(false);
    
    return interval;
  }, []);

  useEffect(() => {
    let unsubscribe = null;
    let interval = null;

    const initializeMonitor = async () => {
      if (patientId) {
        await loadPatientData();
        unsubscribe = setupRealtimeSubscription();
      } else {
        interval = setupGeneralMonitor();
      }
    };

    initializeMonitor();

    // Cleanup function
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [patientId, loadPatientData, setupRealtimeSubscription, setupGeneralMonitor]);

  const getHRStatus = (hr) => {
    if (!hr) return { status: 'unknown', color: '#6b7280' };
    if (hr < 60) return { status: 'low', color: '#ef4444' };
    if (hr > 90) return { status: 'high', color: '#ef4444' };
    return { status: 'normal', color: '#10b981' };
  };

  const getSpO2Status = (spo2) => {
    if (!spo2) return { status: 'unknown', color: '#6b7280' };
    if (spo2 < 95) return { status: 'low', color: '#ef4444' };
    return { status: 'normal', color: '#10b981' };
  };

  const getTempStatus = (temp) => {
    if (!temp) return { status: 'unknown', color: '#6b7280' };
    if (temp > 37.5) return { status: 'high', color: '#f59e0b' };
    return { status: 'normal', color: '#10b981' };
  };

  // Use current vital data or fallback to 0
  const currentHR = currentVital?.hr || 0;
  const currentSpO2 = currentVital?.spo2 || 0;
  const currentTemp = currentVital?.temp || 0;

  const hrStatus = getHRStatus(currentHR);
  const spo2Status = getSpO2Status(currentSpO2);
  const tempStatus = getTempStatus(currentTemp);

  // Handle alert dismiss
  const handleAlertDismiss = () => {
    setIsAlert(false);
  };

  if (loading) {
    return (
      <div className={styles.monitor}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          Connecting to monitor...
        </div>
      </div>
    );
  }

  return (
    <div className={styles.monitor}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1>Real-Time Monitor</h1>
          <p>
            {patient 
              ? `Live monitoring for ${patient.name}`
              : 'Live patient vital signs monitoring'
            }
          </p>
          {patient && (
            <div className={styles.patientInfo}>
              <span className={styles.patientId}>ID: {patient.id}</span>
              {patient.deviceId && (
                <span className={styles.deviceId}>Device: {patient.deviceId}</span>
              )}
            </div>
          )}
        </div>
        <div className={styles.connectionStatus}>
          <span className={`${styles.status} ${styles[connectionStatus]}`}>
            {connectionStatus === 'connected' ? '🟢 Connected' : '🟡 Connecting'}
          </span>
          <span className={styles.lastUpdate}>
            Last update: {new Date().toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Alert Banner */}
      {isAlert && (
        <div className={styles.alertBanner}>
          <div className={styles.alertContent}>
            <span className={styles.alertIcon}>⚠️</span>
            <div>
              <strong>Critical Alert</strong>
              <p>
                {patient 
                  ? `${patient.name}'s vital signs require attention`
                  : 'Patient vital signs require attention'
                }
              </p>
            </div>
          </div>
          <button 
            className={styles.alertDismiss}
            onClick={handleAlertDismiss}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Vital Signs Grid */}
      <div className={styles.vitalsGrid}>
        <div className={`${styles.vitalCard} ${styles[hrStatus.status]}`}>
          <div className={styles.vitalHeader}>
            <span className={styles.vitalIcon}>❤️</span>
            <h3>Heart Rate</h3>
          </div>
          <div className={styles.vitalValue}>
            {currentHR || '--'} <small>BPM</small>
          </div>
          <div className={styles.vitalStatus}>
            Status: <span style={{ color: hrStatus.color }}>{hrStatus.status}</span>
          </div>
          <div className={styles.vitalRange}>
            Normal: 60-90 BPM
          </div>
        </div>

        <div className={`${styles.vitalCard} ${styles[spo2Status.status]}`}>
          <div className={styles.vitalHeader}>
            <span className={styles.vitalIcon}>🫁</span>
            <h3>SpO₂</h3>
          </div>
          <div className={styles.vitalValue}>
            {currentSpO2 || '--'} <small>%</small>
          </div>
          <div className={styles.vitalStatus}>
            Status: <span style={{ color: spo2Status.color }}>{spo2Status.status}</span>
          </div>
          <div className={styles.vitalRange}>
            Normal: ≥95%
          </div>
        </div>

        <div className={`${styles.vitalCard} ${styles[tempStatus.status]}`}>
          <div className={styles.vitalHeader}>
            <span className={styles.vitalIcon}>🌡️</span>
            <h3>Temperature</h3>
          </div>
          <div className={styles.vitalValue}>
            {currentTemp ? currentTemp.toFixed(1) : '--'} <small>°C</small>
          </div>
          <div className={styles.vitalStatus}>
            Status: <span style={{ color: tempStatus.color }}>{tempStatus.status}</span>
          </div>
          <div className={styles.vitalRange}>
            Normal: 36.5-37.5°C
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className={styles.chartSection}>
        <h3>Heart Rate Trend</h3>
        <div className={styles.chartContainer}>
          <div className={styles.chartPlaceholder}>
            {vitals.length > 0 ? (
              <>
                <div className={styles.chartInfo}>
                  Real-time chart visualization
                </div>
                <div className={styles.chartData}>
                  {vitals.slice(-15).map((vital, index) => (
                    <div
                      key={index}
                      className={styles.chartBar}
                      style={{
                        height: `${((vital.hr - 60) / 40) * 100}%`,
                        backgroundColor: getHRStatus(vital.hr).color
                      }}
                      title={`${vital.hr} BPM`}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className={styles.noData}>
                No vital data available yet
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Readings Table */}
      <div className={styles.readingsSection}>
        <div className={styles.sectionHeader}>
          <h3>Recent Readings</h3>
          <span className={styles.readingCount}>
            {vitals.length} readings
          </span>
        </div>
        <div className={styles.readingsTable}>
          {vitals.length > 0 ? (
            <table>
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
                {vitals.slice(-10).reverse().map((vital, index) => (
                  <tr key={index}>
                    <td>{vital.timestamp.toLocaleTimeString()}</td>
                    <td>
                      <span style={{ color: getHRStatus(vital.hr).color }}>
                        {vital.hr} BPM
                      </span>
                    </td>
                    <td>
                      <span style={{ color: getSpO2Status(vital.spo2).color }}>
                        {vital.spo2}%
                      </span>
                    </td>
                    <td>
                      <span style={{ color: getTempStatus(vital.temp).color }}>
                        {vital.temp.toFixed(1)}°C
                      </span>
                    </td>
                    <td>
                      <span className={`
                        ${styles.statusBadge} 
                        ${getHRStatus(vital.hr).status === 'normal' ? styles.normal : styles.alert}
                      `}>
                        {getHRStatus(vital.hr).status === 'normal' ? 'Normal' : 'Alert'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className={styles.noReadings}>
              <div className={styles.noReadingsIcon}>📊</div>
              <p>No readings available</p>
              <small>Vital signs will appear here when data is received</small>
            </div>
          )}
        </div>
      </div>

      {/* Connection Info */}
      <div className={styles.connectionInfo}>
        <div className={styles.infoItem}>
          <strong>Monitoring:</strong> 
          {patient ? ` ${patient.name}` : ' All Patients'}
        </div>
        <div className={styles.infoItem}>
          <strong>Update Frequency:</strong> Real-time
        </div>
        <div className={styles.infoItem}>
          <strong>Data Source:</strong> 
          {patientId ? ' Patient Device' : ' Demo Data'}
        </div>
      </div>
    </div>
  );
}