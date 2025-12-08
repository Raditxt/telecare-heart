// backend/websocket/websocket-server.js
import { WebSocketServer } from 'ws';  // Import WebSocketServer bukan WebSocket
import jwt from 'jsonwebtoken';
import mysqlService from '../services/mysql-service.js';

// In-memory storage untuk connected clients
const clients = new Map(); // userId -> { ws, role, patientIds[] }

// In-memory storage untuk room subscriptions
const patientRooms = new Map(); // patientId -> Set(userIds)
const doctorRooms = new Map(); // doctorId -> Set(userIds) untuk broadcast

// Initialize WebSocket server
export function initializeWebSocketServer(server) {
  const wss = new WebSocketServer({ server }); // Sekarang WebSocketServer adalah class
  
  console.log('🚀 WebSocket Server initialized');
  
  wss.on('connection', async (ws, req) => {
    console.log('🔗 New WebSocket connection attempt');
    
    // Extract token from URL query
    const url = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get('token');
    
    if (!token) {
      ws.close(1008, 'Authentication token required');
      return;
    }

    try {
      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.userId;
      const userRole = decoded.role;
      const userName = decoded.name;
      
      console.log(`🔑 User authenticated: ${userId} (${userRole})`);
      
      // Get user's assigned patients
      const connection = await mysqlService.pool.getConnection();
      let assignedPatientIds = [];
      
      if (userRole === 'doctor') {
        const [patients] = await connection.execute(
          'SELECT patient_id FROM doctor_patients WHERE doctor_id = ?',
          [userId]
        );
        assignedPatientIds = patients.map(p => p.patient_id);
      } else if (userRole === 'family') {
        const [patients] = await connection.execute(
          `SELECT patient_id FROM family_patients 
           WHERE family_id = ? AND status = 'active'`,
          [userId]
        );
        assignedPatientIds = patients.map(p => p.patient_id);
      }
      
      connection.release();
      
      // Store client connection
      const clientInfo = {
        ws,
        userId,
        role: userRole,
        name: userName,
        patientIds: assignedPatientIds,
        connectedAt: new Date()
      };
      
      clients.set(userId, clientInfo);
      
      // Subscribe to patient rooms
      assignedPatientIds.forEach(patientId => {
        if (!patientRooms.has(patientId)) {
          patientRooms.set(patientId, new Set());
        }
        patientRooms.get(patientId).add(userId);
      });
      
      // Subscribe doctor to their own room for broadcast
      if (userRole === 'doctor') {
        if (!doctorRooms.has(userId)) {
          doctorRooms.set(userId, new Set());
        }
        doctorRooms.get(userId).add(userId); // Doctor is in their own room
      }
      
      // Send welcome message
      sendToClient(userId, {
        type: 'connection_established',
        message: 'WebSocket connected successfully',
        user: {
          id: userId,
          role: userRole,
          name: userName,
          assigned_patients: assignedPatientIds
        },
        timestamp: new Date().toISOString()
      });
      
      console.log(`✅ WebSocket connected: ${userName} (${userRole}) - Patients: ${assignedPatientIds.length}`);
      
      // Handle incoming messages
      ws.on('message', (message) => {
        handleClientMessage(userId, message);
      });
      
      // Handle connection close
      ws.on('close', () => {
        handleClientDisconnect(userId);
      });
      
      // Handle errors
      ws.on('error', (error) => {
        console.error(`WebSocket error for user ${userId}:`, error);
        handleClientDisconnect(userId);
      });
      
      // Send initial critical alerts if any
      sendInitialCriticalAlerts(userId, userRole, assignedPatientIds);
      
    } catch (error) {
      console.error('WebSocket authentication error:', error);
      ws.close(1008, 'Invalid or expired token');
    }
  });
  
  return wss;
}

// ==================== MESSAGE HANDLING ====================

async function handleClientMessage(userId, rawMessage) {
  try {
    const message = JSON.parse(rawMessage);
    const client = clients.get(userId);
    
    if (!client) return;
    
    console.log(`📨 Message from ${userId}:`, message.type);
    
    switch (message.type) {
      case 'ping':
        sendToClient(userId, { type: 'pong', timestamp: new Date().toISOString() });
        break;
        
      case 'subscribe_patient':
        if (message.patient_id) {
          subscribeToPatient(userId, message.patient_id);
        }
        break;
        
      case 'unsubscribe_patient':
        if (message.patient_id) {
          unsubscribeFromPatient(userId, message.patient_id);
        }
        break;
        
      case 'request_patient_status':
        if (message.patient_id) {
          sendPatientStatusUpdate(message.patient_id);
        }
        break;
        
      case 'acknowledge_alert':
        if (message.alert_id) {
          handleAlertAcknowledgment(userId, message.alert_id, message.patient_id);
        }
        break;
        
      case 'typing':
        // Handle typing indicator in chat (future feature)
        if (message.patient_id && message.is_typing !== undefined) {
          broadcastToPatientSubscribers(message.patient_id, {
            type: 'user_typing',
            user_id: userId,
            user_name: client.name,
            patient_id: message.patient_id,
            is_typing: message.is_typing,
            timestamp: new Date().toISOString()
          }, [userId]); // Don't send to self
        }
        break;
        
      default:
        console.log(`Unknown message type: ${message.type}`);
    }
    
  } catch (error) {
    console.error('Error handling client message:', error);
  }
}

// ==================== UTILITY FUNCTIONS ====================

// Send message to specific client
export function sendToClient(userId, data) {
  const client = clients.get(userId);
  if (client && client.ws.readyState === 1) { // WebSocket.OPEN = 1
    try {
      client.ws.send(JSON.stringify(data));
      return true;
    } catch (error) {
      console.error(`Error sending to client ${userId}:`, error);
    }
  }
  return false;
}

// Broadcast to all subscribers of a patient
export function broadcastToPatientSubscribers(patientId, data, excludeUserIds = []) {
  if (!patientRooms.has(patientId)) return 0;
  
  const subscribers = patientRooms.get(patientId);
  let sentCount = 0;
  
  subscribers.forEach(userId => {
    if (!excludeUserIds.includes(userId)) {
      if (sendToClient(userId, data)) {
        sentCount++;
      }
    }
  });
  
  return sentCount;
}

// Broadcast to all doctors (for system-wide alerts)
export function broadcastToAllDoctors(data, excludeUserIds = []) {
  let sentCount = 0;
  
  clients.forEach((client, userId) => {
    if (client.role === 'doctor' && !excludeUserIds.includes(userId)) {
      if (sendToClient(userId, data)) {
        sentCount++;
      }
    }
  });
  
  return sentCount;
}

// Broadcast to specific doctor's room
export function broadcastToDoctorRoom(doctorId, data, excludeUserIds = []) {
  if (!doctorRooms.has(doctorId)) return 0;
  
  const roomMembers = doctorRooms.get(doctorId);
  let sentCount = 0;
  
  roomMembers.forEach(userId => {
    if (!excludeUserIds.includes(userId)) {
      if (sendToClient(userId, data)) {
        sentCount++;
      }
    }
  });
  
  return sentCount;
}

// Get all connected users
export function getConnectedUsers() {
  const users = [];
  
  clients.forEach((client, userId) => {
    users.push({
      userId,
      name: client.name,
      role: client.role,
      connectedAt: client.connectedAt,
      patientIds: client.patientIds
    });
  });
  
  return users;
}

// Get online doctors
export function getOnlineDoctors() {
  const doctors = [];
  
  clients.forEach((client, userId) => {
    if (client.role === 'doctor') {
      doctors.push({
        userId,
        name: client.name,
        connectedAt: client.connectedAt,
        patientCount: client.patientIds.length
      });
    }
  });
  
  return doctors;
}

// ==================== EVENT HANDLERS ====================

// Handle client disconnect
function handleClientDisconnect(userId) {
  const client = clients.get(userId);
  
  if (client) {
    console.log(`🔌 WebSocket disconnected: ${client.name} (${client.role})`);
    
    // Unsubscribe from all patient rooms
    client.patientIds.forEach(patientId => {
      unsubscribeFromPatient(userId, patientId);
    });
    
    // Remove from doctor room
    if (client.role === 'doctor') {
      doctorRooms.delete(userId);
    }
    
    // Remove client
    clients.delete(userId);
    
    // Notify others about doctor going offline
    if (client.role === 'doctor') {
      broadcastToPatientSubscribersForMultiple(client.patientIds, {
        type: 'doctor_status',
        doctor_id: userId,
        doctor_name: client.name,
        status: 'offline',
        timestamp: new Date().toISOString()
      }, [userId]);
    }
  }
}

// Subscribe client to patient updates
function subscribeToPatient(userId, patientId) {
  const client = clients.get(userId);
  if (!client) return false;
  
  if (!client.patientIds.includes(patientId)) {
    client.patientIds.push(patientId);
  }
  
  if (!patientRooms.has(patientId)) {
    patientRooms.set(patientId, new Set());
  }
  
  patientRooms.get(patientId).add(userId);
  
  console.log(`✅ ${client.name} subscribed to patient ${patientId}`);
  
  return true;
}

// Unsubscribe client from patient updates
function unsubscribeFromPatient(userId, patientId) {
  if (patientRooms.has(patientId)) {
    patientRooms.get(patientId).delete(userId);
    
    // Clean up empty room
    if (patientRooms.get(patientId).size === 0) {
      patientRooms.delete(patientId);
    }
  }
  
  const client = clients.get(userId);
  if (client) {
    const index = client.patientIds.indexOf(patientId);
    if (index > -1) {
      client.patientIds.splice(index, 1);
    }
  }
  
  console.log(`🔕 ${userId} unsubscribed from patient ${patientId}`);
  
  return true;
}

// Send initial critical alerts to new connection
// Send initial critical alerts to new connection
async function sendInitialCriticalAlerts(userId, userRole, patientIds) {
  if (patientIds.length === 0) return;
  
  try {
    const connection = await mysqlService.pool.getConnection();
    
    // Perbaikan: Gunakan parameter yang benar untuk prepared statement
    const [criticalAlerts] = await connection.execute(
      `SELECT 
        v.*,
        p.name as patient_name,
        p.room,
        TIMESTAMPDIFF(MINUTE, v.created_at, NOW()) as minutes_ago
       FROM vitals v
       JOIN patients p ON v.patient_id = p.patient_id
       WHERE v.patient_id IN (${patientIds.map(() => '?').join(',')})
         AND v.status = 'critical'
         AND v.created_at >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)
       ORDER BY v.created_at DESC
       LIMIT 5`,
      patientIds // Parameter array akan di-spread secara otomatis
    );
    
    connection.release();
    
    if (criticalAlerts.length > 0) {
      sendToClient(userId, {
        type: 'initial_critical_alerts',
        alerts: criticalAlerts,
        timestamp: new Date().toISOString()
      });
    }
    
  } catch (error) {
    console.error('Error sending initial alerts:', error);
  }
}

// Handle alert acknowledgment
async function handleAlertAcknowledgment(userId, alertId, patientId) {
  try {
    const client = clients.get(userId);
    if (!client) return;
    
    const connection = await mysqlService.pool.getConnection();
    
    // Log acknowledgment (bisa ditambahkan tabel alerts_log nanti)
    await connection.execute(
      `INSERT INTO alert_acknowledgments 
       (vital_id, acknowledged_by, patient_id, acknowledged_at) 
       VALUES (?, ?, ?, NOW())`,
      [alertId, userId, patientId]
    );
    
    connection.release();
    
    // Notify other subscribers that alert was acknowledged
    broadcastToPatientSubscribers(patientId, {
      type: 'alert_acknowledged',
      alert_id: alertId,
      patient_id: patientId,
      acknowledged_by: userId,
      acknowledged_by_name: client.name,
      timestamp: new Date().toISOString()
    }, [userId]);
    
  } catch (error) {
    console.error('Error handling alert acknowledgment:', error);
  }
}

// Broadcast to multiple patient rooms
function broadcastToPatientSubscribersForMultiple(patientIds, data, excludeUserIds = []) {
  patientIds.forEach(patientId => {
    broadcastToPatientSubscribers(patientId, data, excludeUserIds);
  });
}

// ==================== PUBLIC EVENT TRIGGERS ====================

// Trigger ketika ada data vital baru dari IoT device
export async function triggerNewVitalReading(vitalData) {
  const { patient_id, status, heart_rate, spO2, temperature, created_at } = vitalData;
  
  const eventData = {
    type: 'vital_reading',
    patient_id,
    vital: {
      heart_rate,
      spO2,
      temperature,
      status,
      created_at
    },
    timestamp: new Date().toISOString()
  };
  
  // Broadcast ke semua subscriber patient ini
  const sentCount = broadcastToPatientSubscribers(patient_id, eventData);
  
  // Jika status critical, broadcast juga ke semua dokter yang terhubung
  if (status === 'critical') {
    const criticalEvent = {
      type: 'critical_alert',
      patient_id,
      vital: vitalData,
      urgency: 'high',
      timestamp: new Date().toISOString()
    };
    
    broadcastToAllDoctors(criticalEvent);
  }
  
  console.log(`📊 Vital reading broadcasted for patient ${patient_id} to ${sentCount} clients`);
  
  return sentCount;
}

// Trigger ketika ada assignment baru
export function triggerNewAssignment(assignmentData) {
  const { type, patient_id, doctor_id, family_id, assigned_by } = assignmentData;
  
  const eventData = {
    type: 'assignment_updated',
    assignment_type: type, // 'doctor' atau 'family'
    patient_id,
    doctor_id,
    family_id,
    assigned_by,
    timestamp: new Date().toISOString()
  };
  
  // Broadcast ke patient room
  const sentCount = broadcastToPatientSubscribers(patient_id, eventData);
  
  // Jika assignment dokter, notify dokter tersebut jika online
  if (type === 'doctor' && doctor_id) {
    sendToClient(doctor_id, {
      type: 'new_assignment',
      patient_id,
      assigned_by,
      timestamp: new Date().toISOString()
    });
  }
  
  // Jika assignment family, notify family member jika online
  if (type === 'family' && family_id) {
    sendToClient(family_id, {
      type: 'new_patient_assigned',
      patient_id,
      relationship: assignmentData.relationship,
      assigned_by,
      timestamp: new Date().toISOString()
    });
  }
  
  console.log(`👥 Assignment update broadcasted for patient ${patient_id}`);
  
  return sentCount;
}

// Trigger ketika patient status berubah
export async function triggerPatientStatusChange(patientId, oldStatus, newStatus) {
  const connection = await mysqlService.pool.getConnection();
  
  const [patient] = await connection.execute(
    'SELECT name, room FROM patients WHERE patient_id = ?',
    [patientId]
  );
  
  connection.release();
  
  if (patient.length === 0) return 0;
  
  const patientName = patient[0].name;
  const patientRoom = patient[0].room;
  
  const eventData = {
    type: 'patient_status_change',
    patient_id: patientId,
    patient_name: patientName,
    room: patientRoom,
    old_status: oldStatus,
    new_status: newStatus,
    timestamp: new Date().toISOString()
  };
  
  const sentCount = broadcastToPatientSubscribers(patientId, eventData);
  
  // Jika berubah ke critical, notify semua dokter
  if (newStatus === 'critical') {
    broadcastToAllDoctors({
      ...eventData,
      type: 'critical_status_change',
      urgency: 'high'
    });
  }
  
  console.log(`🔄 Patient status change: ${patientId} (${oldStatus} → ${newStatus})`);
  
  return sentCount;
}

// Trigger manual untuk send patient status update
export async function sendPatientStatusUpdate(patientId) {
  try {
    const connection = await mysqlService.pool.getConnection();
    
    // Get latest vital
    const [latestVital] = await connection.execute(
      `SELECT * FROM vitals 
       WHERE patient_id = ? 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [patientId]
    );
    
    // Get patient info
    const [patient] = await connection.execute(
      'SELECT * FROM patients WHERE patient_id = ?',
      [patientId]
    );
    
    connection.release();
    
    if (latestVital.length === 0 || patient.length === 0) return;
    
    const eventData = {
      type: 'patient_status_update',
      patient_id: patientId,
      patient: patient[0],
      latest_vital: latestVital[0],
      timestamp: new Date().toISOString()
    };
    
    broadcastToPatientSubscribers(patientId, eventData);
    
  } catch (error) {
    console.error('Error sending patient status update:', error);
  }
}

// Trigger system notification
export function triggerSystemNotification(message, level = 'info', target = 'all') {
  const eventData = {
    type: 'system_notification',
    level, // info, warning, error
    message,
    timestamp: new Date().toISOString()
  };
  
  let sentCount = 0;
  
  switch (target) {
    case 'all':
      clients.forEach((client, userId) => {
        if (sendToClient(userId, eventData)) sentCount++;
      });
      break;
      
    case 'doctors':
      sentCount = broadcastToAllDoctors(eventData);
      break;
      
    case 'families':
      clients.forEach((client, userId) => {
        if (client.role === 'family' && sendToClient(userId, eventData)) {
          sentCount++;
        }
      });
      break;
      
    default:
      if (clients.has(target)) {
        if (sendToClient(target, eventData)) sentCount = 1;
      }
  }
  
  console.log(`📢 System notification sent to ${sentCount} clients: ${message}`);
  
  return sentCount;
}