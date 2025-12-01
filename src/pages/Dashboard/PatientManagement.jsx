// src/pages/Dashboard/PatientManagement.jsx (UPDATED)
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { patientService } from '../../services/patientService';
import { familyService } from '../../services/familyService';
import PatientForm from '../../components/Ui/PatientForm';
import styles from './PatientManagement.module.css';

export default function PatientManagement() {
  const { user } = useAuth();
  const [myPatients, setMyPatients] = useState([]);
  const [availablePatients, setAvailablePatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [showAssignFamily, setShowAssignFamily] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('myPatients'); // 'myPatients' or 'allPatients'
  
  const [assignForm, setAssignForm] = useState({
    familyEmail: '',
    relationship: 'Anak' // Default sesuai register.jsx
  });

  // Relationship options sesuai dengan register.jsx
  const relationshipOptions = [
    { value: 'Suami/Istri', label: 'Suami/Istri' },
    { value: 'Anak', label: 'Anak' },
    { value: 'Orang Tua', label: 'Orang Tua' },
    { value: 'Saudara Kandung', label: 'Saudara Kandung' },
    { value: 'Cucu', label: 'Cucu' },
    { value: 'Lainnya', label: 'Lainnya' }
  ];

  useEffect(() => {
    if (user?.role === 'doctor') {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setError(null);
      setLoading(true);
      const allPatients = await patientService.getAllPatients();
      
      if (allPatients.length > 0) {
        // Untuk demo, split patients
        setMyPatients(allPatients.slice(0, Math.ceil(allPatients.length / 2)));
        setAvailablePatients(allPatients.slice(Math.ceil(allPatients.length / 2)));
      } else {
        // Jika tidak ada data, gunakan sample data
        const samplePatients = getSamplePatients();
        setMyPatients(samplePatients.slice(0, 2));
        setAvailablePatients(samplePatients.slice(2));
      }
      
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load patient data. Please try again.');
      
      // Fallback ke sample data
      const samplePatients = getSamplePatients();
      setMyPatients(samplePatients.slice(0, 2));
      setAvailablePatients(samplePatients.slice(2));
    } finally {
      setLoading(false);
    }
  };

  const getSamplePatients = () => [
    {
      patient_id: 'PATIENT_001',
      name: 'John Doe',
      room: '101',
      age: 45,
      gender: 'male',
      condition: 'Post-operative cardiac monitoring',
      contact: '+62 812-3456-7890'
    },
    {
      patient_id: 'PATIENT_002', 
      name: 'Sarah Wilson',
      room: 'A-12',
      age: 62,
      gender: 'female',
      condition: 'Hypertension monitoring',
      contact: '+62 813-4567-8901'
    },
    {
      patient_id: 'PATIENT_003',
      name: 'Mike Johnson',
      room: 'ICU-205',
      age: 38,
      gender: 'male',
      condition: 'ICU patient - critical condition',
      contact: '+62 814-5678-9012'
    },
    {
      patient_id: 'PATIENT_004',
      name: 'Emily Chen',
      room: '102',
      age: 55,
      gender: 'female',
      condition: 'Diabetes management',
      contact: '+62 815-6789-0123'
    }
  ];

  const loadFamilyMembers = async (patientId) => {
    try {
      const families = await familyService.getPatientFamilies(patientId);
      setFamilyMembers(families);
    } catch (error) {
      console.error('Error loading family members:', error);
    }
  };

  const handlePatientAdded = (newPatient) => {
    // Add to available patients
    setAvailablePatients(prev => [...prev, newPatient]);
    setShowAddPatient(false);
    // Refresh data
    loadData();
  };

  const assignPatient = async (patientId) => {
    try {
      setAssignLoading(true);
      await patientService.assignPatientToDoctor(user.userId, patientId);
      
      const patientToAssign = availablePatients.find(p => p.patient_id === patientId);
      if (patientToAssign) {
        setMyPatients(prev => [...prev, patientToAssign]);
        setAvailablePatients(prev => prev.filter(p => p.patient_id !== patientId));
      }
      
      setShowAssignModal(false);
      alert('Patient assigned successfully!');
    } catch (error) {
      console.error('Error assigning patient:', error);
      setError('Failed to assign patient: ' + error.message);
    } finally {
      setAssignLoading(false);
    }
  };

  const unassignPatient = async (patientId) => {
    if (window.confirm('Are you sure you want to unassign this patient?')) {
      try {
        const patientToUnassign = myPatients.find(p => p.patient_id === patientId);
        if (patientToUnassign) {
          setMyPatients(prev => prev.filter(p => p.patient_id !== patientId));
          setAvailablePatients(prev => [...prev, patientToUnassign]);
        }
        alert('Patient unassigned successfully!');
      } catch (error) {
        console.error('Error unassigning patient:', error);
        setError('Failed to unassign patient');
      }
    }
  };

  const handleAssignFamily = async (e) => {
    e.preventDefault();
    try {
      await familyService.assignFamilyToPatient(
        user.userId,
        assignForm.familyEmail,
        selectedPatient.patient_id,
        assignForm.relationship
      );
      
      // Refresh family members
      await loadFamilyMembers(selectedPatient.patient_id);
      setShowAssignFamily(false);
      setAssignForm({ familyEmail: '', relationship: 'Anak' });
      
      alert('Family assigned successfully!');
    } catch (error) {
      alert('Error assigning family: ' + error.message);
    }
  };

  const handleRemoveFamily = async (familyId) => {
    if (window.confirm('Are you sure you want to remove family access?')) {
      try {
        await familyService.removeFamilyAccess(familyId, selectedPatient.patient_id);
        await loadFamilyMembers(selectedPatient.patient_id);
        alert('Family access removed successfully!');
      } catch (error) {
        alert('Error removing family access: ' + error.message);
      }
    }
  };

  // Unauthorized access
  if (user?.role !== 'doctor') {
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
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading patient data...</p>
      </div>
    );
  }

  return (
    <div className={styles.patientManagement}>
      <div className={styles.header}>
        <h1>Patient Management</h1>
        <p>Manage your patient assignments and family access</p>
        
        {error && (
          <div className={styles.errorBanner}>
            <span>{error}</span>
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}

        <div className={styles.headerActions}>
          <button 
            className={styles.primaryButton}
            onClick={() => setShowAddPatient(true)}
          >
            👤 Add New Patient
          </button>
          <button 
            className={styles.secondaryButton}
            onClick={() => setShowAssignModal(true)}
            disabled={assignLoading}
          >
            📋 Assign Patient
          </button>
        </div>
      </div>

      {/* Add Patient Form */}
      {showAddPatient && (
        <div className={styles.formSection}>
          <PatientForm 
            onPatientAdded={handlePatientAdded}
            onCancel={() => setShowAddPatient(false)}
          />
        </div>
      )}

      {/* Tabs */}
      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'myPatients' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('myPatients')}
        >
          My Patients ({myPatients.length})
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'allPatients' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('allPatients')}
        >
          All Patients ({myPatients.length + availablePatients.length})
        </button>
      </div>

      {/* My Patients Tab */}
      {activeTab === 'myPatients' && (
        <div className={styles.patientSection}>
          <div className={styles.sectionHeader}>
            <h2>My Assigned Patients</h2>
            <span className={styles.countBadge}>{myPatients.length} patients</span>
          </div>
          
          {myPatients.length > 0 ? (
            <div className={styles.patientGrid}>
              {myPatients.map(patient => (
                <div 
                  key={patient.patient_id} 
                  className={`${styles.patientCard} ${selectedPatient?.patient_id === patient.patient_id ? styles.selected : ''}`}
                  onClick={() => {
                    setSelectedPatient(patient);
                    loadFamilyMembers(patient.patient_id);
                  }}
                >
                  <div className={styles.patientHeader}>
                    <h3>{patient.name}</h3>
                    <span className={styles.roomBadge}>Room {patient.room}</span>
                  </div>
                  
                  <div className={styles.patientDetails}>
                    <div className={styles.detailItem}>
                      <span className={styles.label}>Age:</span>
                      <span>{patient.age || 'N/A'}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.label}>Gender:</span>
                      <span>{patient.gender || 'N/A'}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.label}>Condition:</span>
                      <span className={styles.condition}>{patient.condition}</span>
                    </div>
                    {patient.contact && (
                      <div className={styles.detailItem}>
                        <span className={styles.label}>Contact:</span>
                        <span>{patient.contact}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className={styles.patientActions}>
                    <button 
                      className={styles.viewButton}
                      onClick={() => window.location.href = `/patients/${patient.patient_id}`}
                    >
                      View Details
                    </button>
                    <button 
                      className={styles.unassignButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        unassignPatient(patient.patient_id);
                      }}
                    >
                      Unassign
                    </button>
                    <button 
                      className={styles.manageButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPatient(patient);
                        loadFamilyMembers(patient.patient_id);
                      }}
                    >
                      Manage Family Access
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>👥</div>
              <h3>No patients assigned</h3>
              <p>You haven't been assigned any patients yet. Assign patients from the All Patients tab.</p>
              <button 
                className={styles.assignButton}
                onClick={() => setShowAssignModal(true)}
              >
                Assign Your First Patient
              </button>
            </div>
          )}
        </div>
      )}

      {/* All Patients Tab */}
      {activeTab === 'allPatients' && (
        <div className={styles.patientSection}>
          <div className={styles.sectionHeader}>
            <h2>All Patients</h2>
            <span className={styles.countBadge}>
              {myPatients.length + availablePatients.length} total patients
            </span>
          </div>
          
          <div className={styles.patientGrid}>
            {/* My Patients */}
            {myPatients.map(patient => (
              <div key={patient.patient_id} className={`${styles.patientCard} ${styles.assigned}`}>
                <div className={styles.patientHeader}>
                  <h3>{patient.name}</h3>
                  <div className={styles.statusBadges}>
                    <span className={styles.roomBadge}>Room {patient.room}</span>
                    <span className={styles.assignedBadge}>Assigned to You</span>
                  </div>
                </div>
                <p className={styles.condition}>{patient.condition}</p>
              </div>
            ))}
            
            {/* Available Patients */}
            {availablePatients.map(patient => (
              <div key={patient.patient_id} className={styles.patientCard}>
                <div className={styles.patientHeader}>
                  <h3>{patient.name}</h3>
                  <span className={styles.roomBadge}>Room {patient.room}</span>
                </div>
                <p className={styles.condition}>{patient.condition}</p>
                <button 
                  className={styles.assignButton}
                  onClick={() => assignPatient(patient.patient_id)}
                >
                  Assign to Me
                </button>
              </div>
            ))}
          </div>

          {myPatients.length === 0 && availablePatients.length === 0 && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>🏥</div>
              <h3>No patients in system</h3>
              <p>Start by adding your first patient using the "Add New Patient" button.</p>
            </div>
          )}
        </div>
      )}

      {/* Family Management Section */}
      {selectedPatient && (
        <div className={styles.familySection}>
          <div className={styles.sectionHeader}>
            <h3>Family Access Management - {selectedPatient.name}</h3>
            <button 
              className={styles.addButton}
              onClick={() => setShowAssignFamily(true)}
            >
              + Add Family Member
            </button>
          </div>

          {/* Family Members List */}
          <div className={styles.familyList}>
            {familyMembers.map(family => (
              <div key={family.family_id} className={styles.familyCard}>
                <div className={styles.familyInfo}>
                  <strong>{family.family_name}</strong>
                  <span>Relationship: {family.relationship}</span>
                  <span>Email: {family.family_email}</span>
                  <small>Assigned by: {family.assigned_by_doctor}</small>
                </div>
                <button 
                  className={styles.removeButton}
                  onClick={() => handleRemoveFamily(family.family_id)}
                >
                  Remove Access
                </button>
              </div>
            ))}
            
            {familyMembers.length === 0 && (
              <div className={styles.emptyState}>
                <p>No family members assigned yet</p>
              </div>
            )}
          </div>

          {/* Assign Family Modal */}
          {showAssignFamily && (
            <div className={styles.modalOverlay}>
              <div className={styles.modal}>
                <div className={styles.modalContent}>
                  <div className={styles.modalHeader}>
                    <h3>Assign Family Member</h3>
                    <button 
                      onClick={() => setShowAssignFamily(false)}
                      className={styles.closeButton}
                    >
                      ×
                    </button>
                  </div>
                  
                  <form onSubmit={handleAssignFamily}>
                    <div className={styles.formGroup}>
                      <label>Family Email *</label>
                      <input
                        type="email"
                        value={assignForm.familyEmail}
                        onChange={(e) => setAssignForm(prev => ({...prev, familyEmail: e.target.value}))}
                        placeholder="Enter family member's email"
                        required
                      />
                      <small>Family must have registered account</small>
                    </div>
                    
                    <div className={styles.formGroup}>
                      <label>Relationship *</label>
                      <select
                        value={assignForm.relationship}
                        onChange={(e) => setAssignForm(prev => ({...prev, relationship: e.target.value}))}
                        required
                      >
                        {relationshipOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className={styles.modalActions}>
                      <button type="submit" className={styles.saveButton}>
                        Assign Family
                      </button>
                      <button 
                        type="button" 
                        className={styles.cancelButton}
                        onClick={() => setShowAssignFamily(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Assign Patient Modal */}
      {showAssignModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Assign Patient</h3>
              <button 
                className={styles.closeButton}
                onClick={() => setShowAssignModal(false)}
                disabled={assignLoading}
              >
                ×
              </button>
            </div>
            
            <div className={styles.modalContent}>
              {availablePatients.length > 0 ? (
                <div className={styles.patientList}>
                  {availablePatients.map(patient => (
                    <div key={patient.patient_id} className={styles.modalPatient}>
                      <div className={styles.patientInfo}>
                        <strong>{patient.name}</strong>
                        <span>Room {patient.room} • {patient.condition}</span>
                      </div>
                      <button 
                        className={styles.assignBtn}
                        onClick={() => assignPatient(patient.patient_id)}
                        disabled={assignLoading}
                      >
                        {assignLoading ? 'Assigning...' : 'Assign'}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.noPatients}>
                  <div className={styles.noPatientsIcon}>✅</div>
                  <p>All patients are already assigned</p>
                  <span>No available patients to assign at the moment.</span>
                  <button 
                    className={styles.addPatientBtn}
                    onClick={() => {
                      setShowAssignModal(false);
                      setShowAddPatient(true);
                    }}
                  >
                    Add New Patient
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}