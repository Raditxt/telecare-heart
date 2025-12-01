// src/pages/FamilyDashboard/FamilyProfile.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { patientService } from '../../services/patientService';
import styles from './FamilyProfile.module.css';

export default function FamilyProfile() {
  const { user, updateUser, logout } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    emergencyContact: '',
    relationship: ''
  });
  
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        emergencyContact: user.emergency_contact || '',
        relationship: user.relationship || ''
      });
      
      loadFamilyPatients();
    }
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

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Here you would typically call an API to update the user profile
      updateUser(formData);
      setMessage('Profile updated successfully!');
      setIsEditing(false);
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Error updating profile: ' + error.message);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  const handleChangePassword = () => {
    alert('Password change functionality will be implemented soon!');
  };

  return (
    <div className={styles.familyProfile}>
      <div className={styles.header}>
        <h1>👤 Family Profile</h1>
        <p>Manage your account information and view your patient assignments</p>
      </div>

      <div className={styles.content}>
        {/* Left Column - Profile Form */}
        <div className={styles.leftColumn}>
          <div className={styles.profileCard}>
            <div className={styles.cardHeader}>
              <h3>Personal Information</h3>
              <button 
                className={styles.editButton}
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? 'Cancel' : '✏️ Edit'}
              </button>
            </div>

            {message && (
              <div className={`${styles.message} ${message.includes('Error') ? styles.error : styles.success}`}>
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label>Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Emergency Contact</label>
                <input
                  type="text"
                  name="emergencyContact"
                  value={formData.emergencyContact}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="Name and phone number"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Address</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  disabled={!isEditing}
                  rows={3}
                />
              </div>

              {isEditing && (
                <div className={styles.formActions}>
                  <button type="submit" className={styles.saveButton}>
                    💾 Save Changes
                  </button>
                  <button 
                    type="button" 
                    className={styles.cancelButton}
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </form>

            <div className={styles.securitySection}>
              <h4>🔒 Security</h4>
              <button 
                className={styles.securityButton}
                onClick={handleChangePassword}
              >
                🔑 Change Password
              </button>
              <button 
                className={styles.securityButton}
                onClick={handleLogout}
              >
                🚪 Logout
              </button>
            </div>
          </div>
        </div>
        {/* Right Column - Patient Assignments */}
        <div className={styles.rightColumn}>
          <div className={styles.assignmentsCard}>
            <div className={styles.cardHeader}>
              <h3>👨‍👩‍👧‍👦 Your Patient Assignments</h3>
              <span className={styles.badge}>{patients.length} patient(s)</span>
            </div>

            {loading ? (
              <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>Loading your patients...</p>
              </div>
            ) : patients.length > 0 ? (
              <div className={styles.assignmentsList}>
                {patients.map(patient => (
                  <div key={patient.patient_id} className={styles.assignmentItem}>
                    <div className={styles.assignmentInfo}>
                      <div className={styles.patientAvatar}>
                        {patient.name.charAt(0)}
                      </div>
                      <div>
                        <h4>{patient.name}</h4>
                        <div className={styles.assignmentDetails}>
                          <span className={styles.detailBadge}>🏥 Room {patient.room}</span>
                          {patient.relationship && (
                            <span className={styles.relationshipBadge}>
                              {patient.relationship}
                            </span>
                          )}
                        </div>
                        <p className={styles.condition}>{patient.condition}</p>
                      </div>
                    </div>
                    <div className={styles.assignmentActions}>
                      <a 
                        href={`/family/patients/${patient.patient_id}`}
                        className={styles.viewButton}
                      >
                        View
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyAssignments}>
                <div className={styles.emptyIcon}>👥</div>
                <h4>No Patient Assignments</h4>
                <p>You haven't been assigned to any patients yet.</p>
                <p>Contact your doctor to get access to patient information.</p>
              </div>
            )}
          </div>

          <div className={styles.statsCard}>
            <h3>📊 Account Statistics</h3>
            <div className={styles.statsGrid}>
              <div className={styles.statItem}>
                <div className={styles.statIcon}>📅</div>
                <div className={styles.statContent}>
                  <h4>Account Created</h4>
                  <p>{user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</p>
                </div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statIcon}>👥</div>
                <div className={styles.statContent}>
                  <h4>Total Patients</h4>
                  <p className={styles.statNumber}>{patients.length}</p>
                </div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statIcon}>⏰</div>
                <div className={styles.statContent}>
                  <h4>Last Login</h4>
                  <p>{new Date().toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.helpCard}>
            <h3>❓ Need Help?</h3>
            <ul className={styles.helpList}>
              <li>📞 Contact Support: support@telecare.com</li>
              <li>📚 User Guide: Available in documentation</li>
              <li>🔄 Refresh page if data doesn't appear</li>
              <li>🔧 Report issues to system administrator</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}