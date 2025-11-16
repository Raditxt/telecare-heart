// components/Layout/Topbar.jsx
import React from 'react';
import { logout } from '../../services/auth';
import { useNavigate } from 'react-router-dom';
import AlertBell from '../Ui/AlertBell'; // ✅ Import AlertBell
import styles from './Topbar.module.css';

export default function Topbar({ onMenuClick, user }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className={styles.topbar}>
      <div className={styles.leftSection}>
        <button 
          className={styles.menuButton} 
          onClick={onMenuClick}
          aria-label="Open sidebar"
        >
          ☰
        </button>
        <h1 className={styles.appTitle}>TeleCare-Heart</h1>
      </div>
      
      <div className={styles.rightSection}>
        {/* ✅ Tambahkan AlertBell di sini */}
        <AlertBell />
        
        <div className={styles.userInfo}>
          <span className={styles.userName}>
            {user?.email || 'User'}
          </span>
        </div>
        <button onClick={handleLogout} className={styles.logoutButton}>
          Logout
        </button>
      </div>
    </div>
  );
}