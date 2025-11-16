import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { getPatient, getPatientVitals, getPatients } from '../../services/patientService';
import LineChart from '../../components/Charts/LineChart';
import BarChart from '../../components/Charts/BarChart';
import StatsCard from '../../components/Ui/StatsCard';
import DataTable from '../../components/Ui/DataTable';
import styles from './HistoryAnalytics.module.css';

export default function RealtimeMonitor() {
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get('patient');
  const [patient, setPatient] = useState(null);
  const [patients, setPatients] = useState([]);
  const [vitals, setVitals] = useState([]);
  const [timeRange, setTimeRange] = useState('7d');
  const [dataType, setDataType] = useState('hourly');
  const [selectedPatient, setSelectedPatient] = useState(patientId || 'all');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // 🔥 PERBAIKAN: Pindahkan semua fungsi ke useCallback
  const calculateDataLimit = useCallback(() => {
    switch (timeRange) {
      case '24h': return 96;
      case '7d': return 168;
      case '30d': return 720;
      case '3m': return 2160;
      case '1y': return 8760;
      default: return 168;
    }
  }, [timeRange]);

  const getTimeInterval = useCallback(() => {
    switch (timeRange) {
      case '24h': return 15 * 60 * 1000;
      case '7d': return 60 * 60 * 1000;
      case '30d': return 2 * 60 * 60 * 1000;
      case '3m': return 6 * 60 * 60 * 1000;
      case '1y': return 24 * 60 * 60 * 1000;
      default: return 60 * 60 * 1000;
    }
  }, [timeRange]);

  const determineVitalStatus = useCallback((vital) => {
    const hr = vital.hr;
    const spo2 = vital.spo2;
    const temp = vital.temp;
    
    if (hr > 120 || hr < 50 || (spo2 && spo2 < 90) || (temp && temp > 38.5)) {
      return 'critical';
    }
    if (hr > 100 || hr < 60 || (spo2 && spo2 < 95) || (temp && temp > 37.5)) {
      return 'warning';
    }
    return 'normal';
  }, []);

  const generateMockVitals = useCallback(() => {
    const vitals = [];
    const now = new Date();
    let dataPoints = 100;

    switch (timeRange) {
      case '24h': dataPoints = 96; break;
      case '7d': dataPoints = 168; break;
      case '30d': dataPoints = 720; break;
      case '3m': dataPoints = 2160; break;
      case '1y': dataPoints = 8760; break;
      default: dataPoints = 168;
    }

    for (let i = dataPoints - 1; i >= 0; i--) {
      const timestamp = new Date(now - i * getTimeInterval());
      const baseHR = 75 + Math.sin(i * 0.1) * 15 + Math.random() * 5;
      const baseSpO2 = 97 - Math.abs(Math.sin(i * 0.05)) * 2 + Math.random();
      const baseTemp = 36.8 + Math.sin(i * 0.02) * 0.3 + Math.random() * 0.1;
      
      vitals.push({
        id: `vital_${i}`,
        timestamp,
        hr: Math.round(baseHR),
        spo2: Math.round(baseSpO2),
        temp: Number(baseTemp.toFixed(1)),
        patientId: selectedPatient !== 'all' ? selectedPatient : `patient_${Math.floor(Math.random() * 5) + 1}`,
        patientName: selectedPatient !== 'all' ? patient?.name : `Patient ${Math.floor(Math.random() * 5) + 1}`,
        status: determineVitalStatus({ hr: baseHR, spo2: baseSpO2, temp: baseTemp })
      });
    }
    
    return vitals.reverse();
  }, [timeRange, getTimeInterval, determineVitalStatus, selectedPatient, patient]);

  const loadVitalsData = useCallback(async () => {
    const limit = calculateDataLimit();
    
    if (selectedPatient && selectedPatient !== 'all') {
      return await getPatientVitals(selectedPatient, limit);
    } else {
      return generateMockVitals();
    }
  }, [calculateDataLimit, selectedPatient, generateMockVitals]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Load patients list for dropdown
      const patientsData = await getPatients();
      setPatients(patientsData);

      // Load patient data if specific patient selected
      if (selectedPatient && selectedPatient !== 'all') {
        const patientData = await getPatient(selectedPatient);
        setPatient(patientData);
      } else {
        setPatient(null);
      }

      // Load vitals data based on filters
      const vitalsData = await loadVitalsData();
      setVitals(vitalsData);

    } catch (error) {
      console.error('Error loading analytics data:', error);
      // Fallback to mock data
      setVitals(generateMockVitals());
    } finally {
      setLoading(false);
    }
  }, [selectedPatient, loadVitalsData, generateMockVitals]);

  // 🔥 PERBAIKAN: useEffect dengan dependency yang benar
  useEffect(() => {
    loadData();
  }, [loadData]);

  // 🔥 PERBAIKAN: aggregateData dengan case blocks yang benar
  const aggregateData = useCallback((data, interval) => {
    const aggregated = {};
    
    data.forEach(vital => {
      const date = new Date(vital.timestamp);
      let key;
      
      switch (interval) {
        case 'hour':
          key = date.toISOString().slice(0, 13);
          break;
        case 'day':
          key = date.toISOString().slice(0, 10);
          break;
        case 'week': {
          // 🔥 PERBAIKAN: Gunakan block scope untuk case dengan deklarasi
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().slice(0, 10);
          break;
        }
        case 'month':
          key = date.toISOString().slice(0, 7);
          break;
        default:
          key = date.toISOString();
      }
      
      if (!aggregated[key]) {
        aggregated[key] = {
          timestamp: key,
          hr: [],
          spo2: [],
          temp: [],
          criticalCount: 0,
          totalReadings: 0
        };
      }
      
      aggregated[key].hr.push(vital.hr);
      aggregated[key].spo2.push(vital.spo2);
      aggregated[key].temp.push(vital.temp);
      aggregated[key].totalReadings++;
      
      if (vital.status === 'critical') {
        aggregated[key].criticalCount++;
      }
    });
    
    // Calculate averages
    return Object.values(aggregated).map(intervalData => ({
      ...intervalData,
      avgHR: Math.round(intervalData.hr.reduce((a, b) => a + b, 0) / intervalData.hr.length),
      avgSpO2: Math.round(intervalData.spo2.reduce((a, b) => a + b, 0) / intervalData.spo2.length),
      avgTemp: Number((intervalData.temp.reduce((a, b) => a + b, 0) / intervalData.temp.length).toFixed(1)),
      criticalRate: (intervalData.criticalCount / intervalData.totalReadings) * 100
    }));
  }, []);

  // Process data for different aggregation levels
  const processedData = useMemo(() => {
    if (vitals.length === 0) return { hourly: [], daily: [], weekly: [], monthly: [] };

    const aggregatedData = {
      hourly: aggregateData(vitals, 'hour'),
      daily: aggregateData(vitals, 'day'),
      weekly: aggregateData(vitals, 'week'),
      monthly: aggregateData(vitals, 'month')
    };

    return aggregatedData;
  }, [vitals, aggregateData]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (vitals.length === 0) return {};
    
    const hrValues = vitals.map(v => v.hr).filter(hr => hr > 0);
    const spo2Values = vitals.map(v => v.spo2).filter(spo2 => spo2 > 0);
    const tempValues = vitals.map(v => v.temp).filter(temp => temp > 0);
    
    const criticalEvents = vitals.filter(v => v.status === 'critical').length;
    const warningEvents = vitals.filter(v => v.status === 'warning').length;
    
    return {
      totalReadings: vitals.length,
      avgHR: Math.round(hrValues.reduce((a, b) => a + b, 0) / hrValues.length),
      avgSpO2: Math.round(spo2Values.reduce((a, b) => a + b, 0) / spo2Values.length),
      avgTemp: Number((tempValues.reduce((a, b) => a + b, 0) / tempValues.length).toFixed(1)),
      criticalEvents,
      warningEvents,
      dataCoverage: Math.round((vitals.length / calculateDataLimit()) * 100),
      uniquePatients: [...new Set(vitals.map(v => v.patientId))].length
    };
  }, [vitals, calculateDataLimit]);

  // Prepare chart data
  const chartData = useMemo(() => {
    const data = processedData[dataType] || [];
    
    const formatTimeLabel = (timestamp, type) => {
      const date = new Date(timestamp);
      
      switch (type) {
        case 'hourly':
          return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        case 'daily':
          return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        case 'weekly':
          return `Week of ${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}`;
        case 'monthly':
          return date.toLocaleDateString([], { month: 'long', year: 'numeric' });
        default:
          return timestamp;
      }
    };
    
    return {
      hr: data.map(d => ({ time: formatTimeLabel(d.timestamp, dataType), value: d.avgHR })),
      spo2: data.map(d => ({ time: formatTimeLabel(d.timestamp, dataType), value: d.avgSpO2 })),
      temp: data.map(d => ({ time: formatTimeLabel(d.timestamp, dataType), value: d.avgTemp })),
      critical: data.map(d => ({ time: formatTimeLabel(d.timestamp, dataType), value: d.criticalRate }))
    };
  }, [processedData, dataType]);

  // Export functions
  const exportToCSV = useCallback(() => {
    setExporting(true);
    
    try {
      const headers = ['Timestamp', 'Heart Rate (BPM)', 'SpO2 (%)', 'Temperature (°C)', 'Status', 'Patient'];
      const csvContent = [
        headers.join(','),
        ...vitals.map(v => [
          v.timestamp.toISOString(),
          v.hr,
          v.spo2,
          v.temp,
          v.status,
          v.patientName
        ].join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `vital_data_${timeRange}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting CSV:', error);
    } finally {
      setExporting(false);
    }
  }, [vitals, timeRange]);

  const exportToPDF = useCallback(() => {
    setExporting(true);
    setTimeout(() => {
      alert('PDF export functionality would be implemented with a library like jsPDF');
      setExporting(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className={styles.analytics}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading analytics data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.analytics}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.breadcrumb}>
          <Link to="/patients" className={styles.backLink}>← Back to Patients</Link>
        </div>
        <div className={styles.headerContent}>
          <div className={styles.titleSection}>
            <h1>History & Analytics</h1>
            <p>Comprehensive analysis of patient vital signs over time</p>
          </div>
          <div className={styles.exportButtons}>
            <button 
              onClick={exportToCSV}
              disabled={exporting}
              className={styles.exportButton}
            >
              {exporting ? '📥 Exporting...' : '📊 Export CSV'}
            </button>
            <button 
              onClick={exportToPDF}
              disabled={exporting}
              className={styles.exportButton}
            >
              {exporting ? '📥 Exporting...' : '📄 Export PDF'}
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label>Patient:</label>
          <select 
            value={selectedPatient}
            onChange={(e) => setSelectedPatient(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">All Patients</option>
            {patients.map(p => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label>Time Range:</label>
          <select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="3m">Last 3 Months</option>
            <option value="1y">Last 1 Year</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label>Data Aggregation:</label>
          <select 
            value={dataType}
            onChange={(e) => setDataType(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="hourly">Hourly</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className={styles.statsGrid}>
        <StatsCard 
          title="Total Readings" 
          value={stats.totalReadings?.toLocaleString() || '0'} 
          icon="📊" 
          color="blue"
          subtitle={`${stats.dataCoverage || 0}% coverage`}
        />
        <StatsCard 
          title="Avg Heart Rate" 
          value={`${stats.avgHR || '--'} BPM`} 
          icon="❤️" 
          color="red"
          subtitle="Average"
        />
        <StatsCard 
          title="Avg SpO₂" 
          value={`${stats.avgSpO2 || '--'}%`} 
          icon="🫁" 
          color="green"
          subtitle="Oxygen Saturation"
        />
        <StatsCard 
          title="Critical Events" 
          value={stats.criticalEvents || '0'} 
          icon="⚠️" 
          color="orange"
          subtitle="Requiring attention"
        />
        <StatsCard 
          title="Patients Monitored" 
          value={stats.uniquePatients || '1'} 
          icon="👥" 
          color="purple"
          subtitle="Unique patients"
        />
        <StatsCard 
          title="Data Period" 
          value={
            timeRange === '24h' ? '24H' :
            timeRange === '7d' ? '7D' :
            timeRange === '30d' ? '30D' :
            timeRange === '3m' ? '3M' : '1Y'
          } 
          icon="⏱️" 
          color="gray"
          subtitle="Time range"
        />
      </div>

      {/* Charts Section */}
      <div className={styles.chartsSection}>
        <div className={styles.chartRow}>
          <div className={styles.chartCard}>
            <h3>Heart Rate Trend</h3>
            <div className={styles.chartContainer}>
              <LineChart 
                data={chartData.hr}
                color="#ef4444"
                height={300}
                yAxisLabel="BPM"
              />
            </div>
            <div className={styles.chartStats}>
              <span>Avg: {stats.avgHR} BPM</span>
              <span>Range: 60-100 BPM</span>
            </div>
          </div>

          <div className={styles.chartCard}>
            <h3>Oxygen Saturation Trend</h3>
            <div className={styles.chartContainer}>
              <LineChart 
                data={chartData.spo2}
                color="#3b82f6"
                height={300}
                yAxisLabel="%"
              />
            </div>
            <div className={styles.chartStats}>
              <span>Avg: {stats.avgSpO2}%</span>
              <span>Target: ≥95%</span>
            </div>
          </div>
        </div>

        <div className={styles.chartRow}>
          <div className={styles.chartCard}>
            <h3>Temperature Trend</h3>
            <div className={styles.chartContainer}>
              <LineChart 
                data={chartData.temp}
                color="#f59e0b"
                height={300}
                yAxisLabel="°C"
              />
            </div>
            <div className={styles.chartStats}>
              <span>Avg: {stats.avgTemp}°C</span>
              <span>Normal: 36.5-37.5°C</span>
            </div>
          </div>

          <div className={styles.chartCard}>
            <h3>Critical Events Distribution</h3>
            <div className={styles.chartContainer}>
              <BarChart 
                data={chartData.critical}
                color="#dc2626"
                height={300}
                yAxisLabel="%"
              />
            </div>
            <div className={styles.chartStats}>
              <span>Total: {stats.criticalEvents} events</span>
              <span>Rate: {((stats.criticalEvents / stats.totalReadings) * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className={styles.dataSection}>
        <div className={styles.sectionHeader}>
          <h3>Detailed Data</h3>
          <span className={styles.dataCount}>
            Showing {Math.min(vitals.length, 100)} of {vitals.length} records
          </span>
        </div>
        
        <DataTable 
          data={vitals.slice(0, 100)}
          columns={[
            { key: 'timestamp', label: 'Time', render: (value) => new Date(value).toLocaleString() },
            { key: 'patientName', label: 'Patient' },
            { key: 'hr', label: 'Heart Rate', render: (value) => `${value} BPM` },
            { key: 'spo2', label: 'SpO₂', render: (value) => `${value}%` },
            { key: 'temp', label: 'Temperature', render: (value) => `${value}°C` },
            { 
              key: 'status', 
              label: 'Status', 
              render: (value) => (
                <span className={`${styles.statusBadge} ${styles[value]}`}>
                  {value}
                </span>
              )
            }
          ]}
        />
      </div>

      {/* Summary */}
      <div className={styles.summary}>
        <h3>Analytics Summary</h3>
        <div className={styles.summaryGrid}>
          <div className={styles.summaryItem}>
            <strong>Data Quality:</strong>
            <span>{stats.dataCoverage >= 80 ? 'Excellent' : stats.dataCoverage >= 60 ? 'Good' : 'Fair'}</span>
          </div>
          <div className={styles.summaryItem}>
            <strong>Monitoring Consistency:</strong>
            <span>{stats.criticalEvents === 0 ? 'Stable' : 'Requires Attention'}</span>
          </div>
          <div className={styles.summaryItem}>
            <strong>Trend Analysis:</strong>
            <span>{
              stats.avgHR > 100 || stats.avgHR < 60 ? 'Abnormal' :
              stats.avgSpO2 < 95 ? 'Concerning' : 'Normal'
            }</span>
          </div>
          <div className={styles.summaryItem}>
            <strong>Recommendation:</strong>
            <span>{
              stats.criticalEvents > 10 ? 'Immediate review required' :
              stats.criticalEvents > 5 ? 'Close monitoring recommended' :
              'Continue routine monitoring'
            }</span>
          </div>
        </div>
      </div>
    </div>
  );
}