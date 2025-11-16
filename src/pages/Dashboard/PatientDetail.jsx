import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPatient, getMonitoringHistory, getPatientVitals } from '../../services/patientService';
import StatsCard from '../../components/Ui/StatsCard';
import LineChart from '../../components/Charts/LineChart';
import ECGChart from '../../components/Charts/ECGChart';
import VitalTrendChart from '../../components/Charts/VitalTrendChart';
import StatusIndicator from '../../components/Ui/StatusIndicator';
import styles from './PatientDetail.module.css';

export default function PatientDetail() {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [vitals, setVitals] = useState([]);
  const [ecgData, setEcgData] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('24h'); // 24h, 7d, 30d
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPatientData();
  }, [id, timeRange]);

  const loadPatientData = async () => {
    try {
      setLoading(true);
      setError('');

      // Get patient data
      const patientData = await getPatient(id);
      if (!patientData) {
        throw new Error('Patient not found');
      }

      // Get vital history based on time range
      const limit = timeRange === '24h' ? 96 : timeRange === '7d' ? 168 : 720; // 4 readings/hour
      const vitalsHistory = await getPatientVitals(id, limit);
      
      // Get ECG data (last 100 readings)
      const ecgHistory = await getMonitoringHistory({ 
        uid: id, 
        limit: 100,
        type: 'ecg'
      });

      // Process patient data
      const latestVital = vitalsHistory[0] || {};
      const processedPatient = {
        ...patientData,
        lastHR: latestVital.hr || '--',
        lastSpO2: latestVital.spo2 || '--',
        lastTemp: latestVital.temp || '--',
        lastUpdate: latestVital.timestamp || new Date(),
        status: determinePatientStatus(latestVital)
      };

      // Process vitals data for charts
      const processedVitals = vitalsHistory.map(vital => ({
        timestamp: new Date(vital.timestamp),
        hr: vital.hr || 0,
        spo2: vital.spo2 || 0,
        temp: vital.temp || 0,
        status: determineVitalStatus(vital)
      }));

      // Process ECG data
      const processedEcgData = ecgHistory.map(record => ({
        time: record.timestamp ? new Date(record.timestamp).toLocaleTimeString() : '',
        value: record.ecgValue || Math.random() * 100 + 50, // Mock ECG values
        timestamp: record.timestamp
      }));

      setPatient(processedPatient);
      setVitals(processedVitals);
      setEcgData(processedEcgData);

    } catch (error) {
      console.error('Error loading patient data:', error);
      setError(error.message);
      // Fallback to mock data for demo
      loadMockData();
    } finally {
      setLoading(false);
    }
  };

  const loadMockData = () => {
    const mockPatient = {
      id: id,
      name: 'John Doe',
      email: 'john@example.com',
      age: 65,
      gender: 'Male',
      deviceId: 'ESP32-A1B2C3',
      status: 'critical',
      lastHR: 95,
      lastSpO2: 96,
      lastTemp: 37.2,
      lastUpdate: new Date(),
      address: '123 Main Street, Jakarta',
      phone: '+62 812-3456-7890',
      emergencyContact: 'Jane Doe (+62 813-9876-5432)',
      medicalNotes: 'Patient has history of hypertension and type 2 diabetes. Monitor BP and blood glucose regularly. Recent ECG shows occasional PVCs.',
      doctor: 'Dr. Smith',
      room: '301-A',
      admissionDate: '2024-01-10',
      conditions: ['Hypertension', 'Type 2 Diabetes', 'High Cholesterol']
    };

    // Generate mock vitals data
    const mockVitals = generateMockVitals(96);
    const mockEcgData = generateMockEcgData(100);

    setPatient(mockPatient);
    setVitals(mockVitals);
    setEcgData(mockEcgData);
  };

  const generateMockVitals = (count) => {
    const vitals = [];
    const now = new Date();
    
    for (let i = count - 1; i >= 0; i--) {
      const timestamp = new Date(now - i * 15 * 60 * 1000); // 15-minute intervals
      const baseHR = 75 + Math.sin(i * 0.1) * 15 + Math.random() * 5;
      const baseSpO2 = 97 - Math.abs(Math.sin(i * 0.05)) * 2 + Math.random();
      const baseTemp = 36.8 + Math.sin(i * 0.02) * 0.3 + Math.random() * 0.1;
      
      vitals.push({
        timestamp,
        hr: Math.round(baseHR),
        spo2: Math.round(baseSpO2),
        temp: Number(baseTemp.toFixed(1)),
        status: determineVitalStatus({ hr: baseHR, spo2: baseSpO2, temp: baseTemp })
      });
    }
    
    return vitals.reverse();
  };

  const generateMockEcgData = (count) => {
    return Array.from({ length: count }, (_, i) => ({
      time: `${i * 0.1}s`,
      value: 60 + 20 * Math.sin(i * 0.5) + 5 * Math.sin(i * 2) + Math.random() * 3,
      timestamp: new Date(Date.now() - (count - i) * 100)
    }));
  };

  const determinePatientStatus = (vital) => {
    if (!vital || !vital.hr) return 'unknown';
    
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
  };

  const determineVitalStatus = (vital) => {
    return determinePatientStatus(vital);
  };

  // Calculate statistics
  const stats = useMemo(() => {
    if (vitals.length === 0) return {};
    
    const hrValues = vitals.map(v => v.hr).filter(hr => hr > 0);
    const spo2Values = vitals.map(v => v.spo2).filter(spo2 => spo2 > 0);
    const tempValues = vitals.map(v => v.temp).filter(temp => temp > 0);
    
    return {
      avgHR: Math.round(hrValues.reduce((a, b) => a + b, 0) / hrValues.length),
      minHR: Math.min(...hrValues),
      maxHR: Math.max(...hrValues),
      avgSpO2: Math.round(spo2Values.reduce((a, b) => a + b, 0) / spo2Values.length),
      minSpO2: Math.min(...spo2Values),
      avgTemp: Number((tempValues.reduce((a, b) => a + b, 0) / tempValues.length).toFixed(1)),
      criticalEvents: vitals.filter(v => v.status === 'critical').length,
      totalReadings: vitals.length
    };
  }, [vitals]);

  // Prepare chart data
  const hrChartData = useMemo(() => 
    vitals.map(v => ({
      time: v.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      value: v.hr,
      timestamp: v.timestamp
    })), [vitals]);

  const spo2ChartData = useMemo(() => 
    vitals.map(v => ({
      time: v.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      value: v.spo2,
      timestamp: v.timestamp
    })), [vitals]);

  const tempChartData = useMemo(() => 
    vitals.map(v => ({
      time: v.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      value: v.temp,
      timestamp: v.timestamp
    })), [vitals]);

  const formatLastUpdate = (timestamp) => {
    if (!timestamp) return 'No data';
    const now = new Date();
    const diff = (now - new Date(timestamp)) / 1000;
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return new Date(timestamp).toLocaleString();
  };

  const exportData = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Time,Heart Rate (BPM),SpO2 (%),Temperature (°C),Status\n"
      + vitals.map(v => 
          `${v.timestamp.toLocaleString()},${v.hr},${v.spo2},${v.temp},${v.status}`
        ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `patient_${patient?.name}_vitals.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className={styles.patientDetail}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading patient data...</p>
        </div>
      </div>
    );
  }

  if (error && !patient) {
    return (
      <div className={styles.patientDetail}>
        <div className={styles.notFound}>
          <h2>Patient Not Found</h2>
          <p>{error}</p>
          <Link to="/patients" className={styles.backButton}>
            ← Back to Patients
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.patientDetail}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.breadcrumb}>
          <Link to="/patients" className={styles.backLink}>← Back to Patients</Link>
        </div>
        <div className={styles.headerContent}>
          <div className={styles.patientHeader}>
            <div className={styles.avatar}>
              {patient.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className={styles.patientInfo}>
              <h1>{patient.name}</h1>
              <div className={styles.meta}>
                <span>Age: {patient.age}</span>
                <span>•</span>
                <span>{patient.gender}</span>
                <span>•</span>
                <span>Room: {patient.room}</span>
                <span>•</span>
                <StatusIndicator status={patient.status} />
              </div>
              {patient.doctor && (
                <div className={styles.doctorInfo}>
                  Attending Physician: <strong>{patient.doctor}</strong>
                </div>
              )}
            </div>
          </div>
          <div className={styles.headerActions}>
            <Link 
              to={`/monitor?patient=${patient.id}`}
              className={styles.monitorButton}
            >
              📊 Real-time Monitor
            </Link>
            <button className={styles.messageButton}>
              💬 Send Message
            </button>
          </div>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className={styles.timeRangeSelector}>
        <label>Time Range:</label>
        <select 
          value={timeRange} 
          onChange={(e) => setTimeRange(e.target.value)}
          className={styles.timeSelect}
        >
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
        </select>
      </div>

      {/* Navigation Tabs */}
      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'overview' ? styles.active : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📈 Overview
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'ecg' ? styles.active : ''}`}
          onClick={() => setActiveTab('ecg')}
        >
          ❤️ ECG Analysis
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'trends' ? styles.active : ''}`}
          onClick={() => setActiveTab('trends')}
        >
          📊 Vital Trends
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'medical' ? styles.active : ''}`}
          onClick={() => setActiveTab('medical')}
        >
          🏥 Medical Info
        </button>
      </div>

      {/* Tab Content */}
      <div className={styles.tabContent}>
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className={styles.overview}>
            {/* Current Vitals Stats */}
            <div className={styles.statsGrid}>
              <StatsCard 
                title="Current Heart Rate" 
                value={`${patient.lastHR} BPM`} 
                icon="❤️" 
                color="red"
                status={patient.status}
                subtitle={`Range: ${stats.minHR || '--'} - ${stats.maxHR || '--'} BPM`}
              />
              <StatsCard 
                title="Oxygen Saturation" 
                value={`${patient.lastSpO2}%`} 
                icon="🫁" 
                color="blue"
                status={patient.status}
                subtitle="SpO₂ Level"
              />
              <StatsCard 
                title="Body Temperature" 
                value={`${patient.lastTemp}°C`} 
                icon="🌡️" 
                color="orange"
                status={patient.status}
                subtitle="Body Temp"
              />
              <StatsCard 
                title="Device Status" 
                value={patient.deviceId ? "Connected" : "Disconnected"} 
                icon="📱" 
                color={patient.deviceId ? "green" : "gray"}
                subtitle={patient.deviceId || "No device"}
              />
            </div>

            {/* Quick Charts Row */}
            <div className={styles.chartsRow}>
              <div className={styles.chartCard}>
                <h3>Heart Rate Trend</h3>
                <div className={styles.chartContainer}>
                  <LineChart 
                    data={hrChartData.slice(-24)} // Last 24 readings
                    color="#ef4444"
                    height={200}
                    yAxisLabel="BPM"
                  />
                </div>
              </div>
              
              <div className={styles.chartCard}>
                <h3>SpO₂ Trend</h3>
                <div className={styles.chartContainer}>
                  <LineChart 
                    data={spo2ChartData.slice(-24)}
                    color="#3b82f6"
                    height={200}
                    yAxisLabel="%"
                  />
                </div>
              </div>
            </div>

            {/* Patient Information */}
            <div className={styles.infoGrid}>
              <div className={styles.infoCard}>
                <h3>Patient Information</h3>
                <div className={styles.infoList}>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Age</span>
                    <span className={styles.infoValue}>{patient.age} years</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Gender</span>
                    <span className={styles.infoValue}>{patient.gender}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Room</span>
                    <span className={styles.infoValue}>{patient.room}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Admission Date</span>
                    <span className={styles.infoValue}>
                      {new Date(patient.admissionDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className={styles.infoCard}>
                <h3>Contact Information</h3>
                <div className={styles.infoList}>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Phone</span>
                    <span className={styles.infoValue}>{patient.phone}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Emergency Contact</span>
                    <span className={styles.infoValue}>{patient.emergencyContact}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Address</span>
                    <span className={styles.infoValue}>{patient.address}</span>
                  </div>
                </div>
              </div>

              <div className={styles.infoCard}>
                <h3>Medical Summary</h3>
                <div className={styles.summaryStats}>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Avg Heart Rate</span>
                    <span className={styles.summaryValue}>{stats.avgHR || '--'} BPM</span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Avg SpO₂</span>
                    <span className={styles.summaryValue}>{stats.avgSpO2 || '--'}%</span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Critical Events</span>
                    <span className={styles.summaryValue}>{stats.criticalEvents || 0}</span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Last Update</span>
                    <span className={styles.summaryValue}>
                      {formatLastUpdate(patient.lastUpdate)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ECG Analysis Tab */}
        {activeTab === 'ecg' && (
          <div className={styles.ecgAnalysis}>
            <div className={styles.ecgHeader}>
              <h3>ECG Waveform Analysis</h3>
              <div className={styles.ecgControls}>
                <button className={styles.exportButton} onClick={exportData}>
                  📥 Export ECG Data
                </button>
              </div>
            </div>

            <div className={styles.ecgChartCard}>
              <ECGChart data={ecgData} height={300} />
            </div>

            <div className={styles.ecgMetrics}>
              <div className={styles.metricCard}>
                <h4>Heart Rate Variability</h4>
                <div className={styles.metricValue}>42 ms</div>
                <div className={styles.metricStatus}>Normal</div>
              </div>
              <div className={styles.metricCard}>
                <h4>QT Interval</h4>
                <div className={styles.metricValue}>380 ms</div>
                <div className={styles.metricStatus}>Normal</div>
              </div>
              <div className={styles.metricCard}>
                <h4>ST Segment</h4>
                <div className={styles.metricValue}>Isoelectric</div>
                <div className={styles.metricStatus}>Normal</div>
              </div>
              <div className={styles.metricCard}>
                <h4>Arrhythmia Detection</h4>
                <div className={styles.metricValue}>Occasional PVCs</div>
                <div className={styles.metricStatus}>Monitor</div>
              </div>
            </div>

            <div className={styles.ecgNotes}>
              <h4>ECG Interpretation</h4>
              <div className={styles.notesContent}>
                <p>Normal sinus rhythm with occasional premature ventricular contractions (PVCs). 
                No significant ST segment changes observed. QT interval within normal limits.</p>
                <p><strong>Recommendation:</strong> Continue monitoring for PVC frequency. 
                Consider 24-hour Holter monitoring if PVC frequency increases.</p>
              </div>
            </div>
          </div>
        )}

        {/* Vital Trends Tab */}
        {activeTab === 'trends' && (
          <div className={styles.trendsAnalysis}>
            <div className={styles.trendsHeader}>
              <h3>Vital Signs Trend Analysis</h3>
              <button className={styles.exportButton} onClick={exportData}>
                📥 Export All Data
              </button>
            </div>

            <div className={styles.trendsGrid}>
              <div className={styles.trendCard}>
                <h4>Heart Rate Trend</h4>
                <VitalTrendChart 
                  data={hrChartData}
                  color="#ef4444"
                  height={250}
                  range={[50, 120]}
                  unit="BPM"
                />
                <div className={styles.trendStats}>
                  <span>Avg: {stats.avgHR} BPM</span>
                  <span>Min: {stats.minHR} BPM</span>
                  <span>Max: {stats.maxHR} BPM</span>
                </div>
              </div>

              <div className={styles.trendCard}>
                <h4>Oxygen Saturation Trend</h4>
                <VitalTrendChart 
                  data={spo2ChartData}
                  color="#3b82f6"
                  height={250}
                  range={[90, 100]}
                  unit="%"
                />
                <div className={styles.trendStats}>
                  <span>Avg: {stats.avgSpO2}%</span>
                  <span>Min: {stats.minSpO2}%</span>
                </div>
              </div>

              <div className={styles.trendCard}>
                <h4>Temperature Trend</h4>
                <VitalTrendChart 
                  data={tempChartData}
                  color="#f59e0b"
                  height={250}
                  range={[36, 39]}
                  unit="°C"
                />
                <div className={styles.trendStats}>
                  <span>Avg: {stats.avgTemp}°C</span>
                </div>
              </div>
            </div>

            {/* Statistical Summary */}
            <div className={styles.statisticalSummary}>
              <h4>Statistical Summary</h4>
              <div className={styles.statsTable}>
                <div className={styles.statRow}>
                  <span className={styles.statLabel}>Total Readings Analyzed</span>
                  <span className={styles.statValue}>{stats.totalReadings}</span>
                </div>
                <div className={styles.statRow}>
                  <span className={styles.statLabel}>Critical Events</span>
                  <span className={styles.statValue}>{stats.criticalEvents}</span>
                </div>
                <div className={styles.statRow}>
                  <span className={styles.statLabel}>Data Coverage</span>
                  <span className={styles.statValue}>
                    {Math.round((stats.totalReadings / (timeRange === '24h' ? 96 : timeRange === '7d' ? 168 : 720)) * 100)}%
                  </span>
                </div>
                <div className={styles.statRow}>
                  <span className={styles.statLabel}>Monitoring Period</span>
                  <span className={styles.statValue}>
                    {timeRange === '24h' ? '24 Hours' : timeRange === '7d' ? '7 Days' : '30 Days'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Medical Info Tab */}
        {activeTab === 'medical' && (
          <div className={styles.medicalInfo}>
            <div className={styles.medicalGrid}>
              <div className={styles.medicalCard}>
                <h3>Medical Notes</h3>
                <div className={styles.notes}>
                  {patient.medicalNotes}
                </div>
              </div>

              <div className={styles.medicalCard}>
                <h3>Current Conditions</h3>
                <div className={styles.conditionsList}>
                  {patient.conditions?.map((condition, index) => (
                    <div key={index} className={styles.conditionItem}>
                      <span className={styles.conditionName}>{condition}</span>
                      <span className={styles.conditionStatus}>Active</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.medicalCard}>
                <h3>Medications</h3>
                <div className={styles.medicationList}>
                  <div className={styles.medicationItem}>
                    <span className={styles.medName}>Lisinopril 10mg</span>
                    <span className={styles.medDosage}>Once daily</span>
                    <span className={styles.medPurpose}>Hypertension</span>
                  </div>
                  <div className={styles.medicationItem}>
                    <span className={styles.medName}>Metformin 500mg</span>
                    <span className={styles.medDosage}>Twice daily</span>
                    <span className={styles.medPurpose}>Diabetes</span>
                  </div>
                  <div className={styles.medicationItem}>
                    <span className={styles.medName}>Atorvastatin 20mg</span>
                    <span className={styles.medDosage}>Once daily</span>
                    <span className={styles.medPurpose}>Cholesterol</span>
                  </div>
                  <div className={styles.medicationItem}>
                    <span className={styles.medName}>Aspirin 81mg</span>
                    <span className={styles.medDosage}>Once daily</span>
                    <span className={styles.medPurpose}>Blood thinner</span>
                  </div>
                </div>
              </div>

              <div className={styles.medicalCard}>
                <h3>Allergies</h3>
                <div className={styles.allergies}>
                  <span className={styles.allergyTag}>Penicillin</span>
                  <span className={styles.allergyTag}>Sulfa drugs</span>
                  <span className={styles.allergyTag}>Shellfish</span>
                </div>
              </div>

              <div className={styles.medicalCard}>
                <h3>Medical History</h3>
                <ul className={styles.historyList}>
                  <li>Hypertension (diagnosed 2018)</li>
                  <li>Type 2 Diabetes (diagnosed 2020)</li>
                  <li>High Cholesterol (diagnosed 2019)</li>
                  <li>Mild COPD</li>
                </ul>
              </div>

              <div className={styles.medicalCard}>
                <h3>Recent Lab Results</h3>
                <div className={styles.labResults}>
                  <div className={styles.labItem}>
                    <span className={styles.labTest}>HbA1c</span>
                    <span className={styles.labValue}>6.8%</span>
                    <span className={styles.labStatus}>Controlled</span>
                  </div>
                  <div className={styles.labItem}>
                    <span className={styles.labTest}>LDL Cholesterol</span>
                    <span className={styles.labValue}>98 mg/dL</span>
                    <span className={styles.labStatus}>Good</span>
                  </div>
                  <div className={styles.labItem}>
                    <span className={styles.labTest}>Blood Pressure</span>
                    <span className={styles.labValue}>132/84 mmHg</span>
                    <span className={styles.labStatus}>Controlled</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}