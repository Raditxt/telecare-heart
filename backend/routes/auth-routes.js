// backend/routes/auth-routes.js
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mysqlService from '../services/mysql-service.js';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-for-telecare-heart-2024-change-this-in-production';

// ==================== REGISTER ====================
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role, phone } = req.body;

    console.log('📝 Registration attempt:', { email, name, role });

    // Validate required fields
    if (!email || !password || !name || !role) {
      return res.status(400).json({ error: 'Email, password, name, and role are required' });
    }

    // Validate role
    if (!['doctor', 'family'].includes(role)) {
      return res.status(400).json({ error: 'Role must be either "doctor" or "family"' });
    }

    const connection = await mysqlService.pool.getConnection();
    
    // Check if user already exists
    const [existingUsers] = await connection.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      connection.release();
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert user - sesuai dengan struktur tabel Anda
    const [result] = await connection.execute(
      `INSERT INTO users (email, password_hash, name, role, phone) 
       VALUES (?, ?, ?, ?, ?)`,
      [
        email, 
        passwordHash, 
        name, 
        role, 
        phone || null
      ]
    );

    const userId = result.insertId;

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
        id: userId,
        email,
        name,
        role,
        phone: phone || null
      },
      token
    });

  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

// ==================== LOGIN ====================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔐 Login attempt:', email);

    const connection = await mysqlService.pool.getConnection();
    
    // Sesuai struktur tabel - tidak ada is_active di tabel users Anda
    const [users] = await connection.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      connection.release();
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = users[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      connection.release();
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Get assigned patients based on role
    let assignedPatients = [];
    if (user.role === 'doctor') {
      const [patientRows] = await connection.execute(
        'SELECT patient_id FROM doctor_patients WHERE doctor_id = ?',
        [user.id]
      );
      assignedPatients = patientRows.map(row => row.patient_id);
    } else if (user.role === 'family') {
      const [familyPatients] = await connection.execute(
        `SELECT fp.patient_id 
         FROM family_patients fp 
         WHERE fp.family_id = ? AND fp.status = 'active'`,
        [user.id]
      );
      assignedPatients = familyPatients.map(row => row.patient_id);
    }

    connection.release();

    // Generate token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role, 
        name: user.name 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('✅ Login successful:', {
      userId: user.id,
      role: user.role,
      name: user.name
    });

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        assignedPatients
      },
      token
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

// ==================== VERIFY TOKEN ====================
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Get fresh user data
    const connection = await mysqlService.pool.getConnection();
    const [users] = await connection.execute(
      'SELECT * FROM users WHERE id = ?',
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
        [user.id]
      );
      assignedPatients = patientRows.map(row => row.patient_id);
    } else if (user.role === 'family') {
      const [familyPatients] = await connection.execute(
        `SELECT fp.patient_id 
         FROM family_patients fp 
         WHERE fp.family_id = ? AND fp.status = 'active'`,
        [user.id]
      );
      assignedPatients = familyPatients.map(row => row.patient_id);
    }

    connection.release();

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        assignedPatients
      }
    });

  } catch (error) {
    console.error('❌ Token verification error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==================== UPDATE PROFILE ====================
router.put('/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, phone } = req.body;

    // Verify token first
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.userId != userId) {
      return res.status(403).json({ error: 'Unauthorized to update this profile' });
    }

    const connection = await mysqlService.pool.getConnection();
    
    await connection.execute(
      `UPDATE users 
       SET name = ?, phone = ?, updated_at = CURRENT_TIMESTAMP()
       WHERE id = ?`,
      [name, phone || null, userId]
    );

    connection.release();

    res.json({ 
      message: 'Profile updated successfully',
      user: {
        id: userId,
        name,
        phone: phone || null
      }
    });

  } catch (error) {
    console.error('❌ Profile update error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

// ==================== LOGOUT ====================
// Untuk JWT, logout dilakukan di client dengan menghapus token
// Ini hanya endpoint informasi
router.post('/logout', (req, res) => {
  res.json({ message: 'Logout successful. Please remove token from client storage.' });
});

export default router;