import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { logout } from '../../services/auth';
import { useNavigate } from 'react-router-dom';
import styles from './UserProfile.module.css';

export default function UserProfile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [profileError, setProfileError] = useState(''); // ✅ Renamed from 'error'

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.displayName || '',
        email: user.email || ''
      }));
    }
  }, [user]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setProfileError('');
    setMessage('');

    try {
      // TODO: Implement profile update with Firebase
      // Example: await updateUserProfile(user.uid, { displayName: formData.name });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMessage('Profile updated successfully!');
    } catch (err) {
      setProfileError('Failed to update profile. Please try again.');
      console.error('Profile update error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    setProfileError('');
    setMessage('');

    // Validation
    if (formData.newPassword !== formData.confirmPassword) {
      setProfileError('New passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.newPassword.length < 6) {
      setProfileError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      // TODO: Implement password change with Firebase Auth
      // Example: await updatePassword(user, formData.newPassword);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMessage('Password changed successfully!');
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (err) {
      setProfileError('Failed to change password. Please check your current password.');
      console.error('Password change error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePreferencesSave = async () => {
    setLoading(true);
    setProfileError('');
    setMessage('');

    try {
      // TODO: Implement preferences save
      await new Promise(resolve => setTimeout(resolve, 500));
      setMessage('Preferences saved successfully!');
    } catch (err) {
      setProfileError('Failed to save preferences');
      console.error('Preferences save error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
      setProfileError('Failed to logout. Please try again.');
    }
  };

  return (
    <div className={styles.profile}>
      <div className={styles.header}>
        <h1>User Profile</h1>
        <p>Manage your account settings and preferences</p>
      </div>

      <div className={styles.profileContainer}>
        {/* Sidebar Navigation */}
        <div className={styles.sidebar}>
          <button
            className={`${styles.tab} ${activeTab === 'profile' ? styles.active : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            👤 Profile Information
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'security' ? styles.active : ''}`}
            onClick={() => setActiveTab('security')}
          >
            🔒 Security
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'preferences' ? styles.active : ''}`}
            onClick={() => setActiveTab('preferences')}
          >
            ⚙️ Preferences
          </button>
          <div className={styles.sidebarFooter}>
            <button 
              onClick={handleLogout}
              className={styles.logoutButton}
            >
              🚪 Logout
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className={styles.content}>
          {message && <div className={styles.successMessage}>{message}</div>}
          {profileError && <div className={styles.errorMessage}>{profileError}</div>}

          {/* Profile Information Tab */}
          {activeTab === 'profile' && (
            <div className={styles.tabContent}>
              <h2>Profile Information</h2>
              
              <div className={styles.profileHeader}>
                <div className={styles.avatar}>
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className={styles.userInfo}>
                  <h3>{formData.name || 'User'}</h3>
                  <p>{user?.email}</p>
                  <span className={styles.role}>Administrator</span>
                </div>
              </div>

              <form onSubmit={handleProfileUpdate} className={styles.form}>
                <div className={styles.formGroup}>
                  <label htmlFor="name">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    disabled={loading}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="email">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                    disabled
                  />
                  <small>Email cannot be changed</small>
                </div>

                <button 
                  type="submit" 
                  className={styles.saveButton}
                  disabled={loading || !formData.name.trim()}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className={styles.tabContent}>
              <h2>Change Password</h2>
              
              <form onSubmit={handlePasswordChange} className={styles.form}>
                <div className={styles.formGroup}>
                  <label htmlFor="currentPassword">Current Password</label>
                  <input
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleInputChange}
                    placeholder="Enter current password"
                    required
                    disabled={loading}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="newPassword">New Password</label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    placeholder="Enter new password"
                    required
                    minLength="6"
                    disabled={loading}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="confirmPassword">Confirm New Password</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirm new password"
                    required
                    minLength="6"
                    disabled={loading}
                  />
                </div>

                <button 
                  type="submit" 
                  className={styles.saveButton}
                  disabled={loading || 
                    !formData.currentPassword || 
                    !formData.newPassword || 
                    !formData.confirmPassword
                  }
                >
                  {loading ? 'Changing Password...' : 'Change Password'}
                </button>
              </form>

              <div className={styles.securityTips}>
                <h4>Password Requirements:</h4>
                <ul>
                  <li>Minimum 6 characters</li>
                  <li>Include numbers and letters</li>
                  <li>Avoid common words</li>
                </ul>
              </div>
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div className={styles.tabContent}>
              <h2>Preferences</h2>
              
              <div className={styles.preferenceSection}>
                <h4>Notifications</h4>
                <div className={styles.preferenceItem}>
                  <label className={styles.switch}>
                    <input 
                      type="checkbox" 
                      defaultChecked 
                      disabled={loading}
                    />
                    <span className={styles.slider}></span>
                  </label>
                  <span>Email notifications for critical alerts</span>
                </div>
                <div className={styles.preferenceItem}>
                  <label className={styles.switch}>
                    <input 
                      type="checkbox" 
                      defaultChecked 
                      disabled={loading}
                    />
                    <span className={styles.slider}></span>
                  </label>
                  <span>Push notifications for new data</span>
                </div>
              </div>

              <div className={styles.preferenceSection}>
                <h4>Display</h4>
                <div className={styles.preferenceItem}>
                  <label>Theme:</label>
                  <select defaultValue="light" disabled={loading}>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="auto">Auto</option>
                  </select>
                </div>
                <div className={styles.preferenceItem}>
                  <label>Language:</label>
                  <select defaultValue="en" disabled={loading}>
                    <option value="en">English</option>
                    <option value="id">Indonesian</option>
                  </select>
                </div>
              </div>

              <button 
                className={styles.saveButton}
                onClick={handlePreferencesSave}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}