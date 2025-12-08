// frontend/src/components/RealTimeMonitor.js
import React, { useEffect, useState, useCallback } from 'react';
import webSocketService from '../services/websocket-service';
import { useAuth } from '../hooks/useAuth';

const RealTimeMonitor = () => {
  const { token } = useAuth(); // Hanya ambil token, tidak perlu user
  const [connected, setConnected] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [vitalUpdates, setVitalUpdates] = useState([]);
  const [onlineDoctors, setOnlineDoctors] = useState([]);
  const [currentPatientId, setCurrentPatientId] = useState(
    localStorage.getItem('current_patient_id') || null
  );

  // Fungsi untuk mengupdate vitals pasien
  const updatePatientVitals = useCallback((data) => {
    // Implementasi sesuai kebutuhan aplikasi Anda
    // Contoh: update state atau kirim ke parent component
    console.log('Updating patient vitals:', data);
    // Anda bisa menambahkan logika sesuai kebutuhan
  }, []);

  useEffect(() => {
    if (!token) return;

    // Connect WebSocket
    webSocketService.connect(token);

    // Setup event handlers
    webSocketService.on('connected', () => {
      console.log('WebSocket connected');
      setConnected(true);
    });

    webSocketService.on('disconnected', () => {
      console.log('WebSocket disconnected');
      setConnected(false);
    });

    webSocketService.on('critical_alert', (data) => {
      console.log('🚨 Critical alert received:', data);
      setAlerts(prev => [data, ...prev.slice(0, 9)]);
      
      // Show browser notification
      if (Notification.permission === 'granted') {
        new Notification('🚨 Critical Alert', {
          body: `Patient ${data.patient_id} needs immediate attention`,
          icon: '/notification-icon.png'
        });
      }
    });

    webSocketService.on('vital_reading', (data) => {
      console.log('📊 Vital update received:', data);
      setVitalUpdates(prev => [data, ...prev.slice(0, 19)]);
      
      // Update specific patient if in view
      if (data.patient_id === currentPatientId) {
        updatePatientVitals(data);
      }
    });

    webSocketService.on('patient_status_change', (data) => {
      console.log('🔄 Patient status changed:', data);
      // Update UI accordingly - bisa ditambahkan state jika perlu
    });

    webSocketService.on('doctor_status', (data) => {
      if (data.status === 'online') {
        setOnlineDoctors(prev => [...prev.filter(d => d.id !== data.doctor_id), {
          id: data.doctor_id,
          name: data.doctor_name,
          status: 'online'
        }]);
      } else {
        setOnlineDoctors(prev => prev.filter(d => d.id !== data.doctor_id));
      }
    });

    webSocketService.on('system_notification', (data) => {
      console.log('📢 System notification:', data.message);
      // Show toast notification - bisa ditambahkan state untuk toast
    });

    // Cleanup on unmount
    return () => {
      webSocketService.disconnect();
      webSocketService.off('connected');
      webSocketService.off('disconnected');
      webSocketService.off('critical_alert');
      webSocketService.off('vital_reading');
      webSocketService.off('patient_status_change');
      webSocketService.off('doctor_status');
      webSocketService.off('system_notification');
    };
  }, [token, currentPatientId, updatePatientVitals]);

  const handleAcknowledgeAlert = (alertId, patientId) => {
    webSocketService.acknowledgeAlert(alertId, patientId);
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const subscribeToPatient = (patientId) => {
    webSocketService.subscribeToPatient(patientId);
    localStorage.setItem('current_patient_id', patientId);
    setCurrentPatientId(patientId);
  };

  // Contoh penggunaan subscribeToPatient - bisa dipanggil dari tombol atau event
  const handleSubscribeClick = () => {
    // Contoh: subscribe ke pasien dengan ID tertentu
    // Ini hanya contoh, sesuaikan dengan kebutuhan UI Anda
    const patientId = prompt('Enter patient ID to subscribe:');
    if (patientId) {
      subscribeToPatient(patientId);
    }
  };

  return (
    <div className="real-time-monitor">
      <div className="connection-status">
        Status: {connected ? '🟢 Connected' : '🔴 Disconnected'}
      </div>
      
      <div className="alerts-panel">
        <h3>🚨 Real-time Alerts</h3>
        {alerts.length === 0 ? (
          <p>No active alerts</p>
        ) : (
          alerts.map(alert => (
            <div key={alert.id} className={`alert alert-${alert.status}`}>
              <strong>Patient {alert.patient_id}</strong>
              <p>Heart Rate: {alert.vital?.heart_rate} BPM</p>
              <p>SpO2: {alert.vital?.spO2}%</p>
              <button onClick={() => handleAcknowledgeAlert(alert.id, alert.patient_id)}>
                Acknowledge
              </button>
            </div>
          ))
        )}
      </div>
      
      <div className="online-doctors">
        <h3>👨‍⚕️ Online Doctors ({onlineDoctors.length})</h3>
        {onlineDoctors.map(doctor => (
          <div key={doctor.id} className="doctor-status">
            {doctor.name} 🟢
          </div>
        ))}
      </div>
      
      <div className="vital-updates">
        <h3>📊 Recent Updates</h3>
        {vitalUpdates.slice(0, 5).map(update => (
          <div key={update.timestamp} className="vital-update">
            <small>{new Date(update.timestamp).toLocaleTimeString()}</small>
            <div>Patient {update.patient_id}: {update.vital?.heart_rate} BPM</div>
            <button 
              onClick={() => subscribeToPatient(update.patient_id)}
              className="subscribe-btn"
              style={{ marginLeft: '10px', fontSize: '0.8em' }}
            >
              Subscribe
            </button>
          </div>
        ))}
      </div>
      
      {/* Optional: Tombol untuk subscribe manual */}
      <div style={{ marginTop: '20px' }}>
        <button onClick={handleSubscribeClick} className="btn btn-primary">
          Subscribe to Patient
        </button>
        {currentPatientId && (
          <div style={{ marginTop: '10px' }}>
            Currently subscribed to: Patient {currentPatientId}
          </div>
        )}
      </div>
    </div>
  );
};

export default RealTimeMonitor;