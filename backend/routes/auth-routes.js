// backend/routes/auth-routes.js
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mysqlService from '../services/mysql-service.js';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Helper function untuk handle null/undefined values
function sanitizeData(data) {
  const sanitized = { ...data };
  Object.keys(sanitized).forEach(key => {
    if (sanitized[key] === undefined) {
      sanitized[key] = null;
    }
  });
  return sanitized;
}

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role, phone, specialization, relationship } = req.body;

    console.log('📝 Registration attempt:', { email, name, role });

    // Validate required fields
    if (!email || !password || !name || !role) {
      return res.status(400).json({ error: 'Email, password, name, and role are required' });
    }

    // Check if user already exists
    const connection = await mysqlService.pool.getConnection();
    const [existingUsers] = await connection.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      connection.release();
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Generate user ID
    const userId = generateUserId(role);

    // Sanitize data - convert undefined to null
    const sanitizedData = sanitizeData({
      specialization: role === 'doctor' ? specialization : null,
      relationship: role === 'family' ? relationship : null,
      phone: phone || null
    });

    console.log('💾 Inserting user with data:', {
      userId, email, name, role, 
      phone: sanitizedData.phone,
      specialization: sanitizedData.specialization,
      relationship: sanitizedData.relationship
    });

    // Insert user - langsung await tanpa assign ke variable
    await connection.execute(
      `INSERT INTO users (user_id, email, password_hash, name, role, phone, specialization, relationship) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId, 
        email, 
        passwordHash, 
        name, 
        role, 
        sanitizedData.phone,
        sanitizedData.specialization, 
        sanitizedData.relationship
      ]
    );

    connection.release();

    // Generate token
    const token = jwt.sign(
      { userId, email, role, name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('✅ User registered successfully:', userId);

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        userId,
        email,
        name,
        role,
        phone: sanitizedData.phone,
        specialization: sanitizedData.specialization,
        relationship: sanitizedData.relationship
      },
      token
    });

  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔐 Login attempt:', email);

    const connection = await mysqlService.pool.getConnection();
    const [users] = await connection.execute(
      'SELECT * FROM users WHERE email = ? AND is_active = TRUE',
      [email]
    );

    if (users.length === 0) {
      connection.release();
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      connection.release();
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Get assigned patients based on role
    let assignedPatients = [];
    if (user.role === 'doctor') {
      const [patientRows] = await connection.execute(
        'SELECT patient_id FROM doctor_patients WHERE doctor_id = ?',
        [user.user_id]
      );
      assignedPatients = patientRows.map(row => row.patient_id);
    } else if (user.role === 'family') {
      // 🔥 UPDATE: Query untuk family dengan is_active check
      const [familyPatients] = await connection.execute(
        `SELECT DISTINCT fp.patient_id 
         FROM family_patients fp 
         WHERE fp.family_id = ? AND fp.is_active = TRUE`,
        [user.user_id]
      );
      assignedPatients = familyPatients.map(row => row.patient_id);
    }

    connection.release();

    // Generate token
    const token = jwt.sign(
      { 
        userId: user.user_id, 
        email: user.email, 
        role: user.role, 
        name: user.name 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('✅ Login successful:', {
      userId: user.user_id,
      role: user.role,
      assignedPatientsCount: assignedPatients.length
    });

    res.json({
      user: {
        userId: user.user_id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        specialization: user.specialization,
        relationship: user.relationship,
        assignedPatients
      },
      token
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify token
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Get fresh user data
    const connection = await mysqlService.pool.getConnection();
    const [users] = await connection.execute(
      'SELECT * FROM users WHERE user_id = ? AND is_active = TRUE',
      [decoded.userId]
    );

    if (users.length === 0) {
      connection.release();
      return res.status(401).json({ error: 'User not found' });
    }

    const user = users[0];

    // Get assigned patients
    let assignedPatients = [];
    if (user.role === 'doctor') {
      const [patientRows] = await connection.execute(
        'SELECT patient_id FROM doctor_patients WHERE doctor_id = ?',
        [user.user_id]
      );
      assignedPatients = patientRows.map(row => row.patient_id);
    } else if (user.role === 'family') {
      // 🔥 UPDATE: Query untuk family dengan is_active check (sama seperti login)
      const [familyPatients] = await connection.execute(
        `SELECT DISTINCT fp.patient_id 
         FROM family_patients fp 
         WHERE fp.family_id = ? AND fp.is_active = TRUE`,
        [user.user_id]
      );
      assignedPatients = familyPatients.map(row => row.patient_id);
    }

    connection.release();

    res.json({
      userId: user.user_id,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone,
      specialization: user.specialization,
      relationship: user.relationship,
      assignedPatients
    });

  } catch (error) {
    console.error('❌ Token verification error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Update profile
router.put('/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, phone, specialization, relationship } = req.body;

    // Sanitize data
    const sanitizedData = sanitizeData({
      name, phone, specialization, relationship
    });

    const connection = await mysqlService.pool.getConnection();
    
    await connection.execute(
      `UPDATE users 
       SET name = ?, phone = ?, specialization = ?, relationship = ?, updated_at = NOW()
       WHERE user_id = ?`,
      [sanitizedData.name, sanitizedData.phone, sanitizedData.specialization, sanitizedData.relationship, userId]
    );

    connection.release();

    res.json({ message: 'Profile updated successfully' });

  } catch (error) {
    console.error('❌ Profile update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

function generateUserId(role) {
  const prefix = role === 'doctor' ? 'DOC' : role === 'family' ? 'FAM' : 'ADM';
  const random = Math.random().toString(36).substr(2, 9).toUpperCase();
  return `${prefix}${random}`;
}

export default router;