// backend/routes/mysql-routes.js
import express from 'express';
import mysqlService from '../services/mysql-service.js';

const router = express.Router();

// Get all patients
router.get('/patients', async (req, res) => {
  try {
    const patients = await mysqlService.getPatients();
    res.json(patients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get patient vitals
router.get('/vitals/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    const { limit = 100, hours = 24 } = req.query;
    
    const vitals = await mysqlService.getVitals(patientId, parseInt(limit), parseInt(hours));
    res.json(vitals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get ECG data for patient
router.get('/ecg/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    const { limit = 50 } = req.query;
    
    const ecgData = await mysqlService.getECGData(patientId, parseInt(limit));
    res.json(ecgData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all devices
router.get('/devices', async (req, res) => {
  try {
    const devices = await mysqlService.getDevices();
    res.json(devices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get alerts
router.get('/alerts', async (req, res) => {
  try {
    const { resolved } = req.query;
    let query = 'SELECT * FROM alerts';
    let params = [];
    
    if (resolved !== undefined) {
      query += ' WHERE resolved = ?';
      params.push(resolved === 'true');
    }
    
    query += ' ORDER BY created_at DESC LIMIT 100';
    
    const connection = await mysqlService.pool.getConnection();
    const [alerts] = await connection.execute(query, params);
    connection.release();
    
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create alert
router.post('/alerts', async (req, res) => {
  try {
    const { patientId, deviceId, type, message } = req.body;
    
    const alertId = await mysqlService.createAlert({
      patientId,
      deviceId,
      type,
      message
    });
    
    res.json({ id: alertId, message: 'Alert created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    const connection = await mysqlService.pool.getConnection();
    
    // Device statistics
    const [deviceStats] = await connection.execute(
      `SELECT 
        COUNT(*) as total_devices,
        SUM(CASE WHEN status = 'connected' THEN 1 ELSE 0 END) as connected_devices,
        AVG(battery_level) as avg_battery
       FROM devices`
    );
    
    // Vitals statistics
    const [vitalStats] = await connection.execute(
      `SELECT 
        COUNT(*) as total_readings,
        AVG(heart_rate) as avg_heart_rate,
        AVG(spO2) as avg_spo2,
        SUM(CASE WHEN status = 'critical' THEN 1 ELSE 0 END) as critical_readings,
        SUM(CASE WHEN status = 'warning' THEN 1 ELSE 0 END) as warning_readings
       FROM vitals 
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)`
    );
    
    // Alert statistics
    const [alertStats] = await connection.execute(
      `SELECT 
        COUNT(*) as total_alerts,
        SUM(CASE WHEN resolved = FALSE THEN 1 ELSE 0 END) as active_alerts
       FROM alerts 
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)`
    );
    
    connection.release();
    
    res.json({
      devices: deviceStats[0],
      vitals: vitalStats[0],
      alerts: alertStats[0]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    const isHealthy = await mysqlService.healthCheck();
    res.json({ 
      status: isHealthy ? 'healthy' : 'unhealthy',
      database: 'telecare_heart',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error',
      error: error.message 
    });
  }
});

export default router;