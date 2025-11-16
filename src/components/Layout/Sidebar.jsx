import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from './Sidebar.module.css';

export default function Sidebar({ isOpen, onClose, onToggle }) {
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);

  // Detect screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const menuItems = [
    { path: '/dashboard', icon: '📊', label: 'Dashboard' },
    { path: '/patients', icon: '👥', label: 'Patient List' },
    { path: '/history', icon: '📈', label: 'History & Analytics' },
    { path: '/device', icon: '💻', label: 'Device Status & Monitoring' },
    { path: '/profile', icon: '👤', label: 'Profile' },
  ];

  const handleLinkClick = () => {
    if (isMobile) {
      onClose();
    }
  };

  return (
    <>
      {/* Overlay for mobile only */}
      {isOpen && isMobile && (
        <div 
          className={styles.overlay} 
          onClick={onClose}
          aria-label="Close sidebar"
        />
      )}
      
      {/* Sidebar */}
      <div className={`${styles.sidebar} ${isOpen ? styles.open : styles.closed}`}>
        <div className={styles.sidebarHeader}>
          <h2>TeleCare-Heart</h2>
          <div className={styles.headerActions}>
            {/* Toggle button - show only on desktop */}
            {!isMobile && (
              <button 
                className={styles.toggleButton}
                onClick={onToggle}
                aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
              >
                {isOpen ? '≡' : '≡'} {/* Gunakan hamburger icon yang sama */}
              </button>
            )}
            {/* Close button - show only on mobile */}
            {isMobile && (
              <button 
                className={styles.closeButton} 
                onClick={onClose}
                aria-label="Close sidebar"
              >
                ×
              </button>
            )}
          </div>
        </div>
        
        <nav className={styles.nav}>
          {menuItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`${styles.navItem} ${
                location.pathname === item.path ? styles.active : ''
              }`}
              onClick={handleLinkClick}
              title={!isOpen && !isMobile ? item.label : ''}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span className={styles.navLabel}>{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}