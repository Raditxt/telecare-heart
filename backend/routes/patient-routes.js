// backend/routes/patient-routes.js
import express from 'express';
import mysqlService from '../services/mysql-service.js';
import { authenticateJWT } from '../middleware/auth-middleware.js'; // GUNAKAN INI!

const router = express.Router();

// ==================== HELPER FUNCTIONS ====================
const checkPatientAccess = async (userId, userRole, patientId) => {
  const connection = await mysqlService.pool.getConnection();
  
  try {
    if (userRole === 'doctor') {
      const [result] = await connection.execute(
        'SELECT 1 FROM doctor_patients WHERE doctor_id = ? AND patient_id = ?',
        [userId, patientId]
      );
      return result.length > 0;
    } else if (userRole === 'family') {
      const [result] = await connection.execute(
        `SELECT 1 FROM family_patients 
         WHERE family_id = ? AND patient_id = ? AND status = 'active'`,
        [userId, patientId]
      );
      return result.length > 0;
    }
    return false;
  } finally {
    connection.release();
  }
};

const generatePatientId = () => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `PAT${timestamp}${random}`;
};

const formatDate = (date) => {
  if (!date) return null;
  if (typeof date === 'string') {
    return date.split('T')[0];
  }
  return date.toISOString().split('T')[0];
};

// ==================== ROUTES ====================

// 1. GET ALL PATIENTS
router.get('/', authenticateJWT, async (req, res) => {
  try {
    console.log('👨‍⚕️ User accessing patients:', req.user);
    const { userId, role } = req.user;
    const { search, page = 1, limit = 20 } = req.query;
    
    const connection = await mysqlService.pool.getConnection();
    let query = '';
    let params = [];
    const offset = (page - 1) * limit;

    if (role === 'doctor') {
      query = `
        SELECT 
          p.*,
          (SELECT name FROM users WHERE id = p.created_by) as created_by_name,
          (SELECT status FROM vitals WHERE patient_id = p.patient_id ORDER BY created_at DESC LIMIT 1) as latest_status
        FROM patients p
        INNER JOIN doctor_patients dp ON p.patient_id = dp.patient_id
        WHERE dp.doctor_id = ?
      `;
      params.push(userId);
      
      if (search) {
        query += ` AND (p.name LIKE ? OR p.patient_id LIKE ? OR p.room LIKE ?)`;
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }
      
      query += ` ORDER BY p.created_at DESC LIMIT ? OFFSET ?`;
      params.push(parseInt(limit), offset);

    } else if (role === 'family') {
      query = `
        SELECT 
          p.*,
          fp.relationship,
          (SELECT name FROM users WHERE id = p.created_by) as created_by_name,
          (SELECT status FROM vitals WHERE patient_id = p.patient_id ORDER BY created_at DESC LIMIT 1) as latest_status
        FROM patients p
        INNER JOIN family_patients fp ON p.patient_id = fp.patient_id
        WHERE fp.family_id = ? AND fp.status = 'active'
      `;
      params.push(userId);
      
      if (search) {
        query += ` AND (p.name LIKE ? OR p.patient_id LIKE ? OR p.room LIKE ?)`;
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }
      
      query += ` ORDER BY p.created_at DESC LIMIT ? OFFSET ?`;
      params.push(parseInt(limit), offset);
    } else {
      connection.release();
      return res.status(403).json({ error: 'Access denied' });
    }

    console.log('📊 Executing query:', query, params);
    const [patients] = await connection.execute(query, params);
    
    // Format dates for response
    const formattedPatients = patients.map(patient => ({
      ...patient,
      date_of_birth: formatDate(patient.date_of_birth)
    }));
    
    // Get total count
    let countQuery = '';
    let countParams = [];
    
    if (role === 'doctor') {
      countQuery = `
        SELECT COUNT(DISTINCT p.patient_id) as total 
        FROM patients p
        INNER JOIN doctor_patients dp ON p.patient_id = dp.patient_id
        WHERE dp.doctor_id = ?
      `;
      countParams = [userId];
    } else {
      countQuery = `
        SELECT COUNT(DISTINCT p.patient_id) as total 
        FROM patients p
        INNER JOIN family_patients fp ON p.patient_id = fp.patient_id
        WHERE fp.family_id = ? AND fp.status = 'active'
      `;
      countParams = [userId];
    }
    
    const [countResult] = await connection.execute(countQuery, countParams);
    const total = countResult[0]?.total || 0;
    
    connection.release();

    console.log(`✅ Found ${formattedPatients.length} patients for user ${userId}`);
    res.json({
      patients: formattedPatients,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('❌ Get patients error:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

// 2. CREATE NEW PATIENT (Doctor only)
router.post('/', authenticateJWT, async (req, res) => {
  try {
    const { role, userId } = req.user;
    
    if (role !== 'doctor') {
      return res.status(403).json({ error: 'Only doctors can create patients' });
    }

    const {
      patient_id,
      name,
      date_of_birth,
      age,
      gender,
      room,
      condition,
      address,
      phone
    } = req.body;

    console.log('📝 Creating patient for doctor:', userId, 'Data:', req.body);

    // Validation
    if (!name) {
      return res.status(400).json({ error: 'Patient name is required' });
    }

    const connection = await mysqlService.pool.getConnection();
    
    // Generate patient ID if not provided
    let finalPatientId = patient_id;
    if (!finalPatientId) {
      finalPatientId = generatePatientId();
      console.log('🆔 Generated patient ID:', finalPatientId);
    } else {
      // Check if custom ID already exists
      const [existing] = await connection.execute(
        'SELECT 1 FROM patients WHERE patient_id = ?',
        [finalPatientId]
      );
      if (existing.length > 0) {
        connection.release();
        return res.status(400).json({ error: 'Patient ID already exists' });
      }
    }

    // Calculate age from date_of_birth if not provided
    let calculatedAge = age;
    if (date_of_birth && !age) {
      const birthDate = new Date(date_of_birth);
      const today = new Date();
      calculatedAge = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        calculatedAge--;
      }
      console.log('📅 Calculated age from DOB:', calculatedAge);
    }

    try {
      // Insert patient
      await connection.execute(
        `INSERT INTO patients 
         (patient_id, name, date_of_birth, age, gender, room, \`condition\`, address, phone, created_by) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          finalPatientId,
          name,
          date_of_birth || null,
          calculatedAge || null,
          gender || null,
          room || null,
          condition || null,
          address || null,
          phone || null,
          userId
        ]
      );

      // Auto-assign to creating doctor
      await connection.execute(
        'INSERT INTO doctor_patients (doctor_id, patient_id) VALUES (?, ?)',
        [userId, finalPatientId]
      );

      // Set current assignment
      await connection.execute(
        `INSERT INTO current_assignment (patient_id, doctor_id) 
         VALUES (?, ?) 
         ON DUPLICATE KEY UPDATE doctor_id = ?`,
        [finalPatientId, userId, userId]
      );

      connection.release();

      console.log('✅ Patient created successfully:', finalPatientId);

      res.status(201).json({
        message: 'Patient created successfully',
        patient_id: finalPatientId,
        patient: {
          patient_id: finalPatientId,
          name,
          date_of_birth: date_of_birth || null,
          age: calculatedAge || null,
          gender: gender || null,
          room: room || null,
          condition: condition || null
        }
      });

    } catch (dbError) {
      connection.release();
      console.error('❌ Database error:', dbError);
      
      if (dbError.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ error: 'Patient ID already exists' });
      }
      
      throw dbError;
    }

  } catch (error) {
    console.error('❌ Create patient error:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

// 3. GET SINGLE PATIENT WITH COMPLETE DETAILS
router.get('/:patientId', authenticateJWT, async (req, res) => {
  try {
    const { patientId } = req.params;
    const { userId, role } = req.user;

    console.log('🔍 Getting patient details:', { patientId, userId, role });

    // Check access permission
    const hasAccess = await checkPatientAccess(userId, role, patientId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied to this patient' });
    }

    const connection = await mysqlService.pool.getConnection();
    
    // Get patient basic info
    const [patients] = await connection.execute(
      'SELECT patient_id, name, date_of_birth, age, gender, room, `condition`, address, phone, created_by, created_at, updated_at FROM patients WHERE patient_id = ?',
      [patientId]
    );

    if (patients.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Patient not found' });
    }

    const patient = patients[0];
    
    // Get vital signs (latest 24 hours)
    const [recentVitals] = await connection.execute(
      `SELECT * FROM vitals 
       WHERE patient_id = ? 
       AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
       ORDER BY created_at DESC 
       LIMIT 100`,
      [patientId]
    );

    // Get vital statistics for 24 hours
    const [vitalStats] = await connection.execute(
      `SELECT 
        AVG(heart_rate) as avg_heart_rate,
        MIN(heart_rate) as min_heart_rate,
        MAX(heart_rate) as max_heart_rate,
        AVG(spO2) as avg_spo2,
        MIN(spO2) as min_spo2,
        AVG(temperature) as avg_temperature,
        COUNT(CASE WHEN status = 'critical' THEN 1 END) as critical_count,
        COUNT(CASE WHEN status = 'warning' THEN 1 END) as warning_count,
        MAX(created_at) as last_reading
       FROM vitals 
       WHERE patient_id = ? 
       AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)`,
      [patientId]
    );

    // Get assigned doctors
    const [assignedDoctors] = await connection.execute(
      `SELECT 
        u.id, u.name, u.email, u.phone, u.role,
        dp.assigned_at
       FROM doctor_patients dp
       JOIN users u ON dp.doctor_id = u.id
       WHERE dp.patient_id = ?`,
      [patientId]
    );

    // Get family members
    const [familyMembers] = await connection.execute(
      `SELECT 
        u.id, u.name, u.email, u.phone, u.role,
        fp.relationship, fp.status, fp.assigned_at, fp.assigned_by
       FROM family_patients fp
       JOIN users u ON fp.family_id = u.id
       WHERE fp.patient_id = ?`,
      [patientId]
    );

    // Get current assignment
    const [currentAssignment] = await connection.execute(
      `SELECT 
        ca.*,
        u.name as doctor_name,
        u.phone as doctor_phone
       FROM current_assignment ca
       LEFT JOIN users u ON ca.doctor_id = u.id
       WHERE ca.patient_id = ?`,
      [patientId]
    );

    // Get latest vital
    const [latestVital] = await connection.execute(
      `SELECT * FROM vitals 
       WHERE patient_id = ? 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [patientId]
    );

    // Get created_by user name
    let createdByName = 'Unknown';
    if (patient.created_by) {
      const [creator] = await connection.execute(
        'SELECT name FROM users WHERE id = ?',
        [patient.created_by]
      );
      if (creator.length > 0) {
        createdByName = creator[0].name;
      }
    }

    connection.release();

    // Prepare complete response
    const response = {
      patient: {
        ...patient,
        date_of_birth: formatDate(patient.date_of_birth),
        created_by_name: createdByName
      },
      vitals: {
        recent: recentVitals,
        latest: latestVital[0] || null,
        stats: vitalStats[0] || {}
      },
      assignments: {
        doctors: assignedDoctors,
        family: familyMembers,
        current: currentAssignment[0] || null
      },
      permissions: {
        can_edit: role === 'doctor' && assignedDoctors.some(d => d.id == userId),
        can_assign_family: role === 'doctor',
        can_view_details: true
      }
    };

    console.log('✅ Patient details retrieved:', {
      patientId,
      hasAssignments: assignedDoctors.length > 0,
      hasFamily: familyMembers.length > 0,
      hasCurrentAssignment: currentAssignment.length > 0
    });
    
    res.json(response);

  } catch (error) {
    console.error('❌ Get patient details error:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

// 4. UPDATE PATIENT (Doctor only)
router.put('/:patientId', authenticateJWT, async (req, res) => {
  try {
    const { patientId } = req.params;
    const { userId, role } = req.user;
    
    if (role !== 'doctor') {
      return res.status(403).json({ error: 'Only doctors can update patients' });
    }

    // Check if doctor is assigned to this patient
    const hasAccess = await checkPatientAccess(userId, role, patientId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Not assigned to this patient' });
    }

    const {
      name,
      date_of_birth,
      age,
      gender,
      room,
      condition,
      address,
      phone
    } = req.body;

    const connection = await mysqlService.pool.getConnection();
    
    // Build dynamic update query
    const updates = [];
    const params = [];

    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name);
    }
    
    if (date_of_birth !== undefined) {
      updates.push('date_of_birth = ?');
      params.push(date_of_birth || null);
      
      // Recalculate age if date_of_birth is updated
      if (date_of_birth && !age) {
        const birthDate = new Date(date_of_birth);
        const today = new Date();
        let calculatedAge = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          calculatedAge--;
        }
        updates.push('age = ?');
        params.push(calculatedAge);
      }
    }
    
    if (age !== undefined && date_of_birth === undefined) {
      updates.push('age = ?');
      params.push(age || null);
    }
    
    if (gender !== undefined) {
      updates.push('gender = ?');
      params.push(gender || null);
    }
    
    if (room !== undefined) {
      updates.push('room = ?');
      params.push(room || null);
    }
    
    if (condition !== undefined) {
      updates.push('`condition` = ?');
      params.push(condition || null);
    }
    
    if (address !== undefined) {
      updates.push('address = ?');
      params.push(address || null);
    }
    
    if (phone !== undefined) {
      updates.push('phone = ?');
      params.push(phone || null);
    }

    if (updates.length === 0) {
      connection.release();
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP()');
    params.push(patientId);

    const [result] = await connection.execute(
      `UPDATE patients 
       SET ${updates.join(', ')} 
       WHERE patient_id = ?`,
      params
    );

    if (result.affectedRows === 0) {
      connection.release();
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Get updated patient data
    const [updatedPatient] = await connection.execute(
      'SELECT patient_id, name, date_of_birth, age, gender, room, `condition`, address, phone, created_by, created_at, updated_at FROM patients WHERE patient_id = ?',
      [patientId]
    );

    connection.release();

    res.json({
      message: 'Patient updated successfully',
      patient: {
        ...updatedPatient[0],
        date_of_birth: formatDate(updatedPatient[0].date_of_birth)
      }
    });

  } catch (error) {
    console.error('❌ Update patient error:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

// 5. DELETE PATIENT (Soft delete - Doctor only)
router.delete('/:patientId', authenticateJWT, async (req, res) => {
  try {
    const { patientId } = req.params;
    const { userId, role } = req.user;
    
    if (role !== 'doctor') {
      return res.status(403).json({ error: 'Only doctors can delete patients' });
    }

    // Check if doctor is assigned to this patient
    const hasAccess = await checkPatientAccess(userId, role, patientId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Not assigned to this patient' });
    }

    const connection = await mysqlService.pool.getConnection();
    
    // Check if patient has vital records
    const [vitalsCount] = await connection.execute(
      'SELECT COUNT(*) as count FROM vitals WHERE patient_id = ?',
      [patientId]
    );

    if (vitalsCount[0].count > 0) {
      // Soft delete: remove from assignments but keep patient data
      await connection.execute(
        'DELETE FROM doctor_patients WHERE patient_id = ?',
        [patientId]
      );
      
      await connection.execute(
        'UPDATE family_patients SET status = "inactive" WHERE patient_id = ?',
        [patientId]
      );
      
      await connection.execute(
        'DELETE FROM current_assignment WHERE patient_id = ?',
        [patientId]
      );

      connection.release();
      
      return res.json({
        message: 'Patient deactivated successfully (data preserved)',
        preserved_records: vitalsCount[0].count,
        patient_id: patientId
      });
    } else {
      // Hard delete if no vital records exist
      await connection.execute('DELETE FROM doctor_patients WHERE patient_id = ?', [patientId]);
      await connection.execute('DELETE FROM family_patients WHERE patient_id = ?', [patientId]);
      await connection.execute('DELETE FROM current_assignment WHERE patient_id = ?', [patientId]);
      const [deleteResult] = await connection.execute('DELETE FROM patients WHERE patient_id = ?', [patientId]);

      connection.release();
      
      return res.json({
        message: 'Patient deleted permanently (no vital records found)',
        patient_id: patientId,
        deleted: deleteResult.affectedRows > 0
      });
    }

  } catch (error) {
    console.error('❌ Delete patient error:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

// 6. SEARCH PATIENTS (Quick search)
router.get('/search/quick', authenticateJWT, async (req, res) => {
  try {
    const { role, userId } = req.user;
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    const connection = await mysqlService.pool.getConnection();
    
    let query = '';
    const params = [`%${q}%`, `%${q}%`, `%${q}%`];

    if (role === 'doctor') {
      query = `
        SELECT p.patient_id, p.name, p.room, p.age, p.gender, p.condition,
               (SELECT status FROM vitals WHERE patient_id = p.patient_id ORDER BY created_at DESC LIMIT 1) as status
        FROM patients p
        INNER JOIN doctor_patients dp ON p.patient_id = dp.patient_id
        WHERE dp.doctor_id = ? 
          AND (p.name LIKE ? OR p.patient_id LIKE ? OR p.room LIKE ?)
        ORDER BY p.name
        LIMIT 10
      `;
      params.unshift(userId);
    } else {
      query = `
        SELECT p.patient_id, p.name, p.room, p.age, p.gender, p.condition, fp.relationship,
               (SELECT status FROM vitals WHERE patient_id = p.patient_id ORDER BY created_at DESC LIMIT 1) as status
        FROM patients p
        INNER JOIN family_patients fp ON p.patient_id = fp.patient_id
        WHERE fp.family_id = ? AND fp.status = 'active'
          AND (p.name LIKE ? OR p.patient_id LIKE ? OR p.room LIKE ?)
        ORDER BY p.name
        LIMIT 10
      `;
      params.unshift(userId);
    }

    const [results] = await connection.execute(query, params);
    connection.release();

    res.json(results);

  } catch (error) {
    console.error('❌ Search patients error:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

// 7. GET PATIENT STATISTICS
router.get('/:patientId/stats', authenticateJWT, async (req, res) => {
  try {
    const { patientId } = req.params;
    const { userId, role } = req.user;
    const { period = '24h' } = req.query; // 24h, 7d, 30d

    // Check access
    const hasAccess = await checkPatientAccess(userId, role, patientId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const intervals = {
      '24h': 'INTERVAL 24 HOUR',
      '7d': 'INTERVAL 7 DAY',
      '30d': 'INTERVAL 30 DAY'
    };

    const interval = intervals[period] || intervals['24h'];

    const connection = await mysqlService.pool.getConnection();
    
    // Get vital statistics
    const [stats] = await connection.execute(
      `SELECT 
        DATE(created_at) as date,
        HOUR(created_at) as hour,
        AVG(heart_rate) as avg_heart_rate,
        AVG(spO2) as avg_spo2,
        AVG(temperature) as avg_temperature,
        COUNT(CASE WHEN status = 'critical' THEN 1 END) as critical_count,
        COUNT(CASE WHEN status = 'warning' THEN 1 END) as warning_count,
        COUNT(*) as total_readings
       FROM vitals 
       WHERE patient_id = ? 
       AND created_at >= DATE_SUB(NOW(), ${interval})
       GROUP BY DATE(created_at), HOUR(created_at)
       ORDER BY date DESC, hour DESC`,
      [patientId]
    );

    // Get trend data
    const [trend] = await connection.execute(
      `SELECT 
        created_at,
        heart_rate,
        spO2,
        temperature,
        status
       FROM vitals 
       WHERE patient_id = ? 
       AND created_at >= DATE_SUB(NOW(), ${interval})
       ORDER BY created_at`,
      [patientId]
    );

    // Get alerts summary
    const [alerts] = await connection.execute(
      `SELECT 
        status,
        COUNT(*) as count,
        MIN(created_at) as first_occurrence,
        MAX(created_at) as last_occurrence
       FROM vitals 
       WHERE patient_id = ? 
         AND status IN ('warning', 'critical')
         AND created_at >= DATE_SUB(NOW(), ${interval})
       GROUP BY status`,
      [patientId]
    );

    // Get current vital status
    const [currentVital] = await connection.execute(
      `SELECT * FROM vitals 
       WHERE patient_id = ? 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [patientId]
    );

    connection.release();

    res.json({
      period,
      statistics: stats,
      trend: trend,
      alerts_summary: alerts,
      current_vital: currentVital[0] || null,
      time_range: {
        start: new Date(Date.now() - (period === '24h' ? 86400000 : period === '7d' ? 604800000 : 2592000000)),
        end: new Date()
      }
    });

  } catch (error) {
    console.error('❌ Get patient stats error:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

// 8. GET PATIENT'S DOCTORS
router.get('/:patientId/doctors', authenticateJWT, async (req, res) => {
  try {
    const { patientId } = req.params;
    const { userId, role } = req.user;

    const hasAccess = await checkPatientAccess(userId, role, patientId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const connection = await mysqlService.pool.getConnection();
    
    const [doctors] = await connection.execute(
      `SELECT 
        u.id, u.name, u.email, u.phone, u.role,
        dp.assigned_at
       FROM doctor_patients dp
       JOIN users u ON dp.doctor_id = u.id
       WHERE dp.patient_id = ?`,
      [patientId]
    );

    connection.release();
    res.json(doctors);

  } catch (error) {
    console.error('❌ Get patient doctors error:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

// 9. GET PATIENT'S FAMILY MEMBERS
router.get('/:patientId/family', authenticateJWT, async (req, res) => {
  try {
    const { patientId } = req.params;
    const { userId, role } = req.user;

    const hasAccess = await checkPatientAccess(userId, role, patientId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const connection = await mysqlService.pool.getConnection();
    
    const [family] = await connection.execute(
      `SELECT 
        u.id, u.name, u.email, u.phone, u.role,
        fp.relationship, fp.status, fp.assigned_at, fp.assigned_by
       FROM family_patients fp
       JOIN users u ON fp.family_id = u.id
       WHERE fp.patient_id = ?`,
      [patientId]
    );

    connection.release();
    res.json(family);

  } catch (error) {
    console.error('❌ Get patient family error:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

// 10. EXPORT PATIENT DATA (Doctor only)
router.get('/:patientId/export', authenticateJWT, async (req, res) => {
  try {
    const { patientId } = req.params;
    const { userId, role } = req.user;
    
    if (role !== 'doctor') {
      return res.status(403).json({ error: 'Only doctors can export data' });
    }

    // Check access
    const hasAccess = await checkPatientAccess(userId, role, patientId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { format = 'json', start_date, end_date } = req.query;

    const connection = await mysqlService.pool.getConnection();
    
    // Get patient info
    const [patient] = await connection.execute(
      'SELECT * FROM patients WHERE patient_id = ?',
      [patientId]
    );

    if (patient.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Get vitals with date range
    let vitalQuery = 'SELECT * FROM vitals WHERE patient_id = ?';
    const vitalParams = [patientId];
    
    if (start_date && end_date) {
      vitalQuery += ' AND created_at BETWEEN ? AND ?';
      vitalParams.push(start_date, end_date);
    }
    
    vitalQuery += ' ORDER BY created_at';
    
    const [vitals] = await connection.execute(vitalQuery, vitalParams);

    // Get assignments
    const [doctors] = await connection.execute(
      `SELECT u.name, u.email, u.phone, dp.assigned_at 
       FROM doctor_patients dp
       JOIN users u ON dp.doctor_id = u.id
       WHERE dp.patient_id = ?`,
      [patientId]
    );

    const [family] = await connection.execute(
      `SELECT u.name, u.email, u.phone, fp.relationship, fp.status, fp.assigned_at 
       FROM family_patients fp
       JOIN users u ON fp.family_id = u.id
       WHERE fp.patient_id = ?`,
      [patientId]
    );

    connection.release();

    const exportData = {
      patient: {
        ...patient[0],
        date_of_birth: formatDate(patient[0].date_of_birth)
      },
      vitals: {
        count: vitals.length,
        data: vitals,
        date_range: {
          start: start_date || 'all',
          end: end_date || 'all'
        }
      },
      assignments: {
        doctors,
        family
      },
      export_info: {
        exported_at: new Date().toISOString(),
        exported_by: userId,
        format
      }
    };

    if (format === 'csv') {
      // Convert to CSV
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=patient_${patientId}_${new Date().toISOString().split('T')[0]}.csv`);
      
      let csv = 'Patient Data Export\n\n';
      csv += 'PATIENT INFORMATION\n';
      csv += `Patient ID,${patient[0].patient_id}\n`;
      csv += `Name,${patient[0].name}\n`;
      csv += `Date of Birth,${formatDate(patient[0].date_of_birth)}\n`;
      csv += `Age,${patient[0].age}\n`;
      csv += `Gender,${patient[0].gender}\n`;
      csv += `Room,${patient[0].room}\n`;
      csv += `Condition,${patient[0].condition}\n`;
      csv += `Phone,${patient[0].phone}\n\n`;
      
      csv += 'VITAL SIGNS\n';
      csv += 'Timestamp,Heart Rate,SpO2,Temperature,Status\n';
      vitals.forEach(v => {
        csv += `${v.created_at},${v.heart_rate || ''},${v.spO2 || ''},${v.temperature || ''},${v.status}\n`;
      });
      
      return res.send(csv);
    } else {
      // Default JSON
      res.json(exportData);
    }

  } catch (error) {
    console.error('❌ Export patient error:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

// 11. ASSIGN DOCTOR TO PATIENT (Doctor only)
router.post('/:patientId/assign-doctor', authenticateJWT, async (req, res) => {
  try {
    const { patientId } = req.params;
    const { userId, role } = req.user;
    const { doctor_id } = req.body;
    
    if (role !== 'doctor') {
      return res.status(403).json({ error: 'Only doctors can assign doctors' });
    }

    // Check if requesting doctor has access to patient
    const hasAccess = await checkPatientAccess(userId, role, patientId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Not assigned to this patient' });
    }

    if (!doctor_id) {
      return res.status(400).json({ error: 'Doctor ID is required' });
    }

    const connection = await mysqlService.pool.getConnection();
    
    // Check if doctor exists
    const [doctor] = await connection.execute(
      'SELECT id, name, role FROM users WHERE id = ? AND role = "doctor"',
      [doctor_id]
    );

    if (doctor.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Doctor not found' });
    }

    // Check if already assigned
    const [existing] = await connection.execute(
      'SELECT 1 FROM doctor_patients WHERE doctor_id = ? AND patient_id = ?',
      [doctor_id, patientId]
    );

    if (existing.length > 0) {
      connection.release();
      return res.status(400).json({ error: 'Doctor already assigned to this patient' });
    }

    // Assign doctor
    await connection.execute(
      'INSERT INTO doctor_patients (doctor_id, patient_id) VALUES (?, ?)',
      [doctor_id, patientId]
    );

    connection.release();

    res.status(201).json({
      message: 'Doctor assigned successfully',
      doctor: doctor[0],
      patient_id: patientId
    });

  } catch (error) {
    console.error('❌ Assign doctor error:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

// 12. REMOVE DOCTOR FROM PATIENT (Doctor only)
router.delete('/:patientId/doctors/:doctorId', authenticateJWT, async (req, res) => {
  try {
    const { patientId, doctorId } = req.params;
    const { userId, role } = req.user;
    
    if (role !== 'doctor') {
      return res.status(403).json({ error: 'Only doctors can remove doctors' });
    }

    // Check if requesting doctor has access to patient
    const hasAccess = await checkPatientAccess(userId, role, patientId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Not assigned to this patient' });
    }

    const connection = await mysqlService.pool.getConnection();
    
    // Prevent removing the last doctor
    const [doctorCount] = await connection.execute(
      'SELECT COUNT(*) as count FROM doctor_patients WHERE patient_id = ?',
      [patientId]
    );

    if (doctorCount[0].count <= 1) {
      connection.release();
      return res.status(400).json({ error: 'Cannot remove the last doctor from patient' });
    }

    // Remove doctor assignment
    const [result] = await connection.execute(
      'DELETE FROM doctor_patients WHERE doctor_id = ? AND patient_id = ?',
      [doctorId, patientId]
    );

    if (result.affectedRows === 0) {
      connection.release();
      return res.status(404).json({ error: 'Doctor not assigned to this patient' });
    }

    // Update current assignment if removed doctor was current
    const [current] = await connection.execute(
      'SELECT * FROM current_assignment WHERE patient_id = ? AND doctor_id = ?',
      [patientId, doctorId]
    );

    if (current.length > 0) {
      // Assign to another doctor
      const [otherDoctor] = await connection.execute(
        'SELECT doctor_id FROM doctor_patients WHERE patient_id = ? LIMIT 1',
        [patientId]
      );
      
      if (otherDoctor.length > 0) {
        await connection.execute(
          'UPDATE current_assignment SET doctor_id = ? WHERE patient_id = ?',
          [otherDoctor[0].doctor_id, patientId]
        );
      } else {
        await connection.execute(
          'DELETE FROM current_assignment WHERE patient_id = ?',
          [patientId]
        );
      }
    }

    connection.release();

    res.json({
      message: 'Doctor removed from patient successfully',
      patient_id: patientId,
      doctor_id: doctorId
    });

  } catch (error) {
    console.error('❌ Remove doctor error:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

export default router;