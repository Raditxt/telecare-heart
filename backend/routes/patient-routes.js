// backend/routes/patient-routes.js
import express from 'express';
import mysqlService from '../services/mysql-service.js';

const router = express.Router();

// Get all patients (untuk doctor)
router.get('/patients', async (req, res) => {
  try {
    const connection = await mysqlService.pool.getConnection();
    const [patients] = await connection.execute(
      'SELECT * FROM patients WHERE is_active = TRUE'
    );
    connection.release();
    res.json(patients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get doctor's patients (doctor bisa lihat semua patients)
router.get('/patients/doctor/:doctorId', async (req, res) => {
  try {
    const { doctorId } = req.params;
    const connection = await mysqlService.pool.getConnection();
    
    if (!doctorId) {
      return res.status(400).json({ error: 'Doctor ID is required' });
    }
    
    console.log(`Fetching all patients for doctor: ${doctorId}`);
    
    const [patients] = await connection.execute(
      'SELECT * FROM patients WHERE is_active = TRUE'
    );
    
    connection.release();
    res.json(patients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get family's patients (hanya patient yang di-assign)
router.get('/patients/family/:familyId', async (req, res) => {
  try {
    const { familyId } = req.params;
    const connection = await mysqlService.pool.getConnection();
    
    // ✅ PERBAIKAN: Hapus p.is_active karena tidak ada, ganti dengan kondisi lain
    const [patients] = await connection.execute(
      `SELECT p.*, fp.relationship 
       FROM patients p
       INNER JOIN family_patients fp ON p.patient_id = fp.patient_id
       WHERE fp.family_id = ? AND fp.is_active = TRUE`,
      [familyId]
    );
    
    connection.release();
    
    // Log untuk debugging
    console.log(`Found ${patients.length} patients for family ${familyId}`);
    
    res.json(patients);
  } catch (error) {
    console.error('Error fetching family patients:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get available patients untuk assign (patients yang belum di-assign ke doctor ini)
router.get('/patients/available/:doctorId', async (req, res) => {
  try {
    const { doctorId } = req.params;
    const connection = await mysqlService.pool.getConnection();
    
    if (!doctorId) {
      return res.status(400).json({ error: 'Doctor ID is required' });
    }
    
    const [patients] = await connection.execute(
      `SELECT p.* 
       FROM patients p
       WHERE p.is_active = TRUE 
       AND p.patient_id NOT IN (
         SELECT patient_id 
         FROM doctor_patients 
         WHERE doctor_id = ?
       )`,
      [doctorId]
    );
    
    console.log(`Found ${patients.length} available patients for doctor: ${doctorId}`);
    
    connection.release();
    res.json(patients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get specific patient
router.get('/patients/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    const connection = await mysqlService.pool.getConnection();
    
    const [patients] = await connection.execute(
      'SELECT * FROM patients WHERE patient_id = ? AND is_active = TRUE',
      [patientId]
    );
    
    connection.release();
    
    if (patients.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    res.json(patients[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ PERBAIKAN: Add new patient (sesuai struktur tabel)
router.post('/patients', async (req, res) => {
  let connection;
  try {
    const patientData = req.body;
    
    // Validasi data wajib
    if (!patientData.name || !patientData.room || !patientData.condition) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, room, condition' 
      });
    }
    
    connection = await mysqlService.pool.getConnection();
    
    // Generate patient_id jika tidak disediakan
    if (!patientData.patient_id) {
      const timestamp = Date.now();
      const randomNum = Math.floor(Math.random() * 1000);
      patientData.patient_id = `PATIENT_${timestamp}_${randomNum}`;
    }
    
    console.log('Adding new patient:', patientData);
    
    // ✅ PERBAIKAN: Sesuaikan query dengan struktur tabel yang ada
    // Kolom yang tersedia: patient_id, name, room, age, gender, condition, 
    // assigned_device, created_at, updated_at, created_by, is_public
    const query = `
      INSERT INTO patients 
      (patient_id, name, room, age, gender, \`condition\`, created_by, is_public, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    
    const values = [
      patientData.patient_id,
      patientData.name,
      patientData.room,
      patientData.age || null,
      patientData.gender || null,
      patientData.condition,
      patientData.created_by || null, // Tambahkan created_by dari form
      patientData.is_public !== undefined ? patientData.is_public : false // Default false
    ];
    
    const [result] = await connection.execute(query, values);
    
    console.log(`Insert result: ${result.affectedRows} row(s) affected`);
    console.log(`Insert ID: ${result.insertId}`);
    
    if (result.affectedRows === 0) {
      connection.release();
      return res.status(500).json({ error: 'Failed to insert patient into database' });
    }
    
    // Ambil data patient yang baru dibuat
    const [patients] = await connection.execute(
      'SELECT * FROM patients WHERE patient_id = ?',
      [patientData.patient_id]
    );
    
    connection.release();
    
    if (patients.length === 0) {
      return res.status(500).json({ error: 'Failed to retrieve created patient' });
    }
    
    res.json({
      success: true,
      message: 'Patient added successfully',
      patient: patients[0],
      insertInfo: {
        affectedRows: result.affectedRows,
        insertId: result.insertId
      }
    });
    
  } catch (error) {
    console.error('Error adding patient:', error);
    if (connection) {
      connection.release();
    }
    res.status(500).json({ 
      error: 'Failed to add patient',
      details: error.message 
    });
  }
});

// Assign patient to doctor
router.post('/patients/assign', async (req, res) => {
  try {
    const { doctorId, patientId } = req.body;
    const connection = await mysqlService.pool.getConnection();
    
    // Validasi input
    if (!doctorId || !patientId) {
      return res.status(400).json({ error: 'Doctor ID and Patient ID are required' });
    }
    
    // Check if doctor exists
    const [doctors] = await connection.execute(
      'SELECT user_id FROM users WHERE user_id = ? AND role = "doctor" AND is_active = TRUE',
      [doctorId]
    );
    
    if (doctors.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Doctor not found' });
    }
    
    // Check if patient exists
    const [patients] = await connection.execute(
      'SELECT patient_id FROM patients WHERE patient_id = ? AND is_active = TRUE',
      [patientId]
    );
    
    if (patients.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    // Check if assignment already exists
    const [existing] = await connection.execute(
      'SELECT * FROM doctor_patients WHERE doctor_id = ? AND patient_id = ?',
      [doctorId, patientId]
    );
    
    if (existing.length > 0) {
      connection.release();
      return res.status(400).json({ error: 'Patient already assigned to this doctor' });
    }
    
    // Create assignment
    await connection.execute(
      'INSERT INTO doctor_patients (doctor_id, patient_id) VALUES (?, ?)',
      [doctorId, patientId]
    );
    
    console.log(`Patient ${patientId} assigned to doctor ${doctorId}`);
    
    connection.release();
    res.json({ message: 'Patient assigned successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add family relationship
router.post('/patients/family', async (req, res) => {
  try {
    const { familyId, patientId, relationship } = req.body;
    const connection = await mysqlService.pool.getConnection();
    
    // Check if relationship already exists
    const [existing] = await connection.execute(
      'SELECT * FROM family_patients WHERE family_id = ? AND patient_id = ? AND is_active = TRUE',
      [familyId, patientId]
    );
    
    if (existing.length > 0) {
      connection.release();
      return res.status(400).json({ error: 'Relationship already exists' });
    }
    
    // Create relationship
    await connection.execute(
      'INSERT INTO family_patients (family_id, patient_id, relationship) VALUES (?, ?, ?)',
      [familyId, patientId, relationship]
    );
    
    connection.release();
    res.json({ message: 'Family relationship added successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ PERBAIKAN: Update patient (sesuai struktur tabel)
router.put('/patients/:patientId', async (req, res) => {
  let connection;
  try {
    const { patientId } = req.params;
    const patientData = req.body;
    
    connection = await mysqlService.pool.getConnection();
    
    // Check if patient exists
    const [patients] = await connection.execute(
      'SELECT * FROM patients WHERE patient_id = ?',
      [patientId]
    );
    
    if (patients.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    // Build update query dynamically
    const fields = [];
    const values = [];
    
    if (patientData.name !== undefined) {
      fields.push('name = ?');
      values.push(patientData.name);
    }
    if (patientData.room !== undefined) {
      fields.push('room = ?');
      values.push(patientData.room);
    }
    if (patientData.age !== undefined) {
      fields.push('age = ?');
      values.push(patientData.age);
    }
    if (patientData.gender !== undefined) {
      fields.push('gender = ?');
      values.push(patientData.gender);
    }
    if (patientData.condition !== undefined) {
      fields.push('`condition` = ?');
      values.push(patientData.condition);
    }
    if (patientData.assigned_device !== undefined) {
      fields.push('assigned_device = ?');
      values.push(patientData.assigned_device);
    }
    if (patientData.created_by !== undefined) {
      fields.push('created_by = ?');
      values.push(patientData.created_by);
    }
    if (patientData.is_public !== undefined) {
      fields.push('is_public = ?');
      values.push(patientData.is_public);
    }
    
    // Always update the updated_at timestamp
    fields.push('updated_at = NOW()');
    
    if (fields.length === 0) {
      connection.release();
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    values.push(patientId); // Add patientId for WHERE clause
    
    const updateQuery = `
      UPDATE patients 
      SET ${fields.join(', ')}
      WHERE patient_id = ?
    `;
    
    await connection.execute(updateQuery, values);
    
    // Get updated patient data
    const [updatedPatients] = await connection.execute(
      'SELECT * FROM patients WHERE patient_id = ?',
      [patientId]
    );
    
    connection.release();
    
    res.json({
      success: true,
      message: 'Patient updated successfully',
      patient: updatedPatients[0]
    });
    
  } catch (error) {
    console.error('Error updating patient:', error);
    if (connection) {
      connection.release();
    }
    res.status(500).json({ 
      error: 'Failed to update patient',
      details: error.message 
    });
  }
});

// Delete/Deactivate patient (soft delete)
router.delete('/patients/:patientId', async (req, res) => {
  let connection;
  try {
    const { patientId } = req.params;
    
    connection = await mysqlService.pool.getConnection();
    
    // Check if patient exists
    const [patients] = await connection.execute(
      'SELECT * FROM patients WHERE patient_id = ?',
      [patientId]
    );
    
    if (patients.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    // Soft delete: set is_active = FALSE
    await connection.execute(
      'UPDATE patients SET is_active = FALSE, updated_at = NOW() WHERE patient_id = ?',
      [patientId]
    );
    
    // Also deactivate any doctor-patient assignments
    await connection.execute(
      'DELETE FROM doctor_patients WHERE patient_id = ?',
      [patientId]
    );
    
    // Also deactivate family relationships
    await connection.execute(
      'UPDATE family_patients SET is_active = FALSE WHERE patient_id = ?',
      [patientId]
    );
    
    connection.release();
    
    res.json({
      success: true,
      message: 'Patient deactivated successfully'
    });
    
  } catch (error) {
    console.error('Error deleting patient:', error);
    if (connection) {
      connection.release();
    }
    res.status(500).json({ 
      error: 'Failed to delete patient',
      details: error.message 
    });
  }
});

// ✅ PERBAIKAN: Search patients (dengan backticks untuk condition)
router.get('/patients/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    const connection = await mysqlService.pool.getConnection();
    
    const [patients] = await connection.execute(
      `SELECT * FROM patients 
       WHERE is_active = TRUE 
       AND (
         name LIKE ? OR 
         patient_id LIKE ? OR 
         room LIKE ? OR 
         \`condition\` LIKE ?
       )
       LIMIT 20`,
      [`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`]
    );
    
    connection.release();
    res.json(patients);
  } catch (error) {
    console.error('Error searching patients:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;