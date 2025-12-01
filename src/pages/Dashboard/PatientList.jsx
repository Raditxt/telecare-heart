// src/pages/Dashboard/PatientList.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth"; // ✅ Update path ke context
import { patientService } from "../../services/patientService";
import styles from "./PatientList.module.css";

export default function PatientList() {
  const { user, isDoctor, isFamily } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPatients();
  }, [user]);

  const loadPatients = async () => {
    try {
      let patientData;
      
      if (isDoctor()) {
        // 🔥 UPDATE: Doctors see ALL patients, not just assigned ones
        patientData = await patientService.getAllPatients();
      } else if (isFamily()) {
        // Family only see patients they're assigned to
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
          {isDoctor() ? 'All Patients' : 'My Family Members'}
        </h1>
        <p>
          {isDoctor() 
            ? 'Manage and monitor all patients in the system' 
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
              {isFamily() && patient.relationship && (
                <p className={styles.relationship}>Relationship: {patient.relationship}</p>
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
          <div className={styles.emptyIcon}>
            {isDoctor() ? '👥' : '👪'}
          </div>
          <h3>No patients found</h3>
          <p>
            {isDoctor() 
              ? 'No patients in the system yet.' 
              : 'You haven\'t been assigned to any family members yet. Ask your doctor to grant you access.'
            }
          </p>
        </div>
      )}
    </div>
  );
}