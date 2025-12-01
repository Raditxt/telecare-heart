// src/pages/FamilyDashboard/FamilyPatientList.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { patientService } from '../../services/patientService';
import { Link } from 'react-router-dom';
import styles from './FamilyPatientList.module.css';

export default function FamilyPatientList() {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadFamilyPatients();
  }, [user]);

  const loadFamilyPatients = async () => {
    try {
      setLoading(true);
      const familyPatients = await patientService.getFamilyPatients(user.userId);
      setPatients(familyPatients);
    } catch (error) {
      console.error('Error loading family patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.room.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.condition.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={styles.familyPatientList}>
      <div className={styles.header}>
        <h1>👨‍👩‍👧‍👦 My Patients</h1>
        <p>View and monitor your assigned patients</p>
      </div>

      <div className={styles.controls}>
        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="Search patients by name, room, or condition..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
          <span className={styles.searchIcon}>🔍</span>
        </div>
        <button 
          className={styles.refreshButton}
          onClick={loadFamilyPatients}
          disabled={loading}
        >
          🔄 Refresh
        </button>
      </div>

      {loading ? (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading your patients...</p>
        </div>
      ) : filteredPatients.length > 0 ? (
        <div className={styles.patientTable}>
          <div className={styles.tableHeader}>
            <div className={styles.headerCell}>Patient Name</div>
            <div className={styles.headerCell}>Room</div>
            <div className={styles.headerCell}>Condition</div>
            <div className={styles.headerCell}>Relationship</div>
            <div className={styles.headerCell}>Actions</div>
          </div>
          
          <div className={styles.tableBody}>
            {filteredPatients.map(patient => (
              <div key={patient.patient_id} className={styles.tableRow}>
                <div className={styles.tableCell}>
                  <div className={styles.patientInfo}>
                    <div className={styles.patientAvatar}>
                      {patient.name.charAt(0)}
                    </div>
                    <div>
                      <strong>{patient.name}</strong>
                      <small>ID: {patient.patient_id}</small>
                    </div>
                  </div>
                </div>
                <div className={styles.tableCell}>
                  <span className={styles.roomBadge}>🏥 {patient.room}</span>
                </div>
                <div className={styles.tableCell}>
                  <span className={styles.condition}>{patient.condition}</span>
                </div>
                <div className={styles.tableCell}>
                  <span className={styles.relationship}>
                    {patient.relationship || 'Family Member'}
                  </span>
                </div>
                <div className={styles.tableCell}>
                  <div className={styles.actionButtons}>
                    <Link
                      to={`/family/monitoring/${patient.patient_id}`}
                      className={styles.monitorButton}
                    >
                      ❤️ Monitor
                    </Link>
                    <Link
                      to={`/family/patients/${patient.patient_id}/details`}
                      className={styles.detailsButton}
                    >
                      📋 Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>👥</div>
          <h3>No Patients Found</h3>
          <p>
            {searchTerm 
              ? `No patients match "${searchTerm}"`
              : "You haven't been assigned to any patients yet."
            }
          </p>
          {searchTerm && (
            <button 
              className={styles.clearButton}
              onClick={() => setSearchTerm('')}
            >
              Clear Search
            </button>
          )}
        </div>
      )}
    </div>
  );
}