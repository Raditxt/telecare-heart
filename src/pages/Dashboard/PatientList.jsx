// src/pages/Dashboard/PatientList.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth"; // ✅ Update path
import { patientService } from "../../services/patientService";
import styles from "./PatientList.module.css";

export default function PatientList() {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPatients();
  }, [user]);

  const loadPatients = async () => {
    try {
      let patientData;
      
      if (user.role === 'doctor') {
        // Doctors see all their assigned patients
        patientData = await patientService.getDoctorPatients(user.userId);
      } else if (user.role === 'family') {
        // Family only see their related patients
        patientData = await patientService.getFamilyPatients(user.userId);
      }
      
      setPatients(patientData);
    } catch (error) {
      console.error('Error loading patients:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading patients...</div>;
  }

  return (
    <div className={styles.patientList}>
      <div className={styles.header}>
        <h1>
          {user.role === 'doctor' ? 'My Patients' : 'Family Members'}
        </h1>
        <p>
          {user.role === 'doctor' 
            ? 'Manage and monitor your assigned patients' 
            : 'Monitor your family members\' health status'
          }
        </p>
      </div>

      <div className={styles.patientGrid}>
        {patients.map(patient => (
          <div key={patient.patient_id} className={styles.patientCard}>
            <div className={styles.patientInfo}>
              <h3>{patient.name}</h3>
              <p>Room: {patient.room}</p>
              <p>Condition: {patient.condition}</p>
              {user.role === 'family' && (
                <p>Relationship: {patient.relationship}</p>
              )}
            </div>
            <div className={styles.patientActions}>
              <button 
                className={styles.viewButton}
                onClick={() => window.location.href = `/patients/${patient.patient_id}`}
              >
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {patients.length === 0 && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>👥</div>
          <h3>No patients found</h3>
          <p>
            {user.role === 'doctor' 
              ? 'You haven\'t been assigned any patients yet.' 
              : 'No family members are currently being monitored.'
            }
          </p>
        </div>
      )}
    </div>
  );
}