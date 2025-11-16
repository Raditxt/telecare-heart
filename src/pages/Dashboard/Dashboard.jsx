// pages/Dashboard.jsx (Updated)
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useAlerts } from '../../hooks/useAlerts'; // ✅ Import yang benar
import { getMonitoringHistory, getRealtimeVitals } from '../../services/patientService';
import StatsCard from '../../components/Ui/StatsCard';
import ECGChart from '../../components/Charts/ECGChart';
import ConnectionStatus from '../../components/Ui/ConnectionStatus';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const { user } = useAuth();
  const { checkVitals } = useAlerts(); // ✅ Gunakan hook
  const [vitals, setVitals] = useState({
    heartRate: '--',
    spO2: '--',
    temperature: '--',
    ecgData: [],
    status: 'normal',
    deviceConnected: false,
    lastUpdate: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadDashboardData();
    
    let interval;
    if (autoRefresh) {
      interval = setInterval(() => {
        loadDashboardData();
      }, 5000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const loadDashboardData = async () => {
    try {
      setError('');
      
      // Ambil data real-time
      const realtimeData = await getRealtimeVitals(user.uid);
      
      // Ambil history untuk ECG chart
      const historyData = await getMonitoringHistory({ 
        uid: user.uid, 
        limit: 50 
      });

      // Process ECG data untuk chart
      const ecgData = historyData.map(record => ({
        time: record.timestamp ? new Date(record.timestamp).toLocaleTimeString() : '',
        value: record.hr || 0
      }));

      // Tentukan status kesehatan
      const status = determineHealthStatus(
        realtimeData.heartRate, 
        realtimeData.spO2, 
        realtimeData.temperature
      );

      const newVitals = {
        heartRate: realtimeData.heartRate || '--',
        spO2: realtimeData.spO2 || '--',
        temperature: realtimeData.temperature || '--',
        ecgData: ecgData,
        status: status,
        deviceConnected: !!realtimeData.deviceId,
        deviceId: realtimeData.deviceId || 'Not Connected',
        lastUpdate: realtimeData.timestamp || new Date()
      };

      setVitals(newVitals);

      // ✅ Check alerts dengan data yang valid
      if (realtimeData.heartRate && realtimeData.spO2 && realtimeData.temperature) {
        checkVitals({
          heartRate: parseInt(realtimeData.heartRate) || 0,
          spO2: parseInt(realtimeData.spO2) || 0,
          temperature: parseFloat(realtimeData.temperature) || 0,
          deviceConnected: !!realtimeData.deviceId
        }, {
          id: user.uid,
          name: user.name || user.email,
          deviceId: realtimeData.deviceId
        });
      }

    } catch (err) {
      console.error('Dashboard error:', err);
      setError('Gagal memuat data monitoring. Menggunakan data simulasi.');
      
      // Fallback ke data dummy
      const dummyData = getDummyData();
      setVitals(dummyData);
      
      // ✅ Check alerts untuk dummy data juga
      checkVitals({
        heartRate: parseInt(dummyData.heartRate) || 0,
        spO2: parseInt(dummyData.spO2) || 0,
        temperature: parseFloat(dummyData.temperature) || 0,
        deviceConnected: dummyData.deviceConnected
      }, {
        id: user.uid,
        name: user.name || user.email,
        deviceId: dummyData.deviceId
      });
    } finally {
      setLoading(false);
    }
  };

  const determineHealthStatus = (hr, spO2, temp) => {
    const heartRate = parseInt(hr);
    const oxygen = parseInt(spO2);
    const temperature = parseFloat(temp);

    if (isNaN(heartRate) || isNaN(oxygen) || isNaN(temperature)) {
      return 'normal';
    }

    if (heartRate > 120 || heartRate < 50 || oxygen < 90 || temperature > 38.5) {
      return 'critical';
    } else if (heartRate > 100 || heartRate < 60 || oxygen < 95 || temperature > 37.5) {
      return 'warning';
    }
    return 'normal';
  };

  const getDummyData = () => {
    const heartRate = Math.floor(Math.random() * 40) + 60; // 60-100 BPM
    const spO2 = Math.floor(Math.random() * 6) + 95; // 95-100%
    const temperature = (Math.random() * 1.5) + 36.5; // 36.5-38°C
    
    return {
      heartRate,
      spO2,
      temperature: temperature.toFixed(1),
      ecgData: Array.from({ length: 20 }, (_, i) => ({
        time: `${i}s`,
        value: heartRate + Math.sin(i) * 10
      })),
      status: determineHealthStatus(heartRate, spO2, temperature),
      deviceConnected: true,
      deviceId: 'ESP32-A1B2C3',
      lastUpdate: new Date()
    };
  };

  const formatLastUpdate = (timestamp) => {
    if (!timestamp) return 'Never';
    const now = new Date();
    const diff = (now - new Date(timestamp)) / 1000;
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    return new Date(timestamp).toLocaleTimeString();
  };

  if (loading) {
    return (
      <div className={styles.dashboard}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading real-time monitoring...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      {/* Header dengan Connection Status */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>Real-Time Monitoring</h1>
          <p>Monitoring kesehatan jantung pasien secara real-time</p>
        </div>
        <div className={styles.headerRight}>
          <ConnectionStatus 
            isConnected={vitals.deviceConnected}
            deviceId={vitals.deviceId}
            lastUpdate={vitals.lastUpdate}
          />
        </div>
      </div>

      {error && (
        <div className={styles.errorMessage}>
          ⚠️ {error}
        </div>
      )}

      {/* Health Status Banner */}
      <div className={`${styles.statusBanner} ${styles[vitals.status]}`}>
        <div className={styles.statusContent}>
          <span className={styles.statusIcon}>
            {vitals.status === 'critical' ? '🚨' : 
             vitals.status === 'warning' ? '⚠️' : '✅'}
          </span>
          <div>
            <h3>
              {vitals.status === 'critical' ? 'Kondisi Kritis' : 
               vitals.status === 'warning' ? 'Perhatian Diperlukan' : 'Kondisi Normal'}
            </h3>
            <p>
              {vitals.status === 'critical' ? 'Segera berikan pertolongan medis!' : 
               vitals.status === 'warning' ? 'Pantau kondisi pasien dengan ketat' : 
               'Semua parameter dalam batas normal'}
            </p>
          </div>
        </div>
      </div>

      {/* Vital Signs Grid */}
      <div className={styles.vitalsGrid}>
        <StatsCard 
          title="Detak Jantung" 
          value={`${vitals.heartRate} BPM`} 
          icon="❤️" 
          color="red"
          status={vitals.status}
          subtitle="Heart Rate"
        />
        <StatsCard 
          title="Saturasi Oksigen" 
          value={`${vitals.spO2}%`} 
          icon="🫁" 
          color="blue"
          status={vitals.status}
          subtitle="SpO₂"
        />
        <StatsCard 
          title="Suhu Tubuh" 
          value={`${vitals.temperature}°C`} 
          icon="🌡️" 
          color="orange"
          status={vitals.status}
          subtitle="Body Temperature"
        />
        <StatsCard 
          title="Status Device" 
          value={vitals.deviceConnected ? "Connected" : "Disconnected"} 
          icon="📱" 
          color={vitals.deviceConnected ? "green" : "gray"}
          subtitle={vitals.deviceId}
        />
      </div>

      {/* ECG Chart Section */}
      <div className={styles.chartSection}>
        <div className={styles.sectionHeader}>
          <h2>Grafik Sinyal EKG</h2>
          <span className={styles.lastUpdate}>
            Update: {formatLastUpdate(vitals.lastUpdate)}
          </span>
        </div>
        <div className={styles.chartContainer}>
          <ECGChart data={vitals.ecgData} />
        </div>
      </div>

      {/* Control Panel */}
      <div className={styles.controlPanel}>
        <div className={styles.controlGroup}>
          <label className={styles.toggleLabel}>
            <input 
              type="checkbox" 
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className={styles.toggleInput}
            />
            <span className={styles.toggleSlider}></span>
            Auto Refresh (5s)
          </label>
          
          <button 
            onClick={loadDashboardData}
            disabled={loading}
            className={styles.refreshButton}
          >
            {loading ? (
              <>
                <span className={styles.miniSpinner}></span>
                Refreshing...
              </>
            ) : (
              <>
                🔄 Refresh Now
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}