import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getPatients, getMonitoringHistory, subscribeToPatientVitals } from '../../services/patientService';
import StatsCard from '../../components/Ui/StatsCard';
import styles from './PatientList.module.css';

export default function PatientList() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [error, setError] = useState('');
  const [realTimeSubscriptions, setRealTimeSubscriptions] = useState({});

  useEffect(() => {
    loadPatients();
    
    // Cleanup function for real-time subscriptions
    return () => {
      Object.values(realTimeSubscriptions).forEach(unsubscribe => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      });
    };
  }, []);

  const loadPatients = async () => {
    try {
      setError('');
      setLoading(true);
      
      // Clear existing subscriptions
      Object.values(realTimeSubscriptions).forEach(unsubscribe => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      });
      
      const patientsData = await getPatients();
      const recentVitals = await getMonitoringHistory({ limit: 200 });
      
      const enhancedPatients = patientsData.map(patient => {
        const patientVitals = recentVitals
          .filter(vital => vital.uid === patient.id)
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        const latestVital = patientVitals[0] || {};
        const status = determinePatientStatus(latestVital);
        
        return {
          id: patient.id,
          name: patient.name || 'Unknown Patient',
          email: patient.email || 'No email',
          deviceId: patient.deviceId || 'No device',
          status: status,
          lastHR: latestVital.hr || '--',
          lastSpO2: latestVital.spo2 || '--',
          lastTemp: latestVital.temp || latestVital.temperature || '--',
          lastUpdate: latestVital.timestamp || new Date().toISOString(),
          age: patient.age || '--',
          gender: patient.gender || '--',
          room: patient.room || '--',
          doctor: patient.doctor || '--',
          admissionDate: patient.admissionDate || '--'
        };
      });

      setPatients(enhancedPatients);
      
      // Setup real-time subscriptions for connected patients
      setupRealTimeSubscriptions(enhancedPatients);
      
    } catch (error) {
      console.error('Error loading patients:', error);
      setError('Failed to load patients data. Please try again.');
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  const setupRealTimeSubscriptions = (patientsData) => {
    const subscriptions = {};
    
    patientsData.forEach(patient => {
      if (patient.deviceId && patient.deviceId !== 'No device') {
        try {
          const unsubscribe = subscribeToPatientVitals(patient.id, (vital) => {
            if (vital) {
              setPatients(prev => prev.map(p => 
                p.id === patient.id 
                  ? { 
                      ...p, 
                      lastHR: vital.hr || p.lastHR,
                      lastSpO2: vital.spo2 || p.lastSpO2,
                      lastTemp: vital.temp || p.lastTemp,
                      status: determinePatientStatus(vital),
                      lastUpdate: vital.timestamp || new Date().toISOString()
                    }
                  : p
              ));
            }
          });
          
          subscriptions[patient.id] = unsubscribe;
        } catch (subscriptionError) {
          console.error(`Failed to subscribe to patient ${patient.id}:`, subscriptionError);
        }
      }
    });
    
    setRealTimeSubscriptions(subscriptions);
  };

  const determinePatientStatus = (vital) => {
    if (!vital || (!vital.hr && !vital.spo2 && !vital.temp)) return 'unknown';
    
    const hr = vital.hr;
    const spo2 = vital.spo2;
    const temp = vital.temp;
    
    // Critical conditions
    if ((hr && (hr > 120 || hr < 50)) || 
        (spo2 && spo2 < 90) || 
        (temp && temp > 38.5)) {
      return 'critical';
    }
    
    // Warning conditions
    if ((hr && (hr > 100 || hr < 60)) || 
        (spo2 && spo2 < 95) || 
        (temp && temp > 37.5)) {
      return 'warning';
    }
    
    return 'normal';
  };

  // Filter and sort patients
  const filteredAndSortedPatients = useMemo(() => {
    let filtered = patients.filter(patient => {
      const matchesSearch = 
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.deviceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.room.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || patient.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });

    // FIX: Declare variables outside switch
    let aValue, bValue;
    const statusOrder = { critical: 0, warning: 1, normal: 2, unknown: 3 };
    
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'status':
          aValue = statusOrder[a.status];
          bValue = statusOrder[b.status];
          break;
        case 'lastUpdate':
          aValue = new Date(a.lastUpdate);
          bValue = new Date(b.lastUpdate);
          break;
        case 'heartRate':
          aValue = a.lastHR === '--' ? 0 : parseInt(a.lastHR);
          bValue = b.lastHR === '--' ? 0 : parseInt(b.lastHR);
          break;
        case 'room':
          aValue = a.room;
          bValue = b.room;
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }
      
      if (sortOrder === 'desc') {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
      return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
    });

    return filtered;
  }, [patients, searchTerm, statusFilter, sortBy, sortOrder]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'critical': return styles.critical;
      case 'warning': return styles.warning;
      case 'normal': return styles.normal;
      default: return styles.unknown;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'critical': return '🔴';
      case 'warning': return '🟡';
      case 'normal': return '🟢';
      default: return '⚫';
    }
  };

  const formatLastUpdate = (timestamp) => {
    if (!timestamp || timestamp === '--') return 'No data';
    
    const updateTime = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.round((now - updateTime) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.round(diffInMinutes / 60)}h ago`;
    
    return updateTime.toLocaleDateString();
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (column) => {
    if (sortBy !== column) return '↕️';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const total = patients.length;
    const critical = patients.filter(p => p.status === 'critical').length;
    const warning = patients.filter(p => p.status === 'warning').length;
    const normal = patients.filter(p => p.status === 'normal').length;
    const connected = patients.filter(p => p.deviceId !== 'No device').length;
    
    return { total, critical, warning, normal, connected };
  }, [patients]);

  if (loading) {
    return (
      <div className={styles.patientList}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          Loading patients...
        </div>
      </div>
    );
  }

  return (
    <div className={styles.patientList}>
      {/* Header Section */}
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1>Patient Management</h1>
          <p>Real-time monitoring for all patients under your care</p>
        </div>
        <div className={styles.actions}>
          <div className={styles.searchBox}>
            <input
              type="text"
              placeholder="Search patients by name, email, room..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
            <span className={styles.searchIcon}>🔍</span>
          </div>
          <button 
            onClick={loadPatients}
            className={styles.refreshButton}
            disabled={loading}
          >
            {loading ? '🔄' : '🔄 Refresh'}
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className={styles.statsGrid}>
        <StatsCard 
          title="Total Patients" 
          value={stats.total} 
          icon="👥" 
          color="blue"
        />
        <StatsCard 
          title="Critical" 
          value={stats.critical} 
          icon="🔴" 
          color="red"
        />
        <StatsCard 
          title="Warning" 
          value={stats.warning} 
          icon="🟡" 
          color="orange"
        />
        <StatsCard 
          title="Connected" 
          value={stats.connected} 
          icon="📱" 
          color="green"
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className={styles.errorMessage}>
          {error}
        </div>
      )}

      {/* Filters and Controls */}
      <div className={styles.controls}>
        <div className={styles.filters}>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">All Status</option>
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
            <option value="normal">Normal</option>
            <option value="unknown">Unknown</option>
          </select>
          
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className={styles.sortSelect}
          >
            <option value="name">Sort by Name</option>
            <option value="status">Sort by Status</option>
            <option value="lastUpdate">Sort by Last Update</option>
            <option value="heartRate">Sort by Heart Rate</option>
            <option value="room">Sort by Room</option>
          </select>
        </div>
        
        <div className={styles.patientCount}>
          Showing {filteredAndSortedPatients.length} of {patients.length} patients
          {statusFilter !== 'all' && ` (${statusFilter})`}
        </div>
      </div>

      {/* Patients Table */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th onClick={() => handleSort('name')} className={styles.sortable}>
                Patient Info {getSortIcon('name')}
              </th>
              <th>Age/Gender</th>
              <th>Room</th>
              <th>Device</th>
              <th onClick={() => handleSort('heartRate')} className={styles.sortable}>
                Vital Signs {getSortIcon('heartRate')}
              </th>
              <th onClick={() => handleSort('status')} className={styles.sortable}>
                Status {getSortIcon('status')}
              </th>
              <th onClick={() => handleSort('lastUpdate')} className={styles.sortable}>
                Last Update {getSortIcon('lastUpdate')}
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedPatients.map(patient => (
              <tr key={patient.id} className={styles[patient.status]}>
                <td className={styles.patientInfo}>
                  <div className={styles.nameSection}>
                    <div className={styles.avatar}>
                      {patient.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className={styles.name}>{patient.name}</div>
                      <div className={styles.email}>{patient.email}</div>
                      {patient.doctor && patient.doctor !== '--' && (
                        <div className={styles.doctor}>Dr. {patient.doctor}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className={styles.demographics}>
                  <div>{patient.age}</div>
                  <div className={styles.gender}>{patient.gender}</div>
                </td>
                <td className={styles.room}>
                  {patient.room !== '--' ? (
                    <span className={styles.roomBadge}>{patient.room}</span>
                  ) : (
                    '--'
                  )}
                </td>
                <td className={styles.device}>
                  {patient.deviceId !== 'No device' ? (
                    <span className={styles.deviceConnected}>📱 {patient.deviceId}</span>
                  ) : (
                    <span className={styles.deviceDisconnected}>❌ No device</span>
                  )}
                </td>
                <td className={styles.vitals}>
                  <div className={styles.vitalReadings}>
                    <div className={styles.vitalItem}>
                      <span className={styles.vitalLabel}>HR:</span>
                      <span className={styles.vitalValue}>{patient.lastHR} BPM</span>
                    </div>
                    {patient.lastSpO2 !== '--' && (
                      <div className={styles.vitalItem}>
                        <span className={styles.vitalLabel}>SpO₂:</span>
                        <span className={styles.vitalValue}>{patient.lastSpO2}%</span>
                      </div>
                    )}
                    {patient.lastTemp !== '--' && (
                      <div className={styles.vitalItem}>
                        <span className={styles.vitalLabel}>Temp:</span>
                        <span className={styles.vitalValue}>{patient.lastTemp}°C</span>
                      </div>
                    )}
                  </div>
                </td>
                <td>
                  <span className={`${styles.status} ${getStatusColor(patient.status)}`}>
                    <span className={styles.statusIcon}>
                      {getStatusIcon(patient.status)}
                    </span>
                    {patient.status}
                  </span>
                </td>
                <td className={styles.lastUpdate}>
                  {formatLastUpdate(patient.lastUpdate)}
                </td>
                <td>
                  <div className={styles.actionButtons}>
                    <Link 
                      to={`/patients/${patient.id}`} 
                      className={styles.viewButton}
                      title="View Patient Details"
                    >
                      📋 Details
                    </Link>
                    <Link 
                      to={`/monitor?patient=${patient.id}`}
                      className={styles.monitorButton}
                      title="Real-time Monitor"
                    >
                      ❤️ Monitor
                    </Link>
                    {patient.status === 'critical' && (
                      <span className={styles.urgentBadge}>URGENT</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredAndSortedPatients.length === 0 && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>👥</div>
            <h3>
              {searchTerm || statusFilter !== 'all' 
                ? 'No patients found' 
                : 'No patients available'
              }
            </h3>
            <p>
              {searchTerm 
                ? 'No patients match your search criteria' 
                : statusFilter !== 'all'
                ? `No patients with ${statusFilter} status`
                : 'There are no patients registered in the system'
              }
            </p>
            {(searchTerm || statusFilter !== 'all') && (
              <button 
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                }}
                className={styles.clearFiltersButton}
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Quick Actions Footer */}
      <div className={styles.footer}>
        <div className={styles.quickStats}>
          <span><strong>Critical Patients:</strong> {stats.critical} requiring immediate attention</span>
          {stats.critical > 0 && (
            <span className={styles.alertNotice}>🚨 Immediate action needed</span>
          )}
        </div>
        <div className={styles.footerActions}>
          <Link to="/register" className={styles.addPatientButton}>
            + Add New Patient
          </Link>
        </div>
      </div>
    </div>
  );
}