// src/pages/FamilyDashboard/FamilyDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { familyService } from '../../services/familyService';
import { Link } from 'react-router-dom';
import styles from './FamilyDashboard.module.css';

export default function FamilyDashboard() {
  const { user, getDisplayName } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadFamilyData();
  }, [user]);

  const loadFamilyData = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('👤 Loading data for family user:', user?.userId);
      
      // Gunakan familyService.getFamilyPatients untuk mendapatkan data lengkap
      const familyPatients = await familyService.getFamilyPatients(user.userId);
      console.log('📋 Family patients data:', familyPatients);
      
      if (familyPatients.length === 0) {
        // Coba alternatif: cek assignments melalui API lain
        console.log('No data from getFamilyPatients, trying alternative...');
        try {
          const assignments = await familyService.getFamilyAssignments(user.userId);
          console.log('Assignments data:', assignments);
          
          // Transform assignments to patient format
          const transformedPatients = assignments.map(assignment => ({
            patient_id: assignment.patient_id,
            name: assignment.patient_name,
            room: assignment.room,
            condition: assignment.condition,
            relationship: assignment.relationship
          }));
          
          setPatients(transformedPatients);
        } catch (altError) {
          console.warn('Alternative method also failed:', altError);
          setPatients([]);
        }
      } else {
        setPatients(familyPatients);
      }
      
    } catch (error) {
      console.error('❌ Error loading family data:', error);
      setError('Failed to load patient data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.familyDashboard}>
      <div className={styles.header}>
        <h1>👨‍👩‍👧‍👦 Family Dashboard</h1>
        <p>Welcome back, {getDisplayName()}! Here's an overview of your loved ones.</p>
        
        {error && (
          <div className={styles.errorBanner}>
            <span>{error}</span>
            <button onClick={() => setError('')}>×</button>
          </div>
        )}
      </div>

      <div className={styles.content}>
        {/* Patient Cards */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Your Loved Ones</h2>
            <div className={styles.headerActions}>
              <span className={styles.countBadge}>{patients.length} patient(s)</span>
              <button 
                className={styles.refreshButton}
                onClick={loadFamilyData}
                disabled={loading}
              >
                {loading ? '🔄 Loading...' : '🔄 Refresh'}
              </button>
            </div>
          </div>
          
          {loading ? (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              <p>Loading your patients...</p>
            </div>
          ) : patients.length > 0 ? (
            <div className={styles.patientGrid}>
              {patients.map(patient => (
                <div key={patient.patient_id} className={styles.patientCard}>
                  <div className={styles.patientHeader}>
                    <h3>{patient.name}</h3>
                    <div className={styles.patientStatus}>
                      <span className={styles.roomBadge}>🏥 Room {patient.room || 'N/A'}</span>
                      {patient.relationship && (
                        <span className={styles.relationshipBadge}>
                          {patient.relationship}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className={styles.patientDetails}>
                    <div className={styles.detailItem}>
                      <span className={styles.label}>Condition:</span>
                      <span className={styles.value}>{patient.condition || 'N/A'}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.label}>Age:</span>
                      <span className={styles.value}>{patient.age || 'N/A'}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.label}>Gender:</span>
                      <span className={styles.value}>{patient.gender || 'N/A'}</span>
                    </div>
                    {patient.relationship && (
                      <div className={styles.detailItem}>
                        <span className={styles.label}>Your Role:</span>
                        <span className={styles.relationship}>{patient.relationship}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className={styles.patientActions}>
                    <Link 
                      to={`/family/patients/${patient.patient_id}/monitoring`}
                      className={styles.primaryButton}
                    >
                      ❤️ Monitor Health
                    </Link>
                    <Link 
                      to={`/family/patients/${patient.patient_id}`}
                      className={styles.secondaryButton}
                    >
                      📋 View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>👥</div>
              <h3>No Patients Assigned</h3>
              <p>You haven't been assigned to any patients yet.</p>
              <p>Please contact the doctor or hospital administrator to get access.</p>
              <button 
                className={styles.retryButton}
                onClick={loadFamilyData}
              >
                🔄 Retry Loading
              </button>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className={styles.sidebar}>
          <div className={styles.statsSection}>
            <h3>📊 Quick Stats</h3>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>👥</div>
                <div className={styles.statContent}>
                  <h4>Total Patients</h4>
                  <p className={styles.statNumber}>{patients.length}</p>
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>⏰</div>
                <div className={styles.statContent}>
                  <h4>Last Updated</h4>
                  <p className={styles.statTime}>
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.helpSection}>
            <h3>💡 Need Help?</h3>
            <ul className={styles.helpList}>
              <li>To view detailed patient information, click "View Details"</li>
              <li>To monitor real-time health data, click "Monitor Health"</li>
              <li>Contact the attending doctor if you have concerns</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}