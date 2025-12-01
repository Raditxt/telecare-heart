import express from 'express';
import mysqlService from '../services/mysql-service.js';

const router = express.Router();

// Assign family to patient (Doctor only)
router.post('/assign-family', async (req, res) => {
  try {
    const { doctorId, familyEmail, patientId, relationship } = req.body;

    const connection = await mysqlService.pool.getConnection();
    
    // 1. Cari user family berdasarkan email
    const [familyUsers] = await connection.execute(
      'SELECT user_id FROM users WHERE email = ? AND role = "family"',
      [familyEmail]
    );

    if (familyUsers.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Family user not found' });
    }

    const familyId = familyUsers[0].user_id;

    // 2. Cek apakah relasi sudah ada
    const [existing] = await connection.execute(
      'SELECT * FROM family_patients WHERE family_id = ? AND patient_id = ?',
      [familyId, patientId]
    );

    if (existing.length > 0) {
      connection.release();
      return res.status(400).json({ error: 'Family already assigned to this patient' });
    }

    // 3. Buat relasi
    await connection.execute(
      'INSERT INTO family_patients (family_id, patient_id, relationship, assigned_by) VALUES (?, ?, ?, ?)',
      [familyId, patientId, relationship, doctorId]
    );

    connection.release();
    
    res.json({ 
      success: true, 
      message: 'Family assigned successfully',
      familyId,
      relationship 
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get family members for a patient (Doctor & Family)
router.get('/patients/:patientId/families', async (req, res) => {
  try {
    const { patientId } = req.params;
    const connection = await mysqlService.pool.getConnection();
    
    // ✅ PERBAIKAN: Hapus kondisi fp.is_active = TRUE karena kolom tidak ada
    const [families] = await connection.execute(
      `SELECT 
        fp.family_id,
        u.name as family_name,
        u.email as family_email,
        u.phone as family_phone,
        fp.relationship,
        fp.assigned_at,
        d.name as assigned_by_doctor
       FROM family_patients fp
       INNER JOIN users u ON fp.family_id = u.user_id
       LEFT JOIN users d ON fp.assigned_by = d.user_id
       WHERE fp.patient_id = ?  -- Hapus: AND fp.is_active = TRUE
       ORDER BY fp.assigned_at DESC`,
      [patientId]
    );
    
    connection.release();
    res.json(families);
  } catch (error) {
    console.error('Error getting patient families:', error);
    res.status(500).json({ 
      error: 'Failed to get family members',
      details: error.message 
    });
  }
});

// Remove family access (Doctor only)
router.delete('/families/:familyId/patients/:patientId', async (req, res) => {
  try {
    const { familyId, patientId } = req.params;
    const connection = await mysqlService.pool.getConnection();
    
    // ✅ PERBAIKAN: Karena tidak ada kolom is_active, gunakan DELETE langsung
    await connection.execute(
      'DELETE FROM family_patients WHERE family_id = ? AND patient_id = ?',
      [familyId, patientId]
    );
    
    connection.release();
    res.json({ 
      success: true,
      message: 'Family access removed successfully' 
    });
  } catch (error) {
    console.error('Error removing family access:', error);
    res.status(500).json({ 
      error: 'Failed to remove family access',
      details: error.message 
    });
  }
});

// ✅ TAMBAHKAN: Endpoint untuk mendapatkan semua family users (untuk dropdown/autocomplete)
router.get('/users', async (req, res) => {
  try {
    const connection = await mysqlService.pool.getConnection();
    
    const [users] = await connection.execute(
      `SELECT user_id, name, email, phone 
       FROM users 
       WHERE role = 'family' AND is_active = TRUE
       ORDER BY name ASC`
    );
    
    connection.release();
    res.json(users);
  } catch (error) {
    console.error('Error getting family users:', error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ TAMBAHKAN: Endpoint untuk mendapatkan family assignments by family ID
router.get('/families/:familyId/assignments', async (req, res) => {
  try {
    const { familyId } = req.params;
    const connection = await mysqlService.pool.getConnection();
    
    const [assignments] = await connection.execute(
      `SELECT 
        fp.patient_id,
        p.name as patient_name,
        p.room,
        p.condition,
        fp.relationship,
        fp.assigned_at,
        d.name as assigned_by_doctor
       FROM family_patients fp
       INNER JOIN patients p ON fp.patient_id = p.patient_id
       LEFT JOIN users d ON fp.assigned_by = d.user_id
       WHERE fp.family_id = ?
       ORDER BY fp.assigned_at DESC`,
      [familyId]
    );
    
    connection.release();
    res.json(assignments);
  } catch (error) {
    console.error('Error getting family assignments:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;