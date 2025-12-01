// src/components/Ui/PatientSelector.jsx (Enhanced)
import React from 'react';
import styles from './PatientSelector.module.css';

export default function PatientSelector({ patients, currentPatient, onPatientChange, userRole }) {
  if (!patients || patients.length === 0) {
    return null;
  }

  const getPatientDisplayText = (patient) => {
    let displayText = patient.name;
    
    if (patient.room) {
      displayText += ` (Room: ${patient.room})`;
    }
    
    if (userRole === 'family' && patient.relationship) {
      displayText += ` - ${patient.relationship}`;
    }
    
    return displayText;
  };

  return (
    <div className={styles.patientSelector}>
      <div className={styles.selectorHeader}>
        <label className={styles.label}>
          {userRole === 'doctor' ? '👨‍⚕️ Pilih Pasien:' : '👪 Pasien yang Dipantau:'}
        </label>
        <span className={styles.patientCount}>
          {patients.length} {patients.length === 1 ? 'pasien' : 'pasien'}
        </span>
      </div>
      
      <div className={styles.selectorContent}>
        <select
          value={currentPatient?.patient_id || ''}
          onChange={(e) => {
            const selectedPatient = patients.find(p => p.patient_id === e.target.value);
            if (selectedPatient) {
              onPatientChange(selectedPatient);
            }
          }}
          className={styles.select}
        >
          {patients.map(patient => (
            <option key={patient.patient_id} value={patient.patient_id}>
              {getPatientDisplayText(patient)}
            </option>
          ))}
        </select>
        
        {currentPatient && (
          <div className={styles.currentPatientInfo}>
            <div className={styles.patientMainInfo}>
              <span className={styles.patientName}>{currentPatient.name}</span>
              {currentPatient.age && (
                <span className={styles.patientAge}>{currentPatient.age} tahun</span>
              )}
            </div>
            
            <div className={styles.patientDetails}>
              {currentPatient.room && (
                <span className={styles.patientDetail}>
                  🏥 {currentPatient.room}
                </span>
              )}
              {currentPatient.condition && (
                <span className={styles.patientDetail}>
                  📋 {currentPatient.condition}
                </span>
              )}
              {userRole === 'family' && currentPatient.relationship && (
                <span className={styles.patientDetail}>
                  👨‍👩‍👧‍👦 {currentPatient.relationship}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}