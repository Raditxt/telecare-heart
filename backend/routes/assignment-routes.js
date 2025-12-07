// backend/routes/assignment-routes.js
import express from 'express';
import { authenticateJWT } from '../middleware/auth-middleware.js'; // GUNAKAN INI!
import mysqlService from '../services/mysql-service.js';

const router = express.Router();

// 1. ASSIGN DOCTOR TO PATIENT
router.post('/doctor', authenticateJWT, async (req, res) => {
  try {
    const { role } = req.user;
    
    if (role !== 'doctor') {
      return res.status(403).json({ error: 'Only doctors can assign doctors' });
    }

    const { doctor_id, patient_id } = req.body;

    if (!doctor_id || !patient_id) {
      return res.status(400).json({ error: 'Doctor ID and Patient ID are required' });
    }

    const connection = await mysqlService.pool.getConnection();
    
    // Check if patient exists
    const [patient] = await connection.execute(
      'SELECT 1 FROM patients WHERE patient_id = ?',
      [patient_id]
    );

    if (patient.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Check if doctor exists and is actually a doctor
    const [doctor] = await connection.execute(
      'SELECT 1 FROM users WHERE id = ? AND role = "doctor"',
      [doctor_id]
    );

    if (doctor.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Doctor not found' });
    }

    // Check if assignment already exists
    const [existing] = await connection.execute(
      'SELECT 1 FROM doctor_patients WHERE doctor_id = ? AND patient_id = ?',
      [doctor_id, patient_id]
    );

    if (existing.length > 0) {
      connection.release();
      return res.status(400).json({ error: 'Doctor already assigned to this patient' });
    }

    // Create assignment
    await connection.execute(
      'INSERT INTO doctor_patients (doctor_id, patient_id) VALUES (?, ?)',
      [doctor_id, patient_id]
    );

    connection.release();

    res.status(201).json({
      message: 'Doctor assigned to patient successfully',
      assignment: {
        doctor_id,
        patient_id,
        assigned_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Assign doctor error:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

// 2. ASSIGN FAMILY TO PATIENT
router.post('/family', authenticateJWT, async (req, res) => {
  try {
    const { userId, role } = req.user;
    
    if (role !== 'doctor') {
      return res.status(403).json({ error: 'Only doctors can assign family members' });
    }

    const { family_id, patient_id, relationship, family_email } = req.body;

    if (!family_id || !patient_id) {
      return res.status(400).json({ error: 'Family ID and Patient ID are required' });
    }

    const connection = await mysqlService.pool.getConnection();
    
    // Check if patient exists
    const [patient] = await connection.execute(
      'SELECT 1 FROM patients WHERE patient_id = ?',
      [patient_id]
    );

    if (patient.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Check if family exists and is actually a family
    const [family] = await connection.execute(
      'SELECT 1 FROM users WHERE id = ? AND role = "family"',
      [family_id]
    );

    if (family.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Family member not found' });
    }

    // Check if assignment already exists
    const [existing] = await connection.execute(
      `SELECT 1 FROM family_patients 
       WHERE family_id = ? AND patient_id = ? AND status != 'inactive'`,
      [family_id, patient_id]
    );

    if (existing.length > 0) {
      connection.release();
      return res.status(400).json({ error: 'Family member already assigned to this patient' });
    }

    // Create assignment
    await connection.execute(
      `INSERT INTO family_patients 
       (family_id, patient_id, relationship, assigned_by, family_email, status) 
       VALUES (?, ?, ?, ?, ?, 'active')`,
      [family_id, patient_id, relationship || null, userId, family_email || null]
    );

    connection.release();

    res.status(201).json({
      message: 'Family member assigned to patient successfully',
      assignment: {
        family_id,
        patient_id,
        relationship: relationship || null,
        assigned_by: userId,
        status: 'active',
        assigned_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Assign family error:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

// 3. REMOVE DOCTOR FROM PATIENT
router.delete('/doctor/:doctorId/patient/:patientId', authenticateJWT, async (req, res) => {
  try {
    const { role } = req.user;
    const { doctorId, patientId } = req.params;
    
    if (role !== 'doctor') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const connection = await mysqlService.pool.getConnection();
    
    // Check if assignment exists
    const [assignment] = await connection.execute(
      'SELECT 1 FROM doctor_patients WHERE doctor_id = ? AND patient_id = ?',
      [doctorId, patientId]
    );

    if (assignment.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // Remove assignment
    await connection.execute(
      'DELETE FROM doctor_patients WHERE doctor_id = ? AND patient_id = ?',
      [doctorId, patientId]
    );

    // Check if patient still has any doctors assigned
    const [remainingDoctors] = await connection.execute(
      'SELECT COUNT(*) as count FROM doctor_patients WHERE patient_id = ?',
      [patientId]
    );

    // If no doctors left, also remove from current_assignment
    if (remainingDoctors[0]?.count === 0) {
      await connection.execute(
        'DELETE FROM current_assignment WHERE patient_id = ?',
        [patientId]
      );
    }

    connection.release();

    res.json({
      message: 'Doctor removed from patient successfully',
      patient_still_has_doctors: remainingDoctors[0]?.count > 0
    });

  } catch (error) {
    console.error('Remove doctor error:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

// 4. UPDATE FAMILY ASSIGNMENT STATUS
router.put('/family/:familyId/patient/:patientId', authenticateJWT, async (req, res) => {
  try {
    const { role } = req.user;
    const { familyId, patientId } = req.params;
    const { status, relationship } = req.body;
    
    if (role !== 'doctor') {
      return res.status(403).json({ error: 'Only doctors can update family assignments' });
    }

    if (!status && !relationship) {
      return res.status(400).json({ error: 'Either status or relationship must be provided' });
    }

    if (status && !['active', 'inactive', 'pending'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const connection = await mysqlService.pool.getConnection();
    
    // Check if assignment exists
    const [assignment] = await connection.execute(
      'SELECT 1 FROM family_patients WHERE family_id = ? AND patient_id = ?',
      [familyId, patientId]
    );

    if (assignment.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // Build update query
    const updates = [];
    const params = [];

    if (status) {
      updates.push('status = ?');
      params.push(status);
    }
    
    if (relationship !== undefined) {
      updates.push('relationship = ?');
      params.push(relationship);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP()');
    
    params.push(familyId, patientId);

    await connection.execute(
      `UPDATE family_patients 
       SET ${updates.join(', ')} 
       WHERE family_id = ? AND patient_id = ?`,
      params
    );

    connection.release();

    res.json({
      message: 'Family assignment updated successfully',
      updated_fields: {
        status: status || 'unchanged',
        relationship: relationship !== undefined ? relationship : 'unchanged'
      }
    });

  } catch (error) {
    console.error('Update family assignment error:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

// 5. GET PATIENT ASSIGNMENTS
router.get('/patient/:patientId', authenticateJWT, async (req, res) => {
  try {
    const { patientId } = req.params;
    const { userId, role } = req.user;

    const connection = await mysqlService.pool.getConnection();
    
    // Check access
    let hasAccess = false;
    if (role === 'doctor') {
      const [result] = await connection.execute(
        'SELECT 1 FROM doctor_patients WHERE doctor_id = ? AND patient_id = ?',
        [userId, patientId]
      );
      hasAccess = result.length > 0;
    } else if (role === 'family') {
      const [result] = await connection.execute(
        `SELECT 1 FROM family_patients 
         WHERE family_id = ? AND patient_id = ? AND status = 'active'`,
        [userId, patientId]
      );
      hasAccess = result.length > 0;
    }

    if (!hasAccess) {
      connection.release();
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get all doctors assigned to patient
    const [doctors] = await connection.execute(
      `SELECT 
        u.id, u.name, u.email, u.phone, u.role,
        dp.assigned_at
       FROM doctor_patients dp
       JOIN users u ON dp.doctor_id = u.id
       WHERE dp.patient_id = ?
       ORDER BY dp.assigned_at DESC`,
      [patientId]
    );

    // Get all family members assigned to patient
    const [familyMembers] = await connection.execute(
      `SELECT 
        u.id, u.name, u.email, u.phone, u.role,
        fp.relationship, fp.status, fp.assigned_at, fp.assigned_by,
        (SELECT name FROM users WHERE id = fp.assigned_by) as assigned_by_name
       FROM family_patients fp
       JOIN users u ON fp.family_id = u.id
       WHERE fp.patient_id = ?
       ORDER BY fp.status, fp.assigned_at DESC`,
      [patientId]
    );

    // Get current assignment
    const [currentAssignment] = await connection.execute(
      `SELECT 
        ca.*,
        u.name as doctor_name,
        u.phone as doctor_phone
       FROM current_assignment ca
       JOIN users u ON ca.doctor_id = u.id
       WHERE ca.patient_id = ?`,
      [patientId]
    );

    connection.release();

    res.json({
      patient_id: patientId,
      doctors: doctors,
      family_members: familyMembers,
      current_assignment: currentAssignment[0] || null,
      summary: {
        total_doctors: doctors.length,
        active_family: familyMembers.filter(f => f.status === 'active').length,
        pending_family: familyMembers.filter(f => f.status === 'pending').length
      }
    });

  } catch (error) {
    console.error('Get assignments error:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

// 6. GET AVAILABLE DOCTORS FOR ASSIGNMENT
router.get('/available/doctors', authenticateJWT, async (req, res) => {
  try {
    const { role } = req.user;
    
    if (role !== 'doctor') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { search } = req.query;

    const connection = await mysqlService.pool.getConnection();
    
    let query = `
      SELECT 
        id, name, email, phone, role,
        (SELECT COUNT(*) FROM doctor_patients WHERE doctor_id = users.id) as patient_count
      FROM users 
      WHERE role = 'doctor'
    `;
    
    const params = [];

    if (search) {
      query += ' AND (name LIKE ? OR email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY name';
    
    const [doctors] = await connection.execute(query, params);

    connection.release();

    res.json(doctors);

  } catch (error) {
    console.error('Get available doctors error:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

// 7. GET AVAILABLE FAMILY MEMBERS
router.get('/available/family', authenticateJWT, async (req, res) => {
  try {
    const { role } = req.user;
    
    if (role !== 'doctor') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { search } = req.query;

    const connection = await mysqlService.pool.getConnection();
    
    let query = `
      SELECT 
        id, name, email, phone, role,
        (SELECT COUNT(*) FROM family_patients WHERE family_id = users.id AND status = 'active') as active_assignments
      FROM users 
      WHERE role = 'family'
    `;
    
    const params = [];

    if (search) {
      query += ' AND (name LIKE ? OR email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY name';
    
    const [familyMembers] = await connection.execute(query, params);

    connection.release();

    res.json(familyMembers);

  } catch (error) {
    console.error('Get available family error:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

export default router;