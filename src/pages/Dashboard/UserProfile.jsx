import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { 
  logout, 
  updateUserProfile, 
  changePassword, 
  updateUserPreferences 
} from '../../services/auth'; // ✅ Import yang diperbaiki
import { useNavigate } from 'react-router-dom';
import styles from './UserProfile.module.css';

export default function UserProfile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    pushNotifications: true,
    criticalAlerts: true,
    theme: 'light',
    language: 'en',
    timezone: 'Asia/Jakarta',
    dateFormat: 'DD/MM/YYYY',
    autoRefresh: true,
    dataDensity: 'normal'
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [profileError, setProfileError] = useState('');
  const [activityLog, setActivityLog] = useState([]);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.displayName || '',
        email: user.email || '',
        phone: user.phoneNumber || '',
        department: user.department || 'Medical Staff'
      }));
      
      // Load user preferences
      loadUserPreferences();
      loadActivityLog();
    }
  }, [user]);

  const loadUserPreferences = async () => {
    try {
      // TODO: Load from user profile
      const userPrefs = {
        emailNotifications: true,
        pushNotifications: true,
        criticalAlerts: true,
        theme: 'light',
        language: 'en',
        timezone: 'Asia/Jakarta',
        dateFormat: 'DD/MM/YYYY',
        autoRefresh: true,
        dataDensity: 'normal'
      };
      setPreferences(userPrefs);
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const loadActivityLog = async () => {
    try {
      // Mock activity log
      const mockLog = [
        {
          id: 1,
          action: 'login',
          description: 'Successful login from Chrome on Windows',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          ip: '192.168.1.100'
        },
        {
          id: 2,
          action: 'password_change',
          description: 'Password updated successfully',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
          ip: '192.168.1.100'
        },
        {
          id: 3,
          action: 'profile_update',
          description: 'Profile information updated',
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
          ip: '192.168.1.100'
        }
      ];
      setActivityLog(mockLog);
    } catch (error) {
      console.error('Error loading activity log:', error);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePreferenceChange = (key, value) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setProfileError('');
    setMessage('');

    try {
      // TODO: Implement actual profile update
      await updateUserProfile({
        displayName: formData.name,
        phoneNumber: formData.phone,
        department: formData.department
      });
      
      setMessage('Profile updated successfully!');
      
      // Update activity log
      setActivityLog(prev => [{
        id: prev.length + 1,
        action: 'profile_update',
        description: 'Profile information updated',
        timestamp: new Date(),
        ip: '192.168.1.100'
      }, ...prev]);
      
    } catch {
      setProfileError('Failed to update profile. Please try again.');
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

    if (formData.newPassword.length < 8) {
      setProfileError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.newPassword)) {
      setProfileError('Password must contain uppercase, lowercase letters and numbers');
      setLoading(false);
      return;
    }

    try {
      // TODO: Implement actual password change
      await changePassword(formData.currentPassword, formData.newPassword);
      
      setMessage('Password changed successfully!');
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
      
      // Update activity log
      setActivityLog(prev => [{
        id: prev.length + 1,
        action: 'password_change',
        description: 'Password updated successfully',
        timestamp: new Date(),
        ip: '192.168.1.100'
      }, ...prev]);
      
    } catch {
      setProfileError('Failed to change password. Please check your current password.');
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
      await updateUserPreferences(preferences);
      setMessage('Preferences saved successfully!');
    } catch {
      setProfileError('Failed to save preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setProfileError('File size must be less than 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setProfileError('Please upload an image file');
      return;
    }

    setLoading(true);
    try {
      // TODO: Implement avatar upload
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMessage('Profile picture updated successfully!');
    } catch {
      setProfileError('Failed to upload profile picture');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch {
      setProfileError('Failed to logout. Please try again.');
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleBadge = (role) => {
    const roleConfig = {
      'admin': { label: 'Administrator', color: '#dc2626', bgColor: '#fef2f2' },
      'doctor': { label: 'Medical Doctor', color: '#059669', bgColor: '#f0fdf4' },
      'nurse': { label: 'Nurse', color: '#0d9488', bgColor: '#f0fdfa' },
      'staff': { label: 'Medical Staff', color: '#7c3aed', bgColor: '#faf5ff' }
    };

    const config = roleConfig[role] || roleConfig.staff;
    
    return (
      <span 
        className={styles.roleBadge}
        style={{ 
          backgroundColor: config.bgColor,
          color: config.color,
          border: `1px solid ${config.color}20`
        }}
      >
        {config.label}
      </span>
    );
  };

  return (
    <div className={styles.profile}>
      <div className={styles.header}>
        <h1>Account & Profile Management</h1>
        <p>Manage your account settings, security, and preferences</p>
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
            🔒 Security & Password
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'preferences' ? styles.active : ''}`}
            onClick={() => setActiveTab('preferences')}
          >
            ⚙️ Preferences
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'activity' ? styles.active : ''}`}
            onClick={() => setActiveTab('activity')}
          >
            📊 Account Activity
          </button>
          <div className={styles.sidebarFooter}>
            <div className={styles.sessionInfo}>
              <small>Last login: {activityLog[0] ? formatTimestamp(activityLog[0].timestamp) : 'Unknown'}</small>
            </div>
            <button 
              onClick={handleLogout}
              className={styles.logoutButton}
            >
              🚪 Sign Out
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className={styles.content}>
          {message && (
            <div className={styles.successMessage}>
              <span className={styles.messageIcon}>✅</span>
              {message}
            </div>
          )}
          {profileError && (
            <div className={styles.errorMessage}>
              <span className={styles.messageIcon}>⚠️</span>
              {profileError}
            </div>
          )}

          {/* Profile Information Tab */}
          {activeTab === 'profile' && (
            <div className={styles.tabContent}>
              <h2>Profile Information</h2>
              
              <div className={styles.profileHeader}>
                <div className={styles.avatarSection}>
                  <div className={styles.avatar}>
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <input
                    type="file"
                    id="avatarUpload"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className={styles.avatarInput}
                  />
                  <label htmlFor="avatarUpload" className={styles.avatarUploadLabel}>
                    Change Photo
                  </label>
                </div>
                <div className={styles.userInfo}>
                  <h3>{formData.name || 'User'}</h3>
                  <p>{user?.email}</p>
                  <div className={styles.roleSection}>
                    {getRoleBadge('admin')}
                    <span className={styles.memberSince}>
                      Member since {new Date(user?.metadata?.creationTime).getFullYear() || '2024'}
                    </span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleProfileUpdate} className={styles.form}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="name">Full Name *</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter your full name"
                      disabled={loading}
                      required
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
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="phone">Phone Number</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+62 812-3456-7890"
                      disabled={loading}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="department">Department</label>
                    <select
                      id="department"
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                      disabled={loading}
                    >
                      <option value="Medical Staff">Medical Staff</option>
                      <option value="Emergency">Emergency Department</option>
                      <option value="ICU">Intensive Care Unit</option>
                      <option value="Cardiology">Cardiology</option>
                      <option value="Pediatrics">Pediatrics</option>
                      <option value="Surgery">Surgery</option>
                    </select>
                  </div>
                </div>

                <div className={styles.formActions}>
                  <button 
                    type="submit" 
                    className={styles.saveButton}
                    disabled={loading || !formData.name.trim()}
                  >
                    {loading ? '🔄 Saving...' : '💾 Save Changes'}
                  </button>
                  <button 
                    type="button" 
                    className={styles.cancelButton}
                    onClick={() => window.history.back()}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className={styles.tabContent}>
              <h2>Security Settings</h2>
              
              <div className={styles.securitySections}>
                <div className={styles.securitySection}>
                  <h4>Change Password</h4>
                  <form onSubmit={handlePasswordChange} className={styles.form}>
                    <div className={styles.formGroup}>
                      <label htmlFor="currentPassword">Current Password *</label>
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
                      <label htmlFor="newPassword">New Password *</label>
                      <input
                        type="password"
                        id="newPassword"
                        name="newPassword"
                        value={formData.newPassword}
                        onChange={handleInputChange}
                        placeholder="Enter new password"
                        required
                        minLength="8"
                        disabled={loading}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="confirmPassword">Confirm New Password *</label>
                      <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        placeholder="Confirm new password"
                        required
                        minLength="8"
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
                      {loading ? '🔄 Changing Password...' : '🔐 Change Password'}
                    </button>
                  </form>
                </div>

                <div className={styles.securitySection}>
                  <h4>Password Requirements</h4>
                  <div className={styles.requirements}>
                    <div className={styles.requirementItem}>
                      <span className={`${styles.requirementIcon} ${formData.newPassword.length >= 8 ? styles.valid : ''}`}>
                        {formData.newPassword.length >= 8 ? '✅' : '⚪'}
                      </span>
                      <span>Minimum 8 characters</span>
                    </div>
                    <div className={styles.requirementItem}>
                      <span className={`${styles.requirementIcon} ${/(?=.*[a-z])/.test(formData.newPassword) ? styles.valid : ''}`}>
                        {/(?=.*[a-z])/.test(formData.newPassword) ? '✅' : '⚪'}
                      </span>
                      <span>One lowercase letter</span>
                    </div>
                    <div className={styles.requirementItem}>
                      <span className={`${styles.requirementIcon} ${/(?=.*[A-Z])/.test(formData.newPassword) ? styles.valid : ''}`}>
                        {/(?=.*[A-Z])/.test(formData.newPassword) ? '✅' : '⚪'}
                      </span>
                      <span>One uppercase letter</span>
                    </div>
                    <div className={styles.requirementItem}>
                      <span className={`${styles.requirementIcon} ${/(?=.*\d)/.test(formData.newPassword) ? styles.valid : ''}`}>
                        {/(?=.*\d)/.test(formData.newPassword) ? '✅' : '⚪'}
                      </span>
                      <span>One number</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div className={styles.tabContent}>
              <h2>Preferences</h2>
              
              <div className={styles.preferenceSections}>
                <div className={styles.preferenceSection}>
                  <h4>🔔 Notifications</h4>
                  <div className={styles.preferenceItem}>
                    <div className={styles.preferenceInfo}>
                      <label>Email Notifications</label>
                      <span>Receive email alerts for important updates</span>
                    </div>
                    <label className={styles.switch}>
                      <input 
                        type="checkbox" 
                        checked={preferences.emailNotifications}
                        onChange={(e) => handlePreferenceChange('emailNotifications', e.target.checked)}
                        disabled={loading}
                      />
                      <span className={styles.slider}></span>
                    </label>
                  </div>
                  <div className={styles.preferenceItem}>
                    <div className={styles.preferenceInfo}>
                      <label>Push Notifications</label>
                      <span>Browser notifications for real-time alerts</span>
                    </div>
                    <label className={styles.switch}>
                      <input 
                        type="checkbox" 
                        checked={preferences.pushNotifications}
                        onChange={(e) => handlePreferenceChange('pushNotifications', e.target.checked)}
                        disabled={loading}
                      />
                      <span className={styles.slider}></span>
                    </label>
                  </div>
                  <div className={styles.preferenceItem}>
                    <div className={styles.preferenceInfo}>
                      <label>Critical Alerts</label>
                      <span>Immediate notifications for critical patient conditions</span>
                    </div>
                    <label className={styles.switch}>
                      <input 
                        type="checkbox" 
                        checked={preferences.criticalAlerts}
                        onChange={(e) => handlePreferenceChange('criticalAlerts', e.target.checked)}
                        disabled={loading}
                      />
                      <span className={styles.slider}></span>
                    </label>
                  </div>
                </div>

                <div className={styles.preferenceSection}>
                  <h4>🎨 Display & Interface</h4>
                  <div className={styles.preferenceItem}>
                    <label>Theme</label>
                    <select 
                      value={preferences.theme}
                      onChange={(e) => handlePreferenceChange('theme', e.target.value)}
                      disabled={loading}
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="auto">Auto (System)</option>
                    </select>
                  </div>
                  <div className={styles.preferenceItem}>
                    <label>Language</label>
                    <select 
                      value={preferences.language}
                      onChange={(e) => handlePreferenceChange('language', e.target.value)}
                      disabled={loading}
                    >
                      <option value="en">English</option>
                      <option value="id">Bahasa Indonesia</option>
                    </select>
                  </div>
                  <div className={styles.preferenceItem}>
                    <label>Timezone</label>
                    <select 
                      value={preferences.timezone}
                      onChange={(e) => handlePreferenceChange('timezone', e.target.value)}
                      disabled={loading}
                    >
                      <option value="Asia/Jakarta">Jakarta (GMT+7)</option>
                      <option value="Asia/Singapore">Singapore (GMT+8)</option>
                      <option value="UTC">UTC</option>
                    </select>
                  </div>
                  <div className={styles.preferenceItem}>
                    <label>Date Format</label>
                    <select 
                      value={preferences.dateFormat}
                      onChange={(e) => handlePreferenceChange('dateFormat', e.target.value)}
                      disabled={loading}
                    >
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>
                </div>

                <div className={styles.preferenceSection}>
                  <h4>⚡ Performance</h4>
                  <div className={styles.preferenceItem}>
                    <div className={styles.preferenceInfo}>
                      <label>Auto Refresh</label>
                      <span>Automatically refresh patient data</span>
                    </div>
                    <label className={styles.switch}>
                      <input 
                        type="checkbox" 
                        checked={preferences.autoRefresh}
                        onChange={(e) => handlePreferenceChange('autoRefresh', e.target.checked)}
                        disabled={loading}
                      />
                      <span className={styles.slider}></span>
                    </label>
                  </div>
                  <div className={styles.preferenceItem}>
                    <label>Data Density</label>
                    <select 
                      value={preferences.dataDensity}
                      onChange={(e) => handlePreferenceChange('dataDensity', e.target.value)}
                      disabled={loading}
                    >
                      <option value="compact">Compact</option>
                      <option value="normal">Normal</option>
                      <option value="comfortable">Comfortable</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className={styles.preferenceActions}>
                <button 
                  className={styles.saveButton}
                  onClick={handlePreferencesSave}
                  disabled={loading}
                >
                  {loading ? '🔄 Saving...' : '💾 Save Preferences'}
                </button>
                <button 
                  className={styles.resetButton}
                  onClick={loadUserPreferences}
                  disabled={loading}
                >
                  Reset to Defaults
                </button>
              </div>
            </div>
          )}

          {/* Activity Tab */}
          {activeTab === 'activity' && (
            <div className={styles.tabContent}>
              <h2>Account Activity</h2>
              <p className={styles.activitySubtitle}>Recent security events and account activity</p>
              
              <div className={styles.activityLog}>
                {activityLog.map(log => (
                  <div key={log.id} className={styles.activityItem}>
                    <div className={styles.activityIcon}>
                      {log.action === 'login' && '🔐'}
                      {log.action === 'password_change' && '🔑'}
                      {log.action === 'profile_update' && '👤'}
                    </div>
                    <div className={styles.activityDetails}>
                      <div className={styles.activityDescription}>
                        {log.description}
                      </div>
                      <div className={styles.activityMeta}>
                        <span className={styles.activityTime}>
                          {formatTimestamp(log.timestamp)}
                        </span>
                        <span className={styles.activityIp}>
                          IP: {log.ip}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {activityLog.length === 0 && (
                <div className={styles.noActivity}>
                  <div className={styles.noActivityIcon}>📊</div>
                  <h3>No activity found</h3>
                  <p>Account activity will appear here</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}