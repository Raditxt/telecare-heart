// components/Ui/AlertBell.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useAlerts } from '../../hooks/useAlerts';
import styles from './AlertBell.module.css';

export default function AlertBell() {
  const { alerts, unreadCount, stats, markAllAsRead } = useAlerts();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleBellClick = () => {
    setIsOpen(!isOpen);
    if (unreadCount > 0 && !isOpen) {
      markAllAsRead();
    }
  };

  const getBellIcon = () => {
    if (stats.critical > 0) return '🔴';
    if (stats.warning > 0) return '🟡';
    if (unreadCount > 0) return '🔔';
    return '🔕';
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const diff = (now - new Date(timestamp)) / 1000;
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className={styles.alertBell} ref={dropdownRef}>
      <button 
        className={styles.bellButton}
        onClick={handleBellClick}
        aria-label={`${unreadCount} unread alerts`}
      >
        <span className={styles.bellIcon}>{getBellIcon()}</span>
        {unreadCount > 0 && (
          <span className={styles.badge}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.dropdownHeader}>
            <h3>Alerts & Notifications</h3>
            <div className={styles.alertStats}>
              {stats.critical > 0 && (
                <span className={styles.criticalStat}>{stats.critical} Critical</span>
              )}
              {stats.warning > 0 && (
                <span className={styles.warningStat}>{stats.warning} Warning</span>
              )}
            </div>
          </div>

          <div className={styles.alertsList}>
            {alerts.length > 0 ? (
              alerts.slice(0, 10).map(alert => (
                <div 
                  key={alert.id} 
                  className={`${styles.alertItem} ${styles[alert.level]}`}
                >
                  <div className={styles.alertIcon}>
                    {alert.level === 'critical' ? '🚨' : 
                     alert.level === 'warning' ? '⚠️' : 'ℹ️'}
                  </div>
                  <div className={styles.alertContent}>
                    <div className={styles.alertTitle}>{alert.title}</div>
                    <div className={styles.alertMessage}>{alert.message}</div>
                    <div className={styles.alertMeta}>
                      {alert.patient?.name && (
                        <span className={styles.patientName}>{alert.patient.name}</span>
                      )}
                      <span className={styles.alertTime}>
                        {formatTime(alert.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.noAlerts}>
                <div className={styles.noAlertsIcon}>🎉</div>
                <p>No active alerts</p>
                <small>All systems normal</small>
              </div>
            )}
          </div>

          {alerts.length > 0 && (
            <div className={styles.dropdownFooter}>
              <button className={styles.viewAllButton}>
                View All Alerts
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}