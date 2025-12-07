// backend/routes/dashboard-routes.js
import express from 'express';
import mysqlService from '../services/mysql-service.js';
import { authenticateJWT } from '../middleware/auth-middleware.js'; // GUNAKAN INI!


const router = express.Router();


// ==================== HELPER FUNCTIONS ====================
const getDoctorPatients = async (doctorId) => {
  const connection = await mysqlService.pool.getConnection();
  const [patients] = await connection.execute(
    `SELECT p.* FROM patients p
     JOIN doctor_patients dp ON p.patient_id = dp.patient_id
     WHERE dp.doctor_id = ?`,
    [doctorId]
  );
  connection.release();
  return patients;
};

const getFamilyPatients = async (familyId) => {
  const connection = await mysqlService.pool.getConnection();
  const [patients] = await connection.execute(
    `SELECT p.* FROM patients p
     JOIN family_patients fp ON p.patient_id = fp.patient_id
     WHERE fp.family_id = ? AND fp.status = 'active'`,
    [familyId]
  );
  connection.release();
  return patients;
};

// Helper function untuk mendapatkan ringkasan status pasien
const getPatientStatusSummary = async (patientIds) => {
  if (patientIds.length === 0) return { critical: 0, warning: 0, normal: 0 };
  
  const connection = await mysqlService.pool.getConnection();
  const placeholders = patientIds.map(() => '?').join(',');
  
  const [statusSummary] = await connection.execute(
    `SELECT 
      v.status,
      COUNT(*) as count
     FROM (
       SELECT DISTINCT v1.patient_id, v1.status
       FROM vitals v1
       WHERE (v1.patient_id, v1.created_at) IN (
         SELECT patient_id, MAX(created_at)
         FROM vitals
         WHERE patient_id IN (${placeholders})
         GROUP BY patient_id
       )
     ) v
     GROUP BY v.status`,
    patientIds
  );
  
  connection.release();
  
  return {
    critical: statusSummary.find(s => s.status === 'critical')?.count || 0,
    warning: statusSummary.find(s => s.status === 'warning')?.count || 0,
    normal: statusSummary.find(s => s.status === 'normal')?.count || 0
  };
};

// ==================== ROUTES ====================

// 1. DOCTOR DASHBOARD (Overview semua pasien)
router.get('/doctor/overview', authenticateJWT, async (req, res) => {
  try {
    const { userId, role } = req.user;
    
    if (role !== 'doctor') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Menggunakan helper function getDoctorPatients
    const patients = await getDoctorPatients(userId);
    const patientIds = patients.map(p => p.patient_id);
    
    const connection = await mysqlService.pool.getConnection();
    
    // ===== TOTAL COUNTS =====
    const [counts] = await connection.execute(
      `SELECT 
        COUNT(DISTINCT dp.patient_id) as total_patients,
        COUNT(DISTINCT CASE WHEN fp.status = 'active' THEN fp.family_id END) as total_families
       FROM doctor_patients dp
       LEFT JOIN family_patients fp ON dp.patient_id = fp.patient_id
       WHERE dp.doctor_id = ?`,
      [userId]
    );

    // ===== TODAY'S ACTIVITY =====
    const [todayActivity] = await connection.execute(
      `SELECT 
        COUNT(DISTINCT v.patient_id) as monitored_today,
        COUNT(CASE WHEN v.status = 'critical' THEN 1 END) as critical_today,
        COUNT(CASE WHEN v.status = 'warning' THEN 1 END) as warning_today,
        COUNT(*) as total_readings_today
       FROM vitals v
       JOIN doctor_patients dp ON v.patient_id = dp.patient_id
       WHERE dp.doctor_id = ? 
         AND DATE(v.created_at) = CURDATE()`,
      [userId]
    );

    // ===== PATIENTS STATUS SUMMARY =====
    const [patientsStatus] = await connection.execute(
      `SELECT 
        p.patient_id,
        p.name,
        p.room,
        p.condition,
        v.status as latest_status,
        v.heart_rate,
        v.spO2,
        v.temperature,
        v.created_at as last_reading_time,
        TIMESTAMPDIFF(MINUTE, v.created_at, NOW()) as minutes_since_last_reading
       FROM patients p
       JOIN doctor_patients dp ON p.patient_id = dp.patient_id
       LEFT JOIN (
         SELECT patient_id, status, heart_rate, spO2, temperature, created_at
         FROM vitals
         WHERE (patient_id, created_at) IN (
           SELECT patient_id, MAX(created_at)
           FROM vitals
           GROUP BY patient_id
         )
       ) v ON p.patient_id = v.patient_id
       WHERE dp.doctor_id = ?
       ORDER BY 
         CASE 
           WHEN v.status = 'critical' THEN 1
           WHEN v.status = 'warning' THEN 2
           ELSE 3 
         END,
         v.created_at DESC`,
      [userId]
    );

    // ===== CRITICAL PATIENTS (Urgent) =====
    const criticalPatients = patientsStatus.filter(p => p.latest_status === 'critical');
    
    // ===== WARNING PATIENTS (Need Attention) =====
    const warningPatients = patientsStatus.filter(p => p.latest_status === 'warning');
    
    // ===== NORMAL PATIENTS (Stable) =====
    const normalPatients = patientsStatus.filter(p => p.latest_status === 'normal' || p.latest_status === null);

    // ===== RECENT ALERTS =====
    const [recentAlerts] = await connection.execute(
      `SELECT 
        v.*,
        p.name as patient_name,
        p.room,
        TIMESTAMPDIFF(MINUTE, v.created_at, NOW()) as minutes_ago
       FROM vitals v
       JOIN patients p ON v.patient_id = p.patient_id
       JOIN doctor_patients dp ON p.patient_id = dp.patient_id
       WHERE dp.doctor_id = ? 
         AND v.status IN ('critical', 'warning')
         AND v.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
       ORDER BY v.created_at DESC
       LIMIT 10`,
      [userId]
    );

    // ===== DAILY STATISTICS (Last 7 days) =====
    const [dailyStats] = await connection.execute(
      `SELECT 
        DATE(v.created_at) as date,
        COUNT(DISTINCT v.patient_id) as patients_monitored,
        COUNT(CASE WHEN v.status = 'critical' THEN 1 END) as critical_readings,
        COUNT(CASE WHEN v.status = 'warning' THEN 1 END) as warning_readings,
        COUNT(*) as total_readings,
        ROUND(AVG(v.heart_rate), 1) as avg_heart_rate,
        ROUND(AVG(v.spO2), 1) as avg_spo2,
        ROUND(AVG(v.temperature), 2) as avg_temperature
       FROM vitals v
       JOIN doctor_patients dp ON v.patient_id = dp.patient_id
       WHERE dp.doctor_id = ?
         AND v.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       GROUP BY DATE(v.created_at)
       ORDER BY date DESC`,
      [userId]
    );

    // ===== ROOM OCCUPANCY =====
    const [roomOccupancy] = await connection.execute(
      `SELECT 
        room,
        COUNT(*) as patient_count,
        GROUP_CONCAT(name ORDER BY name) as patient_names
       FROM patients p
       JOIN doctor_patients dp ON p.patient_id = dp.patient_id
       WHERE dp.doctor_id = ? AND room IS NOT NULL
       GROUP BY room
       ORDER BY room`,
      [userId]
    );

    // Menggunakan helper function untuk ringkasan status
    const patientStatusSummary = await getPatientStatusSummary(patientIds);

    connection.release();

    res.json({
      summary: {
        total_patients: counts[0]?.total_patients || 0,
        total_families: counts[0]?.total_families || 0,
        monitored_today: todayActivity[0]?.monitored_today || 0,
        critical_today: todayActivity[0]?.critical_today || 0,
        warning_today: todayActivity[0]?.warning_today || 0,
        total_readings_today: todayActivity[0]?.total_readings_today || 0,
        patient_status_summary: patientStatusSummary
      },
      patients: {
        critical: criticalPatients,
        warning: warningPatients,
        normal: normalPatients,
        total: patientsStatus.length
      },
      recent_alerts: recentAlerts,
      daily_statistics: dailyStats,
      room_occupancy: roomOccupancy,
      last_updated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Doctor dashboard error:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

// 2. FAMILY DASHBOARD (Hanya pasien yang ditugaskan)
router.get('/family/overview', authenticateJWT, async (req, res) => {
  try {
    const { userId, role } = req.user;
    
    if (role !== 'family') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Menggunakan helper function getFamilyPatients
    const patients = await getFamilyPatients(userId);
    const patientIds = patients.map(p => p.patient_id);

    const connection = await mysqlService.pool.getConnection();
    
    // ===== FAMILY'S PATIENTS =====
    const [patientsWithDetails] = await connection.execute(
      `SELECT 
        p.*,
        fp.relationship,
        fp.status as assignment_status,
        v.status as latest_status,
        v.heart_rate,
        v.spO2,
        v.temperature,
        v.created_at as last_reading_time,
        TIMESTAMPDIFF(MINUTE, v.created_at, NOW()) as minutes_since_last_reading,
        (SELECT name FROM users WHERE id = p.created_by) as doctor_name
       FROM patients p
       JOIN family_patients fp ON p.patient_id = fp.patient_id
       LEFT JOIN (
         SELECT patient_id, status, heart_rate, spO2, temperature, created_at
         FROM vitals
         WHERE (patient_id, created_at) IN (
           SELECT patient_id, MAX(created_at)
           FROM vitals
           GROUP BY patient_id
         )
       ) v ON p.patient_id = v.patient_id
       WHERE fp.family_id = ? AND fp.status = 'active'
       ORDER BY 
         CASE 
           WHEN v.status = 'critical' THEN 1
           WHEN v.status = 'warning' THEN 2
           ELSE 3 
         END,
         v.created_at DESC`,
      [userId]
    );

    // ===== RECENT VITAL READINGS =====
    let recentVitals = [];
    
    if (patientIds.length > 0) {
      const placeholders = patientIds.map(() => '?').join(',');
      const [vitals] = await connection.execute(
        `SELECT 
          v.*,
          p.name as patient_name,
          p.room
         FROM vitals v
         JOIN patients p ON v.patient_id = p.patient_id
         WHERE v.patient_id IN (${placeholders})
         ORDER BY v.created_at DESC
         LIMIT 20`,
        patientIds
      );
      recentVitals = vitals;
    }

    // ===== ALERTS FOR FAMILY'S PATIENTS =====
    let alerts = [];
    if (patientIds.length > 0) {
      const placeholders = patientIds.map(() => '?').join(',');
      const [familyAlerts] = await connection.execute(
        `SELECT 
          v.*,
          p.name as patient_name,
          p.room,
          TIMESTAMPDIFF(MINUTE, v.created_at, NOW()) as minutes_ago
         FROM vitals v
         JOIN patients p ON v.patient_id = p.patient_id
         WHERE v.patient_id IN (${placeholders})
           AND v.status IN ('critical', 'warning')
           AND v.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
         ORDER BY v.created_at DESC
         LIMIT 10`,
        patientIds
      );
      alerts = familyAlerts;
    }

    // Menggunakan helper function untuk ringkasan status
    const patientStatusSummary = await getPatientStatusSummary(patientIds);

    connection.release();

    res.json({
      summary: {
        total_patients: patients.length,
        ...patientStatusSummary
      },
      patients: patientsWithDetails,
      recent_vitals: recentVitals,
      alerts: alerts,
      last_updated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Family dashboard error:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

// 3. PATIENT DETAIL DASHBOARD (Deep dive for single patient)
router.get('/patient/:patientId', authenticateJWT, async (req, res) => {
  try {
    const { patientId } = req.params;
    const { userId, role } = req.user;

    // Check access permission menggunakan helper functions
    let hasAccess = false;
    
    if (role === 'doctor') {
      const doctorPatients = await getDoctorPatients(userId);
      hasAccess = doctorPatients.some(p => p.patient_id == patientId);
    } else if (role === 'family') {
      const familyPatients = await getFamilyPatients(userId);
      hasAccess = familyPatients.some(p => p.patient_id == patientId);
    }

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const connection = await mysqlService.pool.getConnection();
    
    // ===== PATIENT INFO =====
    const [patientInfo] = await connection.execute(
      `SELECT 
        p.*,
        (SELECT name FROM users WHERE id = p.created_by) as primary_doctor,
        (SELECT COUNT(*) FROM vitals WHERE patient_id = p.patient_id) as total_readings
       FROM patients p
       WHERE p.patient_id = ?`,
      [patientId]
    );

    if (patientInfo.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Patient not found' });
    }

    // ===== CURRENT VITAL STATUS =====
    const [currentVital] = await connection.execute(
      `SELECT * FROM vitals 
       WHERE patient_id = ? 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [patientId]
    );

    // ===== VITAL TRENDS (Last 24 hours by hour) =====
    const [vitalTrends] = await connection.execute(
      `SELECT 
        DATE_FORMAT(created_at, '%Y-%m-%d %H:00:00') as hour,
        AVG(heart_rate) as avg_heart_rate,
        AVG(spO2) as avg_spo2,
        AVG(temperature) as avg_temperature,
        COUNT(CASE WHEN status = 'critical' THEN 1 END) as critical_count,
        COUNT(CASE WHEN status = 'warning' THEN 1 END) as warning_count
       FROM vitals 
       WHERE patient_id = ?
         AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
       GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d %H:00:00')
       ORDER BY hour`,
      [patientId]
    );

    // ===== RECENT READINGS =====
    const [recentReadings] = await connection.execute(
      `SELECT * FROM vitals 
       WHERE patient_id = ?
       ORDER BY created_at DESC
       LIMIT 10`,
      [patientId]
    );

    // ===== ALERT HISTORY =====
    const [alertHistory] = await connection.execute(
      `SELECT * FROM vitals 
       WHERE patient_id = ? 
         AND status IN ('critical', 'warning')
       ORDER BY created_at DESC
       LIMIT 20`,
      [patientId]
    );

    // ===== DAILY AVERAGES (Last 7 days) =====
    const [dailyAverages] = await connection.execute(
      `SELECT 
        DATE(created_at) as date,
        AVG(heart_rate) as avg_heart_rate,
        MIN(heart_rate) as min_heart_rate,
        MAX(heart_rate) as max_heart_rate,
        AVG(spO2) as avg_spo2,
        AVG(temperature) as avg_temperature,
        COUNT(*) as readings_count
       FROM vitals 
       WHERE patient_id = ?
         AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       GROUP BY DATE(created_at)
       ORDER BY date DESC`,
      [patientId]
    );

    // ===== MEDICATION/ASSIGNMENT INFO =====
    const [assignedDoctors] = await connection.execute(
      `SELECT 
        u.id, u.name, u.email, u.phone,
        dp.assigned_at
       FROM doctor_patients dp
       JOIN users u ON dp.doctor_id = u.id
       WHERE dp.patient_id = ?`,
      [patientId]
    );

    const [familyMembers] = await connection.execute(
      `SELECT 
        u.id, u.name, u.email, u.phone,
        fp.relationship, fp.status as assignment_status
       FROM family_patients fp
       JOIN users u ON fp.family_id = u.id
       WHERE fp.patient_id = ?`,
      [patientId]
    );

    connection.release();

    res.json({
      patient: patientInfo[0],
      current_status: currentVital[0] || null,
      vital_trends: vitalTrends,
      recent_readings: recentReadings,
      alert_history: alertHistory,
      daily_averages: dailyAverages,
      assignments: {
        doctors: assignedDoctors,
        family_members: familyMembers
      },
      monitoring: {
        is_active: recentReadings.length > 0,
        last_reading_time: currentVital[0]?.created_at || null,
        hours_monitored_today: vitalTrends.length
      }
    });

  } catch (error) {
    console.error('Patient dashboard error:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

// 4. REAL-TIME MONITORING ENDPOINT (For WebSocket/SSE)
router.get('/monitoring/updates', authenticateJWT, async (req, res) => {
  try {
    const { userId, role } = req.user;
    
    // Set headers for Server-Sent Events
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    console.log(`📡 SSE Connected: User ${userId} (${role})`);

    // Send initial data
    const sendEvent = (data, event = 'update') => {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    // Initial data - menggunakan helper functions
    if (role === 'doctor') {
      const patients = await getDoctorPatients(userId);
      const patientIds = patients.map(p => p.patient_id);
      const patientStatusSummary = await getPatientStatusSummary(patientIds);
      
      sendEvent({
        type: 'initial',
        total_patients: patients.length,
        patient_status_summary: patientStatusSummary,
        timestamp: new Date().toISOString()
      });
    } else if (role === 'family') {
      const patients = await getFamilyPatients(userId);
      const patientIds = patients.map(p => p.patient_id);
      const patientStatusSummary = await getPatientStatusSummary(patientIds);
      
      sendEvent({
        type: 'initial',
        total_patients: patients.length,
        patient_status_summary: patientStatusSummary,
        timestamp: new Date().toISOString()
      });
    }

    // Keep connection alive with heartbeat
    const heartbeat = setInterval(() => {
      sendEvent({ type: 'heartbeat', timestamp: new Date().toISOString() }, 'heartbeat');
    }, 30000);

    // Clean up on client disconnect
    req.on('close', () => {
      clearInterval(heartbeat);
      console.log(`📡 SSE Disconnected: User ${userId}`);
    });

  } catch (error) {
    console.error('SSE error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// 5. GET SYSTEM ACTIVITY LOG
router.get('/activity/log', authenticateJWT, async (req, res) => {
  try {
    const { userId, role } = req.user;
    const { limit = 50, type = 'all' } = req.query;

    const connection = await mysqlService.pool.getConnection();
    
    let activityLog = [];
    let queryParams = [];

    if (role === 'doctor') {
      // Doctor sees all activities for their patients
      
      // Build query based on type filter
      const baseQuery = `
        SELECT 
          ? as type,
          CONCAT('Vital reading for ', p.name) as description,
          v.status,
          v.created_at as timestamp,
          p.name as patient_name,
          p.patient_id
         FROM vitals v
         JOIN patients p ON v.patient_id = p.patient_id
         JOIN doctor_patients dp ON p.patient_id = dp.patient_id
         WHERE dp.doctor_id = ?
           AND v.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      `;

      const assignmentQuery = `
        SELECT 
          ? as type,
          CONCAT('Patient ', p.name, ' assigned') as description,
          'info' as status,
          dp.assigned_at as timestamp,
          p.name as patient_name,
          p.patient_id
         FROM doctor_patients dp
         JOIN patients p ON dp.patient_id = p.patient_id
         WHERE dp.doctor_id = ?
           AND dp.assigned_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      `;

      // Build queries based on type filter
      const queries = [];
      
      if (type === 'all' || type === 'vital_readings' || type === 'critical' || type === 'warning' || type === 'normal') {
        let vitalFilter = '';
        if (type === 'critical') {
          vitalFilter = ' AND v.status = "critical"';
        } else if (type === 'warning') {
          vitalFilter = ' AND v.status = "warning"';
        } else if (type === 'normal') {
          vitalFilter = ' AND v.status = "normal"';
        }
        
        queries.push(baseQuery + vitalFilter);
        queryParams.push(['vital_reading', userId]);
      }
      
      if (type === 'all' || type === 'assignments') {
        queries.push(assignmentQuery);
        queryParams.push(['patient_assigned', userId]);
      }

      if (queries.length > 0) {
        const unionQuery = queries.join(' UNION ALL ');
        const finalQuery = unionQuery + ' ORDER BY timestamp DESC LIMIT ?';
        
        // Flatten parameters
        const flatParams = [];
        queryParams.forEach(params => flatParams.push(...params));
        flatParams.push(parseInt(limit));

        const [log] = await connection.execute(finalQuery, flatParams);
        activityLog = log;
      }
    } else if (role === 'family') {
      // Family sees activities for their assigned patients
      const familyPatients = await getFamilyPatients(userId);
      const patientIds = familyPatients.map(p => p.patient_id);
      
      if (patientIds.length > 0) {
        const placeholders = patientIds.map(() => '?').join(',');
        
        let typeFilter = '';
        if (type === 'critical') {
          typeFilter = 'AND v.status = "critical"';
        } else if (type === 'warning') {
          typeFilter = 'AND v.status = "warning"';
        } else if (type === 'normal') {
          typeFilter = 'AND v.status = "normal"';
        }

        const [log] = await connection.execute(
          `SELECT 
            'vital_reading' as type,
            CONCAT('Vital reading for ', p.name) as description,
            v.status,
            v.created_at as timestamp,
            p.name as patient_name,
            p.patient_id
           FROM vitals v
           JOIN patients p ON v.patient_id = p.patient_id
           WHERE p.patient_id IN (${placeholders})
             AND v.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
             ${typeFilter}
           ORDER BY timestamp DESC
           LIMIT ?`,
          [...patientIds, parseInt(limit)]
        );
        
        activityLog = log;
      }
    }

    connection.release();

    // Filter activity log by type if needed (for backward compatibility)
    let filteredLog = activityLog;
    if (type !== 'all' && role === 'doctor') {
      const typeMap = {
        'vital_readings': 'vital_reading',
        'assignments': 'patient_assigned'
      };
      
      if (typeMap[type]) {
        filteredLog = activityLog.filter(log => log.type === typeMap[type]);
      }
    }

    // Categorize activities by type for summary
    const activitySummary = {
      total: filteredLog.length,
      vital_readings: filteredLog.filter(log => log.type === 'vital_reading').length,
      assignments: filteredLog.filter(log => log.type === 'patient_assigned').length,
      critical: filteredLog.filter(log => log.status === 'critical').length,
      warning: filteredLog.filter(log => log.status === 'warning').length,
      normal: filteredLog.filter(log => log.status === 'normal').length
    };

    res.json({
      activity_log: filteredLog,
      summary: activitySummary,
      filters: {
        applied: type,
        available: role === 'doctor' 
          ? ['all', 'vital_readings', 'assignments', 'critical', 'warning', 'normal']
          : ['all', 'critical', 'warning', 'normal']
      },
      time_range: 'last_24_hours'
    });

  } catch (error) {
    console.error('Activity log error:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

// 6. GET HEALTH METRICS SUMMARY
router.get('/metrics/summary', authenticateJWT, async (req, res) => {
  try {
    const { userId, role } = req.user;
    const { period = 'today' } = req.query; // today, week, month

    const periodMap = {
      'today': 'DATE(v.created_at) = CURDATE()',
      'week': 'v.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)',
      'month': 'v.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)'
    };

    const periodCondition = periodMap[period] || periodMap['today'];

    const connection = await mysqlService.pool.getConnection();
    
    let metrics = {};

    if (role === 'doctor') {
      const patients = await getDoctorPatients(userId);
      const patientIds = patients.map(p => p.patient_id);
      
      if (patientIds.length > 0) {
        const placeholders = patientIds.map(() => '?').join(',');
        const [summary] = await connection.execute(
          `SELECT 
            COUNT(DISTINCT v.patient_id) as patients_monitored,
            COUNT(*) as total_readings,
            COUNT(CASE WHEN v.status = 'critical' THEN 1 END) as critical_readings,
            COUNT(CASE WHEN v.status = 'warning' THEN 1 END) as warning_readings,
            ROUND(AVG(v.heart_rate), 1) as avg_heart_rate,
            ROUND(AVG(v.spO2), 1) as avg_spo2,
            ROUND(AVG(v.temperature), 2) as avg_temperature,
            MIN(v.created_at) as period_start,
            MAX(v.created_at) as period_end
           FROM vitals v
           WHERE v.patient_id IN (${placeholders})
             AND ${periodCondition}`,
          patientIds
        );

        metrics = summary[0] || {};
      }
    } else if (role === 'family') {
      const patients = await getFamilyPatients(userId);
      const patientIds = patients.map(p => p.patient_id);
      
      if (patientIds.length > 0) {
        const placeholders = patientIds.map(() => '?').join(',');
        const [summary] = await connection.execute(
          `SELECT 
            COUNT(DISTINCT v.patient_id) as patients_monitored,
            COUNT(*) as total_readings,
            COUNT(CASE WHEN v.status = 'critical' THEN 1 END) as critical_readings,
            COUNT(CASE WHEN v.status = 'warning' THEN 1 END) as warning_readings,
            ROUND(AVG(v.heart_rate), 1) as avg_heart_rate,
            ROUND(AVG(v.spO2), 1) as avg_spo2,
            ROUND(AVG(v.temperature), 2) as avg_temperature,
            MIN(v.created_at) as period_start,
            MAX(v.created_at) as period_end
           FROM vitals v
           WHERE v.patient_id IN (${placeholders})
             AND ${periodCondition}`,
          patientIds
        );

        metrics = summary[0] || {};
      }
    }

    connection.release();

    res.json({
      period,
      metrics,
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Metrics summary error:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

export default router;