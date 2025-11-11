import React, { useState, useEffect } from 'react';
import styles from './MonitoringHistory.module.css';

export default function MonitoringHistory() {
  const [history, setHistory] = useState([]);
  const [filter, setFilter] = useState('all');
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, [filter, dateRange]);

  const loadHistory = async () => {
    try {
      // Mock data - replace with actual API call
      const mockHistory = [
        {
          id: '1',
          patientName: 'John Doe',
          timestamp: new Date('2024-01-15T10:30:00Z'),
          hr: 72,
          spo2: 98,
          temp: 36.8,
          status: 'normal',
          deviceId: 'ESP32-A1B2C3'
        },
        {
          id: '2', 
          patientName: 'John Doe',
          timestamp: new Date('2024-01-15T10:25:00Z'),
          hr: 95,
          spo2: 96,
          temp: 37.2,
          status: 'critical',
          deviceId: 'ESP32-A1B2C3'
        }
      ];
      setHistory(mockHistory);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = history.filter(record => {
    if (filter === 'critical' && record.status !== 'critical') return false;
    if (filter === 'warning' && record.status !== 'warning') return false;
    
    const recordDate = new Date(record.timestamp).toISOString().split('T')[0];
    return recordDate >= dateRange.start && recordDate <= dateRange.end;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'critical': return styles.critical;
      case 'warning': return styles.warning;
      case 'normal': return styles.normal;
      default: return styles.normal;
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading history...</div>;
  }

  return (
    <div className={styles.history}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1>Monitoring History</h1>
          <p>Review past patient vital sign recordings</p>
        </div>
        
        <div className={styles.filters}>
          <div className={styles.dateRange}>
            <label>From:</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            />
            <label>To:</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            />
          </div>
          
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">All Status</option>
            <option value="critical">Critical Only</option>
            <option value="warning">Warning Only</option>
            <option value="normal">Normal Only</option>
          </select>
        </div>
      </div>

      <div className={styles.statsOverview}>
        <div className={styles.statCard}>
          <span className={styles.statNumber}>{filteredHistory.length}</span>
          <span className={styles.statLabel}>Total Records</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statNumber}>
            {filteredHistory.filter(r => r.status === 'critical').length}
          </span>
          <span className={styles.statLabel}>Critical Events</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statNumber}>
            {filteredHistory.length > 0 
              ? Math.round(filteredHistory.reduce((sum, r) => sum + r.hr, 0) / filteredHistory.length)
              : 0
            }
          </span>
          <span className={styles.statLabel}>Avg Heart Rate</span>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Patient</th>
              <th>Date & Time</th>
              <th>Heart Rate</th>
              <th>SpO₂</th>
              <th>Temperature</th>
              <th>Device</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredHistory.map(record => (
              <tr key={record.id}>
                <td className={styles.patientCell}>
                  <div className={styles.patientInfo}>
                    <div className={styles.avatar}>
                      {record.patientName.split(' ').map(n => n[0]).join('')}
                    </div>
                    {record.patientName}
                  </div>
                </td>
                <td className={styles.timestamp}>
                  {new Date(record.timestamp).toLocaleString()}
                </td>
                <td>
                  <span className={styles.vitalValue}>
                    {record.hr} <small>BPM</small>
                  </span>
                </td>
                <td>
                  <span className={styles.vitalValue}>
                    {record.spo2} <small>%</small>
                  </span>
                </td>
                <td>
                  <span className={styles.vitalValue}>
                    {record.temp} <small>°C</small>
                  </span>
                </td>
                <td className={styles.deviceId}>
                  {record.deviceId}
                </td>
                <td>
                  <span className={`${styles.status} ${getStatusColor(record.status)}`}>
                    {record.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredHistory.length === 0 && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📊</div>
            <h3>No records found</h3>
            <p>No monitoring data matches your current filters</p>
          </div>
        )}
      </div>

      {/* Export Feature */}
      <div className={styles.exportSection}>
        <button className={styles.exportButton}>
          📥 Export to CSV
        </button>
        <button className={styles.exportButton}>
          📄 Generate Report
        </button>
      </div>
    </div>
  );
}