// backend/routes/patient-routes.js
const express = require('express');
const mysqlService = require('../services/mysql-service');
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

// Get doctor's patients
router.get('/patients/doctor/:doctorId', async (req, res) => {
  try {
    const { doctorId } = req.params;
    const connection = await mysqlService.pool.getConnection();
    
    const [patients] = await connection.execute(
      `SELECT p.* FROM patients p
       INNER JOIN doctor_patients dp ON p.patient_id = dp.patient_id
       WHERE dp.doctor_id = ?`,
      [doctorId]
    );
    
    connection.release();
    res.json(patients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get family's patients
router.get('/patients/family/:familyId', async (req, res) => {
  try {
    const { familyId } = req.params;
    const connection = await mysqlService.pool.getConnection();
    
    const [patients] = await connection.execute(
      `SELECT p.*, fp.relationship 
       FROM patients p
       INNER JOIN family_patients fp ON p.patient_id = fp.patient_id
       WHERE fp.family_id = ?`,
      [familyId]
    );
    
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
      'SELECT * FROM patients WHERE patient_id = ?',
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

// Assign patient to doctor
router.post('/patients/assign', async (req, res) => {
  try {
    const { doctorId, patientId } = req.body;
    const connection = await mysqlService.pool.getConnection();
    
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
      'SELECT * FROM family_patients WHERE family_id = ? AND patient_id = ?',
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

module.exports = router;