import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getPatients, getMonitoringHistory } from '../../services/patientService';
import { seedDummyData } from '../../utils/seedData'; // ✅ IMPORT SEED FUNCTION
import StatsCard from '../../components/Ui/StatsCard';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalPatients: 0,
    criticalPatients: 0,
    averageHR: 0,
    connectedDevices: 0
  });
  const [recentPatients, setRecentPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [seeding, setSeeding] = useState(false); // ✅ SEEDING STATE

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setError('');
      
      // Get real patients data from Firebase
      const patients = await getPatients();
      
      // Get recent vitals for calculating average heart rate
      const recentVitals = await getMonitoringHistory({ limit: 100 });
      
      // Calculate statistics
      const criticalPatients = patients.filter(patient => 
        patient.status === 'critical'
      ).length;
      
      // Calculate average heart rate from recent vitals
      const averageHR = recentVitals.length > 0 
        ? Math.round(recentVitals.reduce((sum, vital) => sum + (vital.hr || 0), 0) / recentVitals.length)
        : 0;
      
      // Get unique connected devices
      const connectedDevices = [...new Set(
        patients
          .map(patient => patient.deviceId)
          .filter(deviceId => deviceId && deviceId.trim() !== '')
      )].length;

      // Update stats
      setStats({
        totalPatients: patients.length,
        criticalPatients,
        averageHR,
        connectedDevices
      });

      // Prepare recent patients data (last 5 patients)
      const recentPatientsData = patients.slice(0, 5).map(patient => {
        // Find the latest vital for this patient
        const patientVitals = recentVitals.filter(vital => vital.uid === patient.id);
        const latestVital = patientVitals[0] || {};
        
        return {
          id: patient.id,
          name: patient.name || 'Unknown Patient',
          status: patient.status || 'normal',
          lastHR: latestVital.hr || '--',
          lastUpdate: latestVital.timestamp 
            ? `${Math.round((new Date() - latestVital.timestamp) / (1000 * 60))} min ago`
            : 'No data'
        };
      });

      setRecentPatients(recentPatientsData);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load dashboard data. Please try again.');
      
      // Fallback to mock data if Firebase fails
      setStats({
        totalPatients: 0,
        criticalPatients: 0,
        averageHR: 0,
        connectedDevices: 0
      });
      setRecentPatients([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ HANDLE SEED DATA FUNCTION
  const handleSeedData = async () => {
    setSeeding(true);
    try {
      await seedDummyData();
      // Reload dashboard data after seeding
      await loadDashboardData();
      alert('✅ Dummy data berhasil dibuat! Dashboard akan diperbarui.');
    } catch (error) {
      console.error('Error seeding data:', error);
      alert('❌ Gagal membuat dummy data: ' + error.message);
    } finally {
      setSeeding(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.dashboard}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          Loading dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <h1>Dashboard</h1>
        <p>Welcome back, {user?.email}</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className={styles.errorMessage}>
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        <StatsCard
          title="Total Patients"
          value={stats.totalPatients}
          icon="👥"
          color="blue"
        />
        <StatsCard
          title="Critical Patients"
          value={stats.criticalPatients}
          icon="⚠️"
          color="red"
        />
        <StatsCard
          title="Avg Heart Rate"
          value={`${stats.averageHR} BPM`}
          icon="❤️"
          color="green"
        />
        <StatsCard
          title="Connected Devices"
          value={stats.connectedDevices}
          icon="📱"
          color="purple"
        />
      </div>

      {/* Quick Actions & Recent Patients */}
      <div className={styles.contentGrid}>
        <div className={styles.quickActions}>
          <h2>Quick Actions</h2>
          <div className={styles.actionButtons}>
            <Link to="/patients" className={styles.actionButton}>
              <span>👥</span>
              View All Patients
            </Link>
            <Link to="/monitor" className={styles.actionButton}>
              <span>❤️</span>
              Real-time Monitor
            </Link>
            <Link to="/history" className={styles.actionButton}>
              <span>📈</span>
              View History
            </Link>
          </div>
        </div>

        <div className={styles.recentPatients}>
          <div className={styles.sectionHeader}>
            <h2>Recent Patients</h2>
            <Link to="/patients" className={styles.seeAll}>
              See All →
            </Link>
          </div>
          
          {recentPatients.length > 0 ? (
            <div className={styles.patientsList}>
              {recentPatients.map(patient => (
                <div key={patient.id} className={styles.patientCard}>
                  <div className={styles.patientInfo}>
                    <h4>{patient.name}</h4>
                    <span className={`${styles.status} ${styles[patient.status]}`}>
                      {patient.status}
                    </span>
                  </div>
                  <div className={styles.patientStats}>
                    <span>HR: {patient.lastHR} BPM</span>
                    <small>{patient.lastUpdate}</small>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <p>No patient data available</p>
              <small>Click the button below to generate sample data</small>
            </div>
          )}
        </div>
      </div>

      {/* Alert Section */}
      {stats.criticalPatients > 0 && (
        <div className={styles.alertSection}>
          <div className={styles.alert}>
            <span className={styles.alertIcon}>⚠️</span>
            <div className={styles.alertContent}>
              <strong>Attention Needed</strong>
              <p>You have {stats.criticalPatients} patient(s) requiring immediate attention.</p>
            </div>
            <Link to="/patients" className={styles.alertButton}>
              View Patients
            </Link>
          </div>
        </div>
      )}

      {/* ✅ DEVELOPMENT TOOLS - SEED DATA BUTTON */}
      {import.meta.env.DEV &&  (
        <div className={styles.devTools}>
          <div className={styles.seedSection}>
            <h3>Development Tools</h3>
            <p>Generate sample data for testing</p>
            <button 
              onClick={handleSeedData}
              disabled={seeding}
              className={styles.seedButton}
            >
              {seeding ? (
                <>
                  <span className={styles.spinner}></span>
                  Generating Data...
                </>
              ) : (
                <>
                  🌱 Seed Sample Data
                </>
              )}
            </button>
            <small className={styles.seedNote}>
              Will create 4 patients and 144 vital records
            </small>
          </div>
        </div>
      )}

      {/* Refresh Button */}
      <div className={styles.refreshSection}>
        <button 
          onClick={loadDashboardData}
          className={styles.refreshButton}
          disabled={loading}
        >
          {loading ? 'Refreshing...' : '🔄 Refresh Data'}
        </button>
      </div>
    </div>
  );
}