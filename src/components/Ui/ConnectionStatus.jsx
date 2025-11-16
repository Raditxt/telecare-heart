import React from 'react';
import styles from './ConnectionStatus.module.css';

export default function ConnectionStatus({ isConnected, deviceId, lastUpdate }) {
  const formatTime = (timestamp) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className={styles.connectionStatus}>
      <div className={`${styles.statusIndicator} ${isConnected ? styles.connected : styles.disconnected}`}>
        <span className={styles.dot}></span>
        {isConnected ? 'Online' : 'Offline'}
      </div>
      <div className={styles.deviceInfo}>
        <span className={styles.deviceId}>{deviceId}</span>
        <span className={styles.lastUpdate}>
          Last: {formatTime(lastUpdate)}
        </span>
      </div>
    </div>
  );
}