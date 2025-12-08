// backend/routes/vital-routes.js
import express from 'express';
import mysqlService from '../services/mysql-service.js';
import { authenticateJWT } from '../middleware/auth-middleware.js';
import { triggerNewVitalReading, triggerPatientStatusChange } from '../websocket/websocket-server.js'; // IMPORT WEBSOCKET

const router = express.Router();

// Middleware khusus untuk IoT device (tanpa JWT, pakai API key)
const authenticateDevice = (req, res, next) => {
  const deviceApiKey = req.headers['x-device-api-key'];
  
  if (!deviceApiKey) {
    return res.status(401).json({ error: 'Device API key required' });
  }
  
  if (deviceApiKey !== process.env.DEVICE_API_KEY) {
    return res.status(401).json({ error: 'Invalid device API key' });
  }
  
  req.device = { type: 'iot' };
  next();
};

// ==================== HELPER FUNCTIONS ====================
const determineStatus = (heart_rate, spO2, temperature, rr_interval = null) => {
  let status = 'normal';
  
  // Get thresholds from environment or use defaults
  const HR_WARN_MIN = process.env.HEART_RATE_WARNING_MIN || 60;
  const HR_WARN_MAX = process.env.HEART_RATE_WARNING_MAX || 100;
  const HR_CRIT_MIN = process.env.HEART_RATE_CRITICAL_MIN || 50;
  const HR_CRIT_MAX = process.env.HEART_RATE_CRITICAL_MAX || 120;
  
  const SPO2_WARN = process.env.SPO2_WARNING_THRESHOLD || 95;
  const SPO2_CRIT = process.env.SPO2_CRITICAL_THRESHOLD || 90;
  
  const TEMP_WARN_MIN = process.env.TEMPERATURE_WARNING_MIN || 36.0;
  const TEMP_WARN_MAX = process.env.TEMPERATURE_WARNING_MAX || 37.5;
  const TEMP_CRIT_MIN = process.env.TEMPERATURE_CRITICAL_MIN || 35.0;
  const TEMP_CRIT_MAX = process.env.TEMPERATURE_CRITICAL_MAX || 39.0;
  
  // Threshold untuk RR Interval (dalam ms)
  const RR_WARN_MIN = process.env.RR_INTERVAL_WARNING_MIN || 400;  // 0.4 detik
  const RR_WARN_MAX = process.env.RR_INTERVAL_WARNING_MAX || 2000; // 2.0 detik
  const RR_CRIT_MIN = process.env.RR_INTERVAL_CRITICAL_MIN || 300;  // 0.3 detik
  const RR_CRIT_MAX = process.env.RR_INTERVAL_CRITICAL_MAX || 3000; // 3.0 detik
  
  // Threshold untuk heart rate (BPM)
  if (heart_rate < HR_WARN_MIN || heart_rate > HR_WARN_MAX) {
    status = 'warning';
  }
  if (heart_rate < HR_CRIT_MIN || heart_rate > HR_CRIT_MAX) {
    status = 'critical';
  }
  
  // Threshold untuk SpO2
  if (spO2 < SPO2_WARN) {
    status = 'warning';
  }
  if (spO2 < SPO2_CRIT) {
    status = 'critical';
  }
  
  // Threshold untuk suhu tubuh (°C)
  if (temperature < TEMP_WARN_MIN || temperature > TEMP_WARN_MAX) {
    status = 'warning';
  }
  if (temperature < TEMP_CRIT_MIN || temperature > TEMP_CRIT_MAX) {
    status = 'critical';
  }
  
  // Threshold untuk RR Interval (jika ada)
  if (rr_interval !== null && rr_interval !== undefined) {
    // RR interval dalam milidetik
    if (rr_interval < RR_WARN_MIN || rr_interval > RR_WARN_MAX) {
      status = status === 'critical' ? 'critical' : 'warning';
    }
    if (rr_interval < RR_CRIT_MIN || rr_interval > RR_CRIT_MAX) {
      status = 'critical';
    }
  }
  
  return status;
};

// Helper function untuk permission check
async function checkPatientAccess(userId, role, patientId, connection) {
  if (role === 'doctor') {
    const [result] = await connection.execute(
      'SELECT 1 FROM doctor_patients WHERE doctor_id = ? AND patient_id = ?',
      [userId, patientId]
    );
    return result.length > 0;
  } else if (role === 'family') {
    const [result] = await connection.execute(
      `SELECT 1 FROM family_patients 
       WHERE family_id = ? AND patient_id = ? AND status = 'active'`,
      [userId, patientId]
    );
    return result.length > 0;
  }
  // Admin atau role lain bisa ditambahkan di sini
  return false;
}

// ==================== ROUTES ====================

// 1. RECEIVE DATA FROM IOT DEVICE (Arduino/ESP32)
router.post('/device', authenticateDevice, async (req, res) => {
  let connection;
  try {
    const {
      patient_id,
      heart_rate,    // BPM dari MAX30100
      spO2,          // SpO2 dari MAX30100
      temperature,   // °C dari MLX90614
      ecg_raw,       // Raw value dari AD8232
      ecg_filtered,  // Filtered value
      rr_interval    // RR interval dalam ms
    } = req.body;

    console.log('📡 Received device data:', {
      patient_id,
      heart_rate,
      spO2,
      temperature,
      ecg_raw,
      ecg_filtered,
      rr_interval
    });

    // Validasi
    if (!patient_id) {
      return res.status(400).json({ error: 'Patient ID is required' });
    }

    // Validate sensor ranges
    if (heart_rate && (heart_rate < 30 || heart_rate > 250)) {
      return res.status(400).json({ error: 'Invalid heart rate value' });
    }
    
    if (spO2 && (spO2 < 50 || spO2 > 100)) {
      return res.status(400).json({ error: 'Invalid SpO2 value' });
    }
    
    if (temperature && (temperature < 20 || temperature > 45)) {
      return res.status(400).json({ error: 'Invalid temperature value' });
    }

    // Determine status berdasarkan threshold
    const status = determineStatus(heart_rate, spO2, temperature, rr_interval);

    connection = await mysqlService.pool.getConnection();
    
    // Get previous status for comparison
    const [previousVital] = await connection.execute(
      `SELECT status FROM vitals 
       WHERE patient_id = ?
       ORDER BY created_at DESC 
       LIMIT 1`,
      [patient_id]
    );
    
    const previousStatus = previousVital[0]?.status || 'normal';
    
    // Insert vital data
    const [result] = await connection.execute(
      `INSERT INTO vitals 
       (patient_id, heart_rate, spO2, ecg_raw, ecg_filtered, rr_interval, temperature, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        patient_id,
        heart_rate || null,
        spO2 || null,
        ecg_raw || null,
        ecg_filtered || null,
        rr_interval || null,
        temperature || null,
        status
      ]
    );

    const vitalId = result.insertId;
    const created_at = new Date().toISOString();
    
    // Trigger WebSocket event untuk new vital reading
    triggerNewVitalReading({
      id: vitalId,
      patient_id,
      heart_rate,
      spO2,
      temperature,
      ecg_raw,
      ecg_filtered,
      rr_interval,
      status,
      created_at
    });
    
    // Trigger WebSocket event jika status berubah
    if (previousStatus !== status) {
      triggerPatientStatusChange(patient_id, previousStatus, status);
    }

    // Jika status critical, trigger alert
    if (status === 'critical') {
      await triggerCriticalAlert(patient_id, {
        heart_rate,
        spO2,
        temperature,
        vital_id: vitalId
      }, connection);
    }

    connection.release();

    res.status(201).json({
      message: 'Vital data recorded',
      vital_id: vitalId,
      status,
      status_changed: previousStatus !== status,
      previous_status: previousStatus,
      current_status: status,
      timestamp: created_at,
      patient_id
    });

  } catch (error) {
    console.error('Device data error:', error);
    
    if (connection) {
      connection.release();
    }
    
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

// 2. GET VITAL HISTORY FOR PATIENT
router.get('/patient/:patientId', authenticateJWT, async (req, res) => {
  try {
    const { patientId } = req.params;
    const { userId, role } = req.user;
    
    const {
      limit = 100,
      offset = 0,
      start_date,
      end_date,
      status
    } = req.query;

    // Check access permission
    const connection = await mysqlService.pool.getConnection();
    
    const hasAccess = await checkPatientAccess(userId, role, patientId, connection);
    
    if (!hasAccess) {
      connection.release();
      return res.status(403).json({ error: 'Access denied' });
    }

    // Build query
    let query = `
      SELECT 
        id,
        patient_id,
        heart_rate,
        spO2,
        ecg_raw,
        ecg_filtered,
        rr_interval,
        temperature,
        status,
        created_at
      FROM vitals 
      WHERE patient_id = ?
    `;
    
    const params = [patientId];

    if (start_date && end_date) {
      query += ' AND created_at BETWEEN ? AND ?';
      params.push(start_date, end_date);
    }
    
    if (status && ['normal', 'warning', 'critical'].includes(status)) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [vitals] = await connection.execute(query, params);

    // Get summary statistics
    const [stats] = await connection.execute(
      `SELECT 
        COUNT(*) as total_readings,
        AVG(heart_rate) as avg_heart_rate,
        MIN(heart_rate) as min_heart_rate,
        MAX(heart_rate) as max_heart_rate,
        AVG(spO2) as avg_spo2,
        MIN(spO2) as min_spo2,
        MAX(spO2) as max_spo2,
        AVG(temperature) as avg_temperature,
        MIN(temperature) as min_temperature,
        MAX(temperature) as max_temperature,
        COUNT(CASE WHEN status = 'critical' THEN 1 END) as critical_count,
        COUNT(CASE WHEN status = 'warning' THEN 1 END) as warning_count,
        COUNT(CASE WHEN status = 'normal' THEN 1 END) as normal_count,
        MIN(created_at) as first_reading,
        MAX(created_at) as last_reading
       FROM vitals 
       WHERE patient_id = ?`,
      [patientId]
    );

    // Get latest reading
    const [latest] = await connection.execute(
      `SELECT * FROM vitals 
       WHERE patient_id = ? 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [patientId]
    );

    // Get trends (hourly averages for last 24h)
    const [trends] = await connection.execute(
      `SELECT 
        DATE_FORMAT(created_at, '%Y-%m-%d %H:00:00') as hour,
        AVG(heart_rate) as avg_heart_rate,
        AVG(spO2) as avg_spo2,
        AVG(temperature) as avg_temperature,
        COUNT(CASE WHEN status = 'critical' THEN 1 END) as critical_count
       FROM vitals 
       WHERE patient_id = ? 
         AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
       GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d %H:00:00')
       ORDER BY hour`,
      [patientId]
    );

    connection.release();

    res.json({
      vitals,
      summary: stats[0] || {},
      latest: latest[0] || null,
      trends,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: stats[0]?.total_readings || 0
      }
    });

  } catch (error) {
    console.error('Get vitals error:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

// 3. GET LATEST VITAL FOR PATIENT
router.get('/patient/:patientId/latest', authenticateJWT, async (req, res) => {
  try {
    const { patientId } = req.params;
    const { userId, role } = req.user;

    // Check access permission
    const connection = await mysqlService.pool.getConnection();
    
    const hasAccess = await checkPatientAccess(userId, role, patientId, connection);
    
    if (!hasAccess) {
      connection.release();
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get latest vital data with patient info
    const [vitals] = await connection.execute(
      `SELECT 
        v.*,
        p.name as patient_name,
        p.room
       FROM vitals v
       JOIN patients p ON v.patient_id = p.patient_id
       WHERE v.patient_id = ?
       ORDER BY v.created_at DESC
       LIMIT 1`,
      [patientId]
    );

    if (vitals.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'No vital data found' });
    }

    // Get previous reading for comparison
    const [previous] = await connection.execute(
      `SELECT heart_rate, spO2, temperature, created_at
       FROM vitals 
       WHERE patient_id = ? 
         AND id < ?
       ORDER BY created_at DESC 
       LIMIT 1`,
      [patientId, vitals[0].id]
    );

    connection.release();

    const current = vitals[0];
    const prev = previous[0] || null;

    // Calculate changes
    const changes = {
      heart_rate: prev ? current.heart_rate - prev.heart_rate : null,
      spO2: prev ? current.spO2 - prev.spO2 : null,
      temperature: prev ? current.temperature - prev.temperature : null,
      time_since_previous: prev ? 
        Math.round((new Date(current.created_at) - new Date(prev.created_at)) / 60000) : null // in minutes
    };

    res.json({
      ...current,
      changes,
      is_stable: current.status === 'normal'
    });

  } catch (error) {
    console.error('Get latest vital error:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

// 4. GET CRITICAL ALERTS
router.get('/alerts/critical', authenticateJWT, async (req, res) => {
  try {
    const { userId, role } = req.user;
    
    if (role !== 'doctor') {
      return res.status(403).json({ error: 'Only doctors can view critical alerts' });
    }

    const { limit = 50, resolved = false } = req.query;

    const connection = await mysqlService.pool.getConnection();
    
    let query = `
      SELECT 
        v.*,
        p.name as patient_name,
        p.room,
        p.condition,
        u.name as doctor_name
      FROM vitals v
      JOIN patients p ON v.patient_id = p.patient_id
      JOIN doctor_patients dp ON p.patient_id = dp.patient_id
      JOIN users u ON dp.doctor_id = u.id
      WHERE v.status = 'critical'
        AND dp.doctor_id = ?
    `;
    
    const params = [userId];

    if (resolved === 'true') {
      query += ` AND v.created_at < DATE_SUB(NOW(), INTERVAL 5 MINUTE)`;
    } else {
      query += ` AND v.created_at >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)`;
    }

    query += ` ORDER BY v.created_at DESC LIMIT ?`;
    params.push(parseInt(limit));

    const [alerts] = await connection.execute(query, params);

    // Get alert summary
    const [summary] = await connection.execute(
      `SELECT 
        COUNT(*) as total_critical,
        COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 5 MINUTE) THEN 1 END) as active_critical,
        COUNT(DISTINCT patient_id) as affected_patients
       FROM vitals 
       WHERE status = 'critical'
         AND patient_id IN (
           SELECT patient_id FROM doctor_patients WHERE doctor_id = ?
         )`,
      [userId]
    );

    connection.release();

    res.json({
      alerts,
      summary: summary[0] || {},
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get critical alerts error:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

// 5. GET VITAL STATISTICS
router.get('/patient/:patientId/statistics', authenticateJWT, async (req, res) => {
  try {
    const { patientId } = req.params;
    const { userId, role } = req.user;
    const { period = '24h' } = req.query;

    // Check access permission
    const connection = await mysqlService.pool.getConnection();
    
    const hasAccess = await checkPatientAccess(userId, role, patientId, connection);
    
    if (!hasAccess) {
      connection.release();
      return res.status(403).json({ error: 'Access denied' });
    }

    const periodMap = {
      '24h': 'INTERVAL 24 HOUR',
      '7d': 'INTERVAL 7 DAY',
      '30d': 'INTERVAL 30 DAY',
      'all': 'INTERVAL 100 YEAR'
    };

    const interval = periodMap[period] || periodMap['24h'];

    // Get statistics grouped by hour/day
    const [statistics] = await connection.execute(
      `SELECT 
        DATE(created_at) as date,
        HOUR(created_at) as hour,
        COUNT(*) as reading_count,
        AVG(heart_rate) as avg_heart_rate,
        STD(heart_rate) as std_heart_rate,
        AVG(spO2) as avg_spo2,
        AVG(temperature) as avg_temperature,
        COUNT(CASE WHEN status = 'critical' THEN 1 END) as critical_count,
        COUNT(CASE WHEN status = 'warning' THEN 1 END) as warning_count
       FROM vitals 
       WHERE patient_id = ?
         AND created_at >= DATE_SUB(NOW(), ${interval})
       GROUP BY DATE(created_at), HOUR(created_at)
       ORDER BY date, hour`,
      [patientId]
    );

    // Get min/max/average for the period
    const [overall] = await connection.execute(
      `SELECT 
        MIN(heart_rate) as min_heart_rate,
        MAX(heart_rate) as max_heart_rate,
        AVG(heart_rate) as avg_heart_rate,
        MIN(spO2) as min_spo2,
        MAX(spO2) as max_spo2,
        AVG(spO2) as avg_spo2,
        MIN(temperature) as min_temperature,
        MAX(temperature) as max_temperature,
        AVG(temperature) as avg_temperature,
        COUNT(*) as total_readings,
        TIMESTAMPDIFF(MINUTE, MIN(created_at), MAX(created_at)) as monitoring_duration_minutes
       FROM vitals 
       WHERE patient_id = ?
         AND created_at >= DATE_SUB(NOW(), ${interval})`,
      [patientId]
    );

    // Get status distribution
    const [statusDistribution] = await connection.execute(
      `SELECT 
        status,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM vitals WHERE patient_id = ? AND created_at >= DATE_SUB(NOW(), ${interval})), 2) as percentage
       FROM vitals 
       WHERE patient_id = ?
         AND created_at >= DATE_SUB(NOW(), ${interval})
       GROUP BY status`,
      [patientId, patientId]
    );

    connection.release();

    res.json({
      period,
      statistics,
      overall: overall[0] || {},
      status_distribution: statusDistribution,
      time_range: {
        start: new Date(Date.now() - (
          period === '24h' ? 86400000 : 
          period === '7d' ? 604800000 : 
          period === '30d' ? 2592000000 : 31536000000
        )),
        end: new Date()
      }
    });

  } catch (error) {
    console.error('Get vital statistics error:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

// 6. GET REAL-TIME VITAL DATA (WebSocket/SSE alternative)
router.get('/patient/:patientId/realtime', authenticateJWT, async (req, res) => {
  try {
    const { patientId } = req.params;
    const { userId, role } = req.user;

    // Check access permission
    const connection = await mysqlService.pool.getConnection();
    
    const hasAccess = await checkPatientAccess(userId, role, patientId, connection);
    
    if (!hasAccess) {
      connection.release();
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get last 10 minutes of data for real-time display
    const [realtimeData] = await connection.execute(
      `SELECT 
        id,
        heart_rate,
        spO2,
        temperature,
        status,
        created_at
       FROM vitals 
       WHERE patient_id = ?
         AND created_at >= DATE_SUB(NOW(), INTERVAL 10 MINUTE)
       ORDER BY created_at ASC`,
      [patientId]
    );

    connection.release();

    res.json({
      patient_id: patientId,
      realtime_data: realtimeData,
      timestamp: new Date().toISOString(),
      data_points: realtimeData.length
    });

  } catch (error) {
    console.error('Get real-time vitals error:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

// ==================== HELPER FUNCTION ====================
async function triggerCriticalAlert(patientId, vitalData, connection) {
  try {
    console.log(`🚨 CRITICAL ALERT triggered for patient ${patientId}`, vitalData);
    
    // Get patient details
    const [patient] = await connection.execute(
      'SELECT name, room, condition FROM patients WHERE patient_id = ?',
      [patientId]
    );

    if (patient.length > 0) {
      const patientInfo = patient[0];
      
      // Get assigned doctors
      const [doctors] = await connection.execute(
        `SELECT u.id, u.name, u.email, u.phone 
         FROM doctor_patients dp
         JOIN users u ON dp.doctor_id = u.id
         WHERE dp.patient_id = ?`,
        [patientId]
      );

      // TODO: Implement notification system
      // 1. Send email/SMS to doctors
      // 2. Send push notification
      // 3. WebSocket broadcast
      // 4. Log to alerts table (jika ada)
      
      console.log('📢 Alert would be sent to:', doctors.map(d => d.name));
      
      // For now, just log
      return {
        patient: patientInfo,
        doctors,
        vital_data: vitalData,
        timestamp: new Date().toISOString()
      };
    }
  } catch (error) {
    console.error('Trigger alert error:', error);
  }
}

export default router;