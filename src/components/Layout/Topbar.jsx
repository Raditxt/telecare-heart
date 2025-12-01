import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import styles from './TopBar.module.css';

export default function TopBar({ onMenuToggle }) {
  const { user, logout, getDisplayName, getRoleDisplay } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleProfileClick = () => {
    navigate('/profile');
    setShowUserMenu(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
      setShowUserMenu(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <header className={styles.topBar}>
      <div className={styles.leftSection}>
        <button 
          className={styles.menuButton}
          onClick={onMenuToggle}
          aria-label="Toggle menu"
        >
          <span className={styles.menuIcon}>☰</span>
        </button>
        <div className={styles.breadcrumb}>
          <span className={styles.appName}>TeleCare-Heart</span>
        </div>
      </div>

      <div className={styles.rightSection}>
        {/* Notifications */}
        <button 
          className={styles.iconButton} 
          aria-label="Notifications"
          onClick={() => console.log('Notifications clicked')}
        >
          <span className={styles.notificationIcon}>🔔</span>
          {/* Notification badge can be added here */}
          {/* <span className={styles.notificationBadge}>3</span> */}
        </button>

        {/* User Menu */}
        <div className={styles.userMenu} ref={userMenuRef}>
          <button 
            className={styles.userButton}
            onClick={() => setShowUserMenu(!showUserMenu)}
            aria-label="User menu"
            aria-expanded={showUserMenu}
          >
            <div className={styles.userAvatar}>
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className={styles.userInfo}>
              <span className={styles.userName}>{getDisplayName()}</span>
              <span className={styles.userRole}>{getRoleDisplay()}</span>
            </div>
            <span className={`${styles.dropdownArrow} ${showUserMenu ? styles.rotated : ''}`}>
              ▼
            </span>
          </button>

          {showUserMenu && (
            <div className={styles.userDropdown}>
              <div className={styles.dropdownHeader}>
                <div className={styles.dropdownUserName}>{getDisplayName()}</div>
                <div className={styles.dropdownUserRole}>{getRoleDisplay()}</div>
              </div>
              
              <div className={styles.dropdownDivider}></div>
              
              <button 
                className={styles.dropdownItem}
                onClick={handleProfileClick}
              >
                <span className={styles.dropdownIcon}>👤</span>
                <span className={styles.dropdownText}>Profile Settings</span>
              </button>
              
              <button 
                className={styles.dropdownItem}
                onClick={() => {
                  console.log('Preferences clicked');
                  setShowUserMenu(false);
                }}
              >
                <span className={styles.dropdownIcon}>⚙️</span>
                <span className={styles.dropdownText}>Preferences</span>
              </button>
              
              <div className={styles.dropdownDivider}></div>
              
              <button 
                className={`${styles.dropdownItem} ${styles.logoutItem}`}
                onClick={handleLogout}
              >
                <span className={styles.dropdownIcon}>🚪</span>
                <span className={styles.dropdownText}>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Overlay for dropdown - Only show on mobile */}
      {showUserMenu && (
        <div 
          className={styles.dropdownOverlay}
          onClick={() => setShowUserMenu(false)}
          aria-hidden="true"
        />
      )}
    </header>
  );
}