// backend/server.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import hybridMQTTClient from './services/mqtt-client-hybrid.js';
import mysqlRoutes from './routes/mysql-routes.js';
import { db } from './services/firebase-admin.js';
import mysqlService from './services/mysql-service.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/mysql', mysqlRoutes);

// Health check dengan status semua services
app.get('/health', async (req, res) => {
  try {
    const mysqlHealth = await mysqlService.healthCheck();
    
    // Test Firestore connection
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
  console.log(`📊 MySQL API: http://localhost:${PORT}/api/mysql`);
  console.log(`❤️  Health check: http://localhost:${PORT}/health`);
  console.log(`🔌 MQTT: ${hybridMQTTClient.isConnected ? 'Connected' : 'Connecting...'}`);
});