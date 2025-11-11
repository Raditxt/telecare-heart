import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from './Sidebar.module.css';

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();

  const menuItems = [
    { path: '/dashboard', icon: '📊', label: 'Dashboard' },
    { path: '/patients', icon: '👥', label: 'Patient List' },
    { path: '/monitor', icon: '❤️', label: 'Real-Time Monitor' },
    { path: '/history', icon: '📈', label: 'History' },
    { path: '/profile', icon: '👤', label: 'Profile' },
  ];

  return (
    <>
      {/* Overlay */}
      {isOpen && <div className={styles.overlay} onClick={onClose} />}
      
      {/* Sidebar */}
      <div className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
        <div className={styles.sidebarHeader}>
          <h2>TeleCare-Heart</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>
        
        <nav className={styles.nav}>
          {menuItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`${styles.navItem} ${
                location.pathname === item.path ? styles.active : ''
              }`}
              onClick={onClose}
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