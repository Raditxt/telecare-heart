// src/pages/FamilyDashboard/FamilyPatientDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { patientService } from '../../services/patientService';
import { familyService } from '../../services/familyService';
import styles from './FamilyPatientDetail.module.css';

export default function FamilyPatientDetail() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const { user, canAccessPatient } = useAuth();
  
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [relationship, setRelationship] = useState('');
  const [recentVitals, setRecentVitals] = useState([]);
  const [showEmergencyInfo, setShowEmergencyInfo] = useState(false);

  useEffect(() => {
    if (!canAccessPatient(patientId)) {
      navigate('/unauthorized');
      return;
    }
    
    loadPatientData();
  }, [patientId, user]);

  const loadPatientData = async () => {
    try {
      setLoading(true);
      
      // Load patient details
      const patientData = await patientService.getPatient(patientId);
      setPatient(patientData);
      
      // Load relationship info
      try {
        const families = await familyService.getPatientFamilies(patientId);
        const userFamily = families.find(f => f.family_id === user.userId);
        if (userFamily) {
          setRelationship(userFamily.relationship);
        }
      } catch (error) {
        console.warn('Could not load relationship info:', error);
      }
      
      // Load recent vitals
      try {
        const vitals = await patientService.getMonitoringHistory(patientId, 5);
        setRecentVitals(vitals);
      } catch (error) {
        console.warn('Could not load vitals:', error);
      }
      
    } catch (error) {
      console.error('Error loading patient data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading patient information...</p>
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
    <div className={styles.familyPatientDetail}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <button 
            className={styles.backButton}
            onClick={() => navigate('/family/patients')}
          >
            ← Back to Patients
          </button>
          <h1>📋 Patient Details</h1>
        </div>
        
        <div className={styles.patientHeader}>
          <div className={styles.patientInfo}>
            <div className={styles.avatar}>
              {patient.name.charAt(0)}
            </div>
            <div>
              <h2>{patient.name}</h2>
              <div className={styles.patientTags}>
                <span className={styles.idTag}>ID: {patient.patient_id}</span>
                <span className={styles.roomTag}>🏥 Room {patient.room}</span>
                {relationship && (
                  <span className={styles.relationshipTag}>
                    👥 {relationship}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className={styles.headerActions}>
            <Link 
              to={`/family/patients/${patientId}/monitoring`}
              className={styles.monitorButton}
            >
              ❤️ Real-time Monitoring
            </Link>
            <button 
              className={styles.emergencyButton}
              onClick={() => setShowEmergencyInfo(!showEmergencyInfo)}
            >
              🚨 Emergency Info
            </button>
          </div>
        </div>
      </div>

      <div className={styles.content}>
        {/* Left Column - Patient Information */}
        <div className={styles.leftColumn}>
          <div className={styles.infoSection}>
            <h3>📝 Basic Information</h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.label}>Age</span>
                <span className={styles.value}>{patient.age || 'Not specified'}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Gender</span>
                <span className={styles.value}>{patient.gender || 'Not specified'}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Room Number</span>
                <span className={styles.value}>{patient.room || 'Not assigned'}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Patient ID</span>
                <span className={styles.value}>{patient.patient_id}</span>
              </div>
            </div>
          </div>

          <div className={styles.infoSection}>
            <h3>🏥 Medical Information</h3>
            <div className={styles.medicalInfo}>
              <div className={styles.medicalItem}>
                <span className={styles.label}>Primary Condition</span>
                <p className={styles.value}>{patient.condition || 'No condition specified'}</p>
              </div>
              {patient.admitted_date && (
                <div className={styles.medicalItem}>
                  <span className={styles.label}>Admitted Date</span>
                  <span className={styles.value}>
                    {new Date(patient.admitted_date).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Recent Vitals */}
          {recentVitals.length > 0 && (
            <div className={styles.infoSection}>
              <h3>📈 Recent Vital Signs</h3>
              <div className={styles.vitalsList}>
                {recentVitals.map((vital, index) => (
                  <div key={index} className={styles.vitalItem}>
                    <div className={styles.vitalTime}>
                      {vital.timestamp ? new Date(vital.timestamp).toLocaleTimeString() : '--'}
                    </div>
                    <div className={styles.vitalValues}>
                      {vital.heart_rate && (
                        <span className={styles.vitalBadge}>❤️ {vital.heart_rate} BPM</span>
                      )}
                      {vital.blood_pressure_systolic && vital.blood_pressure_diastolic && (
                        <span className={styles.vitalBadge}>🩸 {vital.blood_pressure_systolic}/{vital.blood_pressure_diastolic}</span>
                      )}
                      {vital.temperature && (
                        <span className={styles.vitalBadge}>🌡️ {vital.temperature}°C</span>
                      )}
                      {vital.oxygen_saturation && (
                        <span className={styles.vitalBadge}>💨 {vital.oxygen_saturation}%</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Actions & Emergency Info */}
        <div className={styles.rightColumn}>
          {/* Quick Actions */}
          <div className={styles.actionsSection}>
            <h3>🚀 Quick Actions</h3>
            <div className={styles.actionButtons}>
              <Link 
                to={`/family/patients/${patientId}/monitoring`}
                className={styles.actionButton}
              >
                <span className={styles.actionIcon}>❤️</span>
                <div className={styles.actionContent}>
                  <strong>Real-time Monitoring</strong>
                  <small>View live vital signs</small>
                </div>
              </Link>
              
              <Link 
                to={`/family/history?patient=${patientId}`}
                className={styles.actionButton}
              >
                <span className={styles.actionIcon}>📊</span>
                <div className={styles.actionContent}>
                  <strong>View History</strong>
                  <small>Past health records</small>
                </div>
              </Link>
              
              <button 
                className={styles.actionButton}
                onClick={() => window.print()}
              >
                <span className={styles.actionIcon}>🖨️</span>
                <div className={styles.actionContent}>
                  <strong>Print Summary</strong>
                  <small>Patient information</small>
                </div>
              </button>
            </div>
          </div>

          {/* Emergency Info */}
          <div className={`${styles.emergencySection} ${showEmergencyInfo ? styles.expanded : ''}`}>
            <div className={styles.emergencyHeader}>
              <h3>🚨 Emergency Information</h3>
              <button 
                className={styles.toggleButton}
                onClick={() => setShowEmergencyInfo(!showEmergencyInfo)}
              >
                {showEmergencyInfo ? '▲' : '▼'}
              </button>
            </div>
            
            {showEmergencyInfo && (
              <div className={styles.emergencyContent}>
                <div className={styles.emergencyItem}>
                  <h4>Immediate Actions</h4>
                  <ul>
                    <li>If patient shows severe distress, call emergency services immediately</li>
                    <li>Notify the attending doctor</li>
                    <li>Stay calm and provide clear information</li>
                  </ul>
                </div>
                
                <div className={styles.emergencyItem}>
                  <h4>Emergency Contacts</h4>
                  <ul className={styles.contactList}>
                    <li>🏥 Hospital Emergency: <strong>(021) 1234-5678</strong></li>
                    <li>🚑 Ambulance: <strong>112 or 119</strong></li>
                    <li>👨‍⚕️ Attending Doctor: <strong>Dr. Smith - (021) 9876-5432</strong></li>
                  </ul>
                </div>
                
                <div className={styles.emergencyItem}>
                  <h4>Important Notes</h4>
                  <ul>
                    <li>Keep patient calm and comfortable</li>
                    <li>Do not move patient unnecessarily</li>
                    <li>Have patient's ID and medical information ready</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Notes Section */}
          <div className={styles.notesSection}>
            <h3>📝 Your Notes</h3>
            <textarea 
              className={styles.notesTextarea}
              placeholder="Add your personal notes about this patient..."
              rows={4}
            />
            <button className={styles.saveNotesButton}>
              💾 Save Notes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}