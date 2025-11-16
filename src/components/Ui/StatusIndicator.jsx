import React from 'react';
import styles from './StatusIndicator.module.css';

export default function StatusIndicator({ status }) {
  const getStatusConfig = (status) => {
    switch (status) {
      case 'critical':
        return { label: 'Critical', color: '#ef4444', icon: '🚨' };
      case 'warning':
        return { label: 'Warning', color: '#f59e0b', icon: '⚠️' };
      default:
        return { label: 'Normal', color: '#10b981', icon: '✅' };
    }
  };

  const config = getStatusConfig(status);

  return (
    <div className={styles.statusIndicator} style={{ borderColor: config.color }}>
      <span className={styles.icon}>{config.icon}</span>
      <span className={styles.label}>{config.label}</span>
    </div>
  );
}