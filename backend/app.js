// backend/app.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';

// Import services
import hybridMQTTClient from './services/mqtt-client-hybrid.js';
import mysqlService from './services/mysql-service.js';

// Import routes
import mysqlRoutes from './routes/mysql-routes.js';
import authRoutes from './routes/auth-routes.js';
import familyRoutes from './routes/family-routes.js';
import patientRoutes from './routes/patient-routes.js';
import vitalRoutes from './routes/vital-routes.js';
import dashboardRoutes from './routes/dashboard-routes.js';
import assignmentRoutes from './routes/assignment-routes.js';

// Import WebSocket server
import { initializeWebSocketServer } from './websocket/websocket-server.js';

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3001;

// Initialize WebSocket server
initializeWebSocketServer(server);

// Middleware
app.use(cors());
app.use(express.json());

// Basic route
app.get('/', (req, res) => {
  res.json({
    message: 'Telecare Heart Backend API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      patients: '/api/patients',
      vitals: '/api/vitals',
      health: '/health',
      websocket: '/websocket-info'
    }
  });
});

// Routes
app.use('/api/mysql', mysqlRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/family', familyRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/vitals', vitalRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/assignments', assignmentRoutes);

// Health check
app.get('/health', async (req, res) => {
  try {
    const mysqlHealth = await mysqlService.healthCheck();
    
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      services: {
        mqtt: hybridMQTTClient.isConnected ? 'connected' : 'disconnected',
        mysql: mysqlHealth ? 'connected' : 'disconnected',
        websocket: 'active'
      }
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      error: error.message 
    });
  }
});

// WebSocket endpoint info
app.get('/websocket-info', (req, res) => {
  res.json({
    websocket_url: `ws://localhost:${PORT}`,
    available_events: [
      'vital_reading',
      'patient_status_change',
      'critical_alert',
      'assignment_updated'
    ],
    connection_instructions: 'Connect with JWT token in query: ws://localhost:3001/?token=YOUR_JWT_TOKEN'
  });
});

// Start services
console.log('🚀 Starting services...');
hybridMQTTClient.connect();

// Use server.listen instead of app.listen
server.listen(PORT, () => {
  console.log(`🎉 Backend Server running on port ${PORT}`);
  console.log(`🔐 Auth API: http://localhost:${PORT}/api/auth`);
  console.log(`👨‍👩‍👧‍👦 Family API: http://localhost:${PORT}/api/family`);
  console.log(`👥 Patient API: http://localhost:${PORT}/api/patients`);
  console.log(`❤️  Vitals API: http://localhost:${PORT}/api/vitals`);
  console.log(`📈 Dashboard API: http://localhost:${PORT}/api/dashboard`);
  console.log(`🔗 Assignments API: http://localhost:${PORT}/api/assignments`);
  console.log(`🌐 WebSocket: ws://localhost:${PORT}/?token=YOUR_JWT_TOKEN`);
  console.log(`💓 Health check: http://localhost:${PORT}/health`);
  console.log(`🏠 Home: http://localhost:${PORT}/`);
});