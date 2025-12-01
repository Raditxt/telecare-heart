import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import styles from './Sidebar.module.css';

export default function Sidebar({ isOpen, onClose, onToggle }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isDoctor, isFamily, getDisplayName } = useAuth(); // Hapus getRoleDisplay
  const [isMobile, setIsMobile] = useState(false);

  // Detect screen size
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      
      // Auto-close sidebar on mobile when resizing to mobile size
      if (mobile && isOpen) {
        onClose();
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, [isOpen, onClose]);

  // Menu items configuration based on role
  const getMenuItems = () => {
    // Common items for all users
    const commonItems = [
      { path: '/profile', icon: '👤', label: 'Profile', roles: ['doctor', 'family'] },
      { path: '/system-test', icon: '🔧', label: 'System Test', roles: ['doctor', 'family'] },
    ];

    // Doctor menu items
    const doctorItems = [
      { path: '/dashboard', icon: '📊', label: 'Dashboard', roles: ['doctor'] },
      { path: '/patients', icon: '👥', label: 'All Patients', roles: ['doctor'] },
      { path: '/manage-patients', icon: '📋', label: 'Manage Patients', roles: ['doctor'] },
      { path: '/history', icon: '📈', label: 'History & Analytics', roles: ['doctor'] },
      { path: '/device', icon: '🖥️', label: 'Device Monitoring', roles: ['doctor'] },
    ];

    // Family menu items
    const familyItems = [
      { path: '/family-dashboard', icon: '🏠', label: 'Family Dashboard', roles: ['family'] },
      { path: '/family/patients', icon: '👨‍👩‍👧‍👦', label: 'My Patients', roles: ['family'] },
      { path: '/family/history', icon: '📊', label: 'Health History', roles: ['family'] },
    ];

    // Combine items based on user role
    if (isDoctor()) {
      return [...doctorItems, ...commonItems];
    } else if (isFamily()) {
      return [...familyItems, ...commonItems];
    }
    
    return commonItems;
  };

  const handleLinkClick = () => {
    if (isMobile) {
      onClose();
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
      if (isMobile) {
        onClose();
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const menuItems = getMenuItems();

  // Show simplified version when collapsed on desktop
  const showCollapsed = !isOpen && !isMobile;

  return (
    <>
      {/* Overlay for mobile only */}
      {isOpen && isMobile && (
        <div 
          className={styles.overlay} 
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      
      {/* Sidebar */}
      <aside 
        className={`${styles.sidebar} ${
          isOpen ? styles.open : styles.closed
        } ${
          isMobile ? styles.mobile : styles.desktop
        }`}
        aria-label="Main navigation"
      >
        <div className={styles.sidebarHeader}>
          <div className={styles.logoSection}>
            <h2 className={styles.logo}>❤️ TeleCare Heart</h2>
            {user && isOpen && (
              <>
                <small className={styles.systemName}>Patient Monitoring System</small>
                <div className={styles.userInfo}>
                  <span className={styles.userName}>{getDisplayName()}</span>
                  <span className={styles.userRole}>
                    {isDoctor() ? '👨‍⚕️ Doctor' : '👨‍👩‍👧‍👦 Family Member'}
                  </span>
                </div>
              </>
            )}
          </div>
          
          <div className={styles.headerActions}>
            {/* Toggle button - desktop only */}
            {!isMobile && (
              <button 
                className={styles.toggleButton}
                onClick={onToggle}
                aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
              >
                {isOpen ? '◀' : '▶'}
              </button>
            )}
            
            {/* Close button - mobile only */}
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
        
        <nav className={styles.nav} aria-label="Sidebar navigation">
          <div className={styles.navSection}>
            {isOpen && (
              <h4 className={styles.navTitle}>MAIN NAVIGATION</h4>
            )}
            <ul className={styles.navList}>
              {menuItems.map(item => {
                const isActive = location.pathname === item.path;
                const isDoctorOnly = item.roles?.includes('doctor') && !item.roles?.includes('family');
                const isFamilyOnly = item.roles?.includes('family') && !item.roles?.includes('doctor');
                
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`${styles.navItem} ${
                        isActive ? styles.active : ''
                      } ${
                        showCollapsed ? styles.collapsed : ''
                      }`}
                      onClick={handleLinkClick}
                      title={showCollapsed ? item.label : ''}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <span className={styles.navIcon} aria-hidden="true">
                        {item.icon}
                      </span>
                      <span className={styles.navLabel}>
                        {item.label}
                        {isDoctorOnly && (
                          <span className={styles.roleBadge} aria-label="Doctor only feature">
                            👨‍⚕️
                          </span>
                        )}
                        {isFamilyOnly && (
                          <span className={styles.roleBadge} aria-label="Family only feature">
                            👨‍👩‍👧‍👦
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        {/* Bottom Section */}
        <div className={styles.bottomSection}>
          {/* Logout Button */}
          {user && (
            <button 
              className={`${styles.logoutButton} ${
                showCollapsed ? styles.collapsed : ''
              }`}
              onClick={handleLogout}
              title={showCollapsed ? "Logout" : ""}
            >
              <span className={styles.logoutIcon} aria-hidden="true">🚪</span>
              {(!showCollapsed || isOpen) && (
                <span className={styles.logoutText}>Logout</span>
              )}
            </button>
          )}

          {/* System Info - Only show when sidebar is open */}
          {isOpen && !isMobile && (
            <div className={styles.systemInfo}>
              <small>TeleCare Heart v1.0</small>
              <small>© 2024 Hospital System</small>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}