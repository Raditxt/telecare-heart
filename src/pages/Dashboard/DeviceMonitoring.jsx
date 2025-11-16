import React, { useState, useEffect, useCallback } from 'react';
import styles from './DeviceMonitoring.module.css';

export default function DeviceMonitoring() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [errorLogs, setErrorLogs] = useState([]);

  useEffect(() => {
    loadDeviceStatus();
    const interval = setInterval(loadDeviceStatus, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadDeviceStatus = useCallback(async () => {
/*************  ✨ Windsurf Command ⭐  *************/
/**
 * Loads the monitoring history data from the API (currently mocked)
 * and updates the state accordingly.
 * 
 * @return {Promise<void>} Resolves when the data has been loaded and the state updated.
 */
/*******  34bdade8-bc80-4376-8453-0bb72c9d224b  *******/    try {
      // Mock data - replace with actual API call
      const mockDevices = [
        {
          id: 'ESP32-A1B2C3',
          name: 'Bedside Monitor - Room 101',
          status: 'connected',
          lastSeen: new Date(),
          batteryLevel: 85,
          signalStrength: 4,
          firmwareVersion: 'v2.1.4',
          ipAddress: '192.168.1.101',
          patient: 'John Doe',
          room: '101',
          uptime: '15 days 8h',
          dataRate: '2.3 KB/s',
          temperature: 42.5,
          errors: 2
        },
        {
          id: 'ESP32-D4E5F6',
          name: 'Mobile Monitor - Ward A',
          status: 'connected',
          lastSeen: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
          batteryLevel: 45,
          signalStrength: 3,
          firmwareVersion: 'v2.0.8',
          ipAddress: '192.168.1.102',
          patient: 'Sarah Wilson',
          room: 'A-12',
          uptime: '8 days 12h',
          dataRate: '1.8 KB/s',
          temperature: 38.2,
          errors: 0
        },
        {
          id: 'ESP32-G7H8I9',
          name: 'ICU Monitor - Room 205',
          status: 'disconnected',
          lastSeen: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
          batteryLevel: 92,
          signalStrength: 0,
          firmwareVersion: 'v2.1.0',
          ipAddress: '192.168.1.103',
          patient: 'Mike Johnson',
          room: 'ICU-205',
          uptime: '22 days 4h',
          dataRate: '0 KB/s',
          temperature: null,
          errors: 5
        },
        {
          id: 'ESP32-J0K1L2',
          name: 'Emergency Cart Monitor',
          status: 'warning',
          lastSeen: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
          batteryLevel: 23,
          signalStrength: 2,
          firmwareVersion: 'v1.8.3',
          ipAddress: '192.168.1.104',
          patient: 'Emergency Cart',
          room: 'Central Hall',
          uptime: '3 days 16h',
          dataRate: '0.9 KB/s',
          temperature: 47.8,
          errors: 3
        }
      ];

      const mockErrorLogs = [
        {
          id: '1',
          deviceId: 'ESP32-A1B2C3',
          timestamp: new Date(Date.now() - 10 * 60 * 1000),
          type: 'sensor_error',
          message: 'SpO2 sensor calibration required',
          severity: 'warning'
        },
        {
          id: '2',
          deviceId: 'ESP32-G7H8I9',
          timestamp: new Date(Date.now() - 25 * 60 * 1000),
          type: 'connection_lost',
          message: 'Device disconnected from network',
          severity: 'critical'
        },
        {
          id: '3',
          deviceId: 'ESP32-J0K1L2',
          timestamp: new Date(Date.now() - 30 * 60 * 1000),
          type: 'battery_low',
          message: 'Battery level below 25%',
          severity: 'warning'
        },
        {
          id: '4',
          deviceId: 'ESP32-J0K1L2',
          timestamp: new Date(Date.now() - 45 * 60 * 1000),
          type: 'overheating',
          message: 'Device temperature above 45°C',
          severity: 'critical'
        }
      ];

      setDevices(mockDevices);
      setErrorLogs(mockErrorLogs);
    } catch (error) {
      console.error('Error loading device status:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected': return styles.connected;
      case 'disconnected': return styles.disconnected;
      case 'warning': return styles.warning;
      default: return styles.unknown;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'connected': return '🟢';
      case 'disconnected': return '🔴';
      case 'warning': return '🟡';
      default: return '⚫';
    }
  };

  const getBatteryIcon = (level) => {
    if (level >= 80) return '🔋';
    if (level >= 50) return '🪫';
    if (level >= 20) return '🪫🔴';
    return '🪫❌';
  };

  const getSignalIcon = (strength) => {
    switch (strength) {
      case 4: return '📶';
      case 3: return '📶';
      case 2: return '📶';
      case 1: return '📶';
      default: return '📵';
    }
  };

  const formatLastSeen = (timestamp) => {
    const now = new Date();
    const diff = now - new Date(timestamp);
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const handleDeviceSelect = (device) => {
    setSelectedDevice(device);
  };

  const handleRestartDevice = (deviceId) => {
    if (window.confirm(`Are you sure you want to restart device ${deviceId}?`)) {
      // API call to restart device
      alert(`Device ${deviceId} restart command sent`);
    }
  };

  const handleUpdateFirmware = (deviceId) => {
    if (window.confirm(`Update firmware for device ${deviceId}?`)) {
      // API call to update firmware
      alert(`Firmware update initiated for ${deviceId}`);
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading device status...</p>
      </div>
    );
  }

  return (
    <div className={styles.deviceMonitoring}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1>Device Status & Monitoring</h1>
          <p>Monitor IoT device health and connection status</p>
        </div>
        <div className={styles.statsOverview}>
          <div className={styles.stat}>
            <span className={styles.statNumber}>{devices.filter(d => d.status === 'connected').length}</span>
            <span className={styles.statLabel}>Connected</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statNumber}>{devices.filter(d => d.status === 'warning').length}</span>
            <span className={styles.statLabel}>Warning</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statNumber}>{devices.filter(d => d.status === 'disconnected').length}</span>
            <span className={styles.statLabel}>Disconnected</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statNumber}>{errorLogs.length}</span>
            <span className={styles.statLabel}>Active Errors</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.content}>
        {/* Device Grid */}
        <div className={styles.deviceGrid}>
          <h2>Connected Devices</h2>
          <div className={styles.grid}>
            {devices.map(device => (
              <div 
                key={device.id} 
                className={`${styles.deviceCard} ${getStatusColor(device.status)} ${selectedDevice?.id === device.id ? styles.selected : ''}`}
                onClick={() => handleDeviceSelect(device)}
              >
                <div className={styles.deviceHeader}>
                  <div className={styles.deviceInfo}>
                    <span className={styles.statusIcon}>{getStatusIcon(device.status)}</span>
                    <div>
                      <h3 className={styles.deviceName}>{device.name}</h3>
                      <p className={styles.deviceId}>{device.id}</p>
                    </div>
                  </div>
                  <div className={styles.indicators}>
                    <span className={styles.battery} title={`Battery: ${device.batteryLevel}%`}>
                      {getBatteryIcon(device.batteryLevel)} {device.batteryLevel}%
                    </span>
                    <span className={styles.signal} title="Signal Strength">
                      {getSignalIcon(device.signalStrength)}
                    </span>
                  </div>
                </div>

                <div className={styles.deviceDetails}>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Patient:</span>
                    <span className={styles.detailValue}>{device.patient}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Room:</span>
                    <span className={styles.detailValue}>{device.room}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Last Seen:</span>
                    <span className={styles.detailValue}>{formatLastSeen(device.lastSeen)}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Uptime:</span>
                    <span className={styles.detailValue}>{device.uptime}</span>
                  </div>
                  {device.temperature && (
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Temp:</span>
                      <span className={styles.detailValue}>{device.temperature}°C</span>
                    </div>
                  )}
                </div>

                <div className={styles.deviceFooter}>
                  <div className={styles.firmware}>
                    FW: {device.firmwareVersion}
                  </div>
                  <div className={styles.actions}>
                    <button 
                      className={styles.actionButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRestartDevice(device.id);
                      }}
                      disabled={device.status === 'disconnected'}
                    >
                      🔄
                    </button>
                    <button 
                      className={styles.actionButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpdateFirmware(device.id);
                      }}
                    >
                      ⬆️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Error Logs */}
        <div className={styles.errorSection}>
          <h2>Error Logs</h2>
          <div className={styles.errorLogs}>
            {errorLogs.map(log => (
              <div key={log.id} className={`${styles.errorLog} ${styles[log.severity]}`}>
                <div className={styles.errorHeader}>
                  <span className={styles.errorDevice}>{log.deviceId}</span>
                  <span className={styles.errorTime}>{formatLastSeen(log.timestamp)}</span>
                </div>
                <div className={styles.errorMessage}>{log.message}</div>
                <div className={styles.errorType}>{log.type}</div>
              </div>
            ))}
            {errorLogs.length === 0 && (
              <div className={styles.noErrors}>
                <div className={styles.noErrorsIcon}>✅</div>
                <p>No active errors</p>
                <span>All devices are operating normally</span>
              </div>
            )}
          </div>
        </div>

        {/* Selected Device Details */}
        {selectedDevice && (
          <div className={styles.deviceDetailPanel}>
            <h3>Device Details - {selectedDevice.name}</h3>
            <div className={styles.detailGrid}>
              <div className={styles.detailItem}>
                <label>IP Address:</label>
                <span>{selectedDevice.ipAddress}</span>
              </div>
              <div className={styles.detailItem}>
                <label>Firmware:</label>
                <span>{selectedDevice.firmwareVersion}</span>
              </div>
              <div className={styles.detailItem}>
                <label>Data Rate:</label>
                <span>{selectedDevice.dataRate}</span>
              </div>
              <div className={styles.detailItem}>
                <label>Errors:</label>
                <span>{selectedDevice.errors}</span>
              </div>
              <div className={styles.detailItem}>
                <label>Battery Health:</label>
                <span>
                  {selectedDevice.batteryLevel >= 80 ? 'Excellent' :
                   selectedDevice.batteryLevel >= 50 ? 'Good' :
                   selectedDevice.batteryLevel >= 20 ? 'Fair' : 'Poor'}
                </span>
              </div>
              <div className={styles.detailItem}>
                <label>Connection Quality:</label>
                <span>
                  {selectedDevice.signalStrength >= 4 ? 'Excellent' :
                   selectedDevice.signalStrength >= 3 ? 'Good' :
                   selectedDevice.signalStrength >= 2 ? 'Fair' : 'Poor'}
                </span>
              </div>
            </div>
            
            <div className={styles.detailActions}>
              <button className={styles.primaryButton}>View Detailed Logs</button>
              <button className={styles.secondaryButton}>Run Diagnostics</button>
              <button className={styles.secondaryButton}>Configuration</button>
            </div>
          </div>
        )}
      </div>

      {/* System Controls */}
      <div className={styles.systemControls}>
        <h3>System Controls</h3>
        <div className={styles.controlButtons}>
          <button className={styles.controlButton}>
            🔍 Scan for New Devices
          </button>
          <button className={styles.controlButton}>
            📊 Generate Health Report
          </button>
          <button className={styles.controlButton}>
            ⚙️ System Settings
          </button>
        </div>
      </div>
    </div>
  );
}