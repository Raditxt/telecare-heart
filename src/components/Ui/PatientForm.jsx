// src/components/Ui/PatientForm.jsx
import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth'; // ✅ IMPORT useAuth
import { patientService } from '../../services/patientService';
import styles from './PatientForm.module.css';

export default function PatientForm({ onPatientAdded, onCancel }) {
  const { user } = useAuth(); // ✅ GET user info
  const [formData, setFormData] = useState({
    name: '',
    room: '',
    age: '',
    gender: '',
    condition: '',
    contact: '' // Simpan di form tapi tidak dikirim ke backend
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Generate patient ID
      const patientId = `PATIENT_${Date.now()}`;
      
      // ✅ PERBAIKAN: Sesuaikan dengan struktur tabel yang ada
      // Kolom yang tersedia: patient_id, name, room, age, gender, condition, 
      // assigned_device, created_at, updated_at, created_by, is_public
      const patientData = {
        patient_id: patientId,
        name: formData.name,
        room: formData.room,
        age: formData.age ? parseInt(formData.age) : null,
        gender: formData.gender || null,
        condition: formData.condition,
        created_by: user?.userId || null, // ✅ Gunakan userId dari auth
        is_public: false // Default false
        // contact TIDAK dikirim karena tidak ada di tabel
      };

      console.log('Adding patient:', patientData);
      
      const result = await patientService.addPatient(patientData);
      
      if (result.success) {
        console.log('Patient added successfully:', result.patient);
        alert('Patient added successfully!');
        
        if (onPatientAdded) {
          onPatientAdded(result.patient);
        }
        
        // Reset form
        setFormData({
          name: '',
          room: '',
          age: '',
          gender: '',
          condition: '',
          contact: ''
        });
      } else {
        throw new Error(result.error || 'Failed to add patient');
      }
      
    } catch (err) {
      console.error('Error adding patient:', err);
      setError('Failed to add patient: ' + (err.message || 'Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  // Validasi form
  const isFormValid = formData.name && formData.room && formData.condition;

  return (
    <div className={styles.patientForm}>
      <h3>Add New Patient</h3>
      
      {error && (
        <div className={styles.error}>
          ⚠️ {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>Full Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter patient's full name"
              required
              disabled={loading}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label>Room Number *</label>
            <input
              type="text"
              name="room"
              value={formData.room}
              onChange={handleChange}
              placeholder="e.g., 101, ICU-205"
              required
              disabled={loading}
            />
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>Age</label>
            <input
              type="number"
              name="age"
              value={formData.age}
              onChange={handleChange}
              placeholder="Age"
              min="0"
              max="120"
              disabled={loading}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label>Gender</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              disabled={loading}
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div className={styles.formGroup}>
          <label>Medical Condition *</label>
          <input
            type="text"
            name="condition"
            value={formData.condition}
            onChange={handleChange}
            placeholder="e.g., Post-operative, Hypertension, Diabetes"
            required
            disabled={loading}
          />
        </div>

        <div className={styles.formGroup}>
          <label>Contact Info (Optional - For Reference Only)</label>
          <input
            type="text"
            name="contact"
            value={formData.contact}
            onChange={handleChange}
            placeholder="Phone number or emergency contact"
            disabled={loading}
          />
          <small className={styles.helperText}>
            Note: Contact info is saved locally for reference only
          </small>
        </div>

        <div className={styles.formActions}>
          <button 
            type="submit" 
            className={styles.saveButton}
            disabled={loading || !isFormValid}
          >
            {loading ? (
              <>
                <span className={styles.spinner}></span>
                Adding Patient...
              </>
            ) : (
              'Add Patient'
            )}
          </button>
          <button 
            type="button" 
            className={styles.cancelButton}
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}