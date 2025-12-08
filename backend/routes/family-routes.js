import express from 'express';
import mysqlService from '../services/mysql-service.js';

const router = express.Router();

const authenticateJWT = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication token required' });
    }

    const jwt = await import('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// GET family's assigned patients
router.get('/patients', authenticateJWT, async (req, res) => {
  try {
    const { userId, role } = req.user;
    
    if (role !== 'family') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const connection = await mysqlService.pool.getConnection();
    
    const [patients] = await connection.execute(
      `SELECT 
        p.*,
        fp.relationship,
        fp.status as assignment_status,
        fp.assigned_at,
        u.name as assigned_by_name
       FROM patients p
       JOIN family_patients fp ON p.patient_id = fp.patient_id
       JOIN users u ON fp.assigned_by = u.id
       WHERE fp.family_id = ? AND fp.status = 'active'
       ORDER BY fp.assigned_at DESC`,
      [userId]
    );

    connection.release();

    res.json({
      patients,
      total: patients.length
    });

  } catch (error) {
    console.error('Get family patients error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET family member's own profile
router.get('/profile', authenticateJWT, async (req, res) => {
  try {
    const { userId, role } = req.user;
    
    if (role !== 'family') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const connection = await mysqlService.pool.getConnection();
    
    const [users] = await connection.execute(
      `SELECT 
        id, email, name, phone, role,
        (SELECT COUNT(*) FROM family_patients WHERE family_id = ? AND status = 'active') as patient_count
       FROM users 
       WHERE id = ?`,
      [userId, userId]
    );

    if (users.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'User not found' });
    }

    connection.release();

    res.json(users[0]);

  } catch (error) {
    console.error('Get family profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// UPDATE family member's own profile
router.put('/profile', authenticateJWT, async (req, res) => {
  try {
    const { userId, role } = req.user;
    const { name, phone } = req.body;
    
    if (role !== 'family') {
      return res.status(403).json({ error: 'Access denied' });
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
    console.error('Update family profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET family member's notifications/alerts
router.get('/alerts', authenticateJWT, async (req, res) => {
  try {
    const { userId, role } = req.user;
    
    if (role !== 'family') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { limit = 20 } = req.query;

    const connection = await mysqlService.pool.getConnection();
    
    // Get alerts for family's patients
    const [alerts] = await connection.execute(
      `SELECT 
        v.*,
        p.name as patient_name,
        p.room,
        TIMESTAMPDIFF(MINUTE, v.created_at, NOW()) as minutes_ago
       FROM vitals v
       JOIN patients p ON v.patient_id = p.patient_id
       WHERE p.patient_id IN (
         SELECT patient_id FROM family_patients 
         WHERE family_id = ? AND status = 'active'
       )
       AND v.status IN ('critical', 'warning')
       AND v.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
       ORDER BY v.created_at DESC
       LIMIT ?`,
      [userId, parseInt(limit)]
    );

    // Get unread count
    const [unreadCount] = await connection.execute(
      `SELECT COUNT(*) as count
       FROM vitals v
       WHERE v.patient_id IN (
         SELECT patient_id FROM family_patients 
         WHERE family_id = ? AND status = 'active'
       )
       AND v.status IN ('critical', 'warning')
       AND v.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
       AND v.created_at > COALESCE(
         (SELECT last_seen_at FROM user_notifications WHERE user_id = ?),
         DATE_SUB(NOW(), INTERVAL 25 HOUR)
       )`,
      [userId, userId]
    );

    connection.release();

    res.json({
      alerts,
      unread_count: unreadCount[0]?.count || 0,
      total: alerts.length
    });

  } catch (error) {
    console.error('Get family alerts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// MARK alerts as read
router.post('/alerts/read', authenticateJWT, async (req, res) => {
  try {
    const { userId, role } = req.user;
    
    if (role !== 'family') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const connection = await mysqlService.pool.getConnection();
    
    // Update or insert last seen timestamp
    await connection.execute(
      `INSERT INTO user_notifications (user_id, last_seen_at) 
       VALUES (?, NOW()) 
       ON DUPLICATE KEY UPDATE last_seen_at = NOW()`,
      [userId]
    );

    connection.release();

    res.json({ 
      message: 'Alerts marked as read',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Mark alerts read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;