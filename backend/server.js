// backend/server.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import hybridMQTTClient from './services/mqtt-client-hybrid.js';
import mysqlRoutes from './routes/mysql-routes.js';
import authRoutes from './routes/auth-routes.js';
import { db } from './services/firebase-admin.js';
import mysqlService from './services/mysql-service.js';
import familyRoutes from './routes/family-routes.js'; // ✅ Sudah ada
import patientRoutes from './routes/patient-routes.js'; // ✅ Sudah ada
import vitalsroutes from './routes/vital-routes.js';
import dashboardroutes from './routes/dashboard-routes.js';
import assignmentroutes from './routes/assignment-routes.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/mysql', mysqlRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/family', familyRoutes); // ✅ Ini sudah benar
app.use('/api/patients', patientRoutes); // ✅ Patient routes dengan path yang sama
app.use('/api/vitals', vitalsroutes); // Vitals service routes
app.use('/api/dashboard', dashboardroutes); // Dashboard service routes
app.use('/api/assignments', assignmentroutes); // Assignment service routes


// Health check
app.get('/health', async (req, res) => {
  try {
    const mysqlHealth = await mysqlService.healthCheck();
    
    await db.collection('health').doc('test').set({
      timestamp: new Date()
    });
    
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      services: {
        mqtt: hybridMQTTClient.isConnected ? 'connected' : 'disconnected',
        mysql: mysqlHealth ? 'connected' : 'disconnected',
        firestore: 'connected'
      }
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      error: error.message 
    });
  }
});

// Start services
console.log('🚀 Starting services...');
hybridMQTTClient.connect();

app.listen(PORT, () => {
  console.log(`🎉 Hybrid Backend Server running on port ${PORT}`);
  console.log(`🔐 Auth API: http://localhost:${PORT}/api/auth`);
  console.log(`📊 MySQL API: http://localhost:${PORT}/api/mysql`);
  console.log(`👨‍👩‍👧‍👦 Family API: http://localhost:${PORT}/api/family`);
  console.log(`👥 Patient API: http://localhost:${PORT}/api/mysql/patients`);
  console.log(`❤️  Health check: http://localhost:${PORT}/health`);
});