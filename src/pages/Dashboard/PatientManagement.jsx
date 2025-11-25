// src/pages/Dashboard/PatientManagement.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { patientService } from '../../services/patientService';
import styles from './PatientManagement.module.css';

export default function PatientManagement() {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [availablePatients, setAvailablePatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);

  useEffect(() => {
    if (user.role === 'doctor') {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setError(null);
      setLoading(true);
      
      const [myPatients, allPatients] = await Promise.all([
        patientService.getDoctorPatients(user.userId),
        patientService.getAllPatients()
      ]);
      
      setPatients(myPatients);
      setAvailablePatients(allPatients.filter(p => 
        !myPatients.some(mp => mp.patient_id === p.patient_id)
      ));
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load patient data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const assignPatient = async (patientId) => {
    try {
      setAssignLoading(true);
      await patientService.assignPatientToDoctor(user.userId, patientId);
      await loadData();
      setShowAssignModal(false);
    } catch (error) {
      console.error('Error assigning patient:', error);
      setError('Failed to assign patient. Please try again.');
    } finally {
      setAssignLoading(false);
    }
  };

  const unassignPatient = async (patientId) => {
    try {
      await patientService.unassignPatientFromDoctor(user.userId, patientId);
      await loadData();
    } catch (error) {
      console.error('Error unassigning patient:', error);
      setError('Failed to unassign patient. Please try again.');
    }
  };

  // Unauthorized access
  if (user.role !== 'doctor') {
    return (
      <div className={styles.unauthorized}>
        <h2>Access Denied</h2>
        <p>This page is only accessible by doctors.</p>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <h2>Loading Patient Data...</h2>
        <p>Please wait while we load your patients</p>
      </div>
    );
  }

  return (
    <div className={styles.patientManagement}>
      <div className={styles.header}>
        <h1>Patient Management</h1>
        <p>Manage your patient assignments and monitoring</p>
        
        {error && (
          <div className={styles.errorBanner}>
            <span>{error}</span>
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}

        <button 
          className={styles.assignButton}
          onClick={() => setShowAssignModal(true)}
          disabled={assignLoading}
        >
          {assignLoading ? 'Processing...' : 'Assign New Patient'}
        </button>
      </div>

      {/* Patient list */}
      <div className={styles.patientSection}>
        <h2>My Assigned Patients ({patients.length})</h2>
        
        {patients.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No patients assigned to you yet.</p>
            <button 
              className={styles.assignButton}
              onClick={() => setShowAssignModal(true)}
            >
              Assign Your First Patient
            </button>
          </div>
        ) : (
          <div className={styles.patientGrid}>
            {patients.map(patient => (
              <div key={patient.patient_id} className={styles.patientCard}>
                <h3>{patient.name}</h3>
                <p>Room: {patient.room}</p>
                <p>Condition: {patient.condition}</p>
                <p>Last Update: {patient.last_updated || 'N/A'}</p>
                
                <div className={styles.patientActions}>
                  <button className={styles.viewButton}>
                    View Details
                  </button>
                  <button 
                    className={styles.unassignButton}
                    onClick={() => unassignPatient(patient.patient_id)}
                    disabled={assignLoading}
                  >
                    Unassign
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Assign Patient Modal */}
      {showAssignModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <h3>Assign Patient</h3>
                <button 
                  onClick={() => setShowAssignModal(false)}
                  className={styles.closeButton}
                  disabled={assignLoading}
                >
                  ×
                </button>
              </div>
              
              <div className={styles.modalBody}>
                {availablePatients.length === 0 ? (
                  <div className={styles.emptyState}>
                    <p>No available patients to assign.</p>
                  </div>
                ) : (
                  <div className={styles.patientList}>
                    {availablePatients.map(patient => (
                      <div key={patient.patient_id} className={styles.modalPatient}>
                        <div className={styles.patientInfo}>
                          <strong>{patient.name}</strong>
                          <span>Room: {patient.room}</span>
                          <span>Condition: {patient.condition}</span>
                        </div>
                        <button 
                          onClick={() => assignPatient(patient.patient_id)}
                          className={styles.assignButton}
                          disabled={assignLoading}
                        >
                          {assignLoading ? 'Assigning...' : 'Assign'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}