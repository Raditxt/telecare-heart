// backend/services/mqtt-client-hybrid.js
import mqtt from 'mqtt';
import { db } from './firebase-admin.js';
import mysqlService from './mysql-service.js';

class HybridMQTTClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  connect() {
    console.log('🔌 Connecting to MQTT Broker...');
    console.log('MQTT Config:', {
      host: process.env.MQTT_BROKER,
      port: process.env.MQTT_PORT,
      username: process.env.MQTT_USERNAME,
      password: process.env.MQTT_PASSWORD ? '***' : 'missing'
    });

    const options = {
      host: process.env.MQTT_BROKER,
      port: parseInt(process.env.MQTT_PORT),
      username: process.env.MQTT_USERNAME,
      password: process.env.MQTT_PASSWORD,
      protocol: 'mqtts',
      rejectUnauthorized: false,
      connectTimeout: 10000,
      reconnectPeriod: 5000,
      clientId: `telecare-server-${Math.random().toString(16).slice(2)}`
    };

    this.client = mqtt.connect(options);

    this.client.on('connect', () => {
      console.log('✅ Connected to MQTT Broker');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      // Subscribe to topics
      const topics = [
        'telecare/+/vitals',
        'telecare/+/ecg', 
        'telecare/+/status'
      ];
      
      this.client.subscribe(topics, (err) => {
        if (err) {
          console.error('❌ MQTT Subscribe error:', err);
        } else {
          console.log('✅ Subscribed to topics:', topics);
        }
      });
    });

    this.client.on('message', (topic, message) => {
      this.handleMessage(topic, message.toString());
    });

    this.client.on('error', (error) => {
      console.error('❌ MQTT Error:', error.message);
      this.isConnected = false;
    });

    this.client.on('close', () => {
      console.log('🔌 MQTT Connection closed');
      this.isConnected = false;
    });

    this.client.on('offline', () => {
      console.log('🔌 MQTT Client offline');
      this.isConnected = false;
    });

    this.client.on('reconnect', () => {
      this.reconnectAttempts++;
      console.log(`🔄 MQTT Reconnecting... (Attempt ${this.reconnectAttempts})`);
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('❌ Max reconnection attempts reached. Stopping MQTT client.');
        this.client.end();
      }
    });
  }

  async handleMessage(topic, message) {
    try {
      const data = JSON.parse(message);
      const deviceId = topic.split('/')[1];
      
      console.log(`📨 Received from ${deviceId}:`, data.type || 'vitals');

      switch (true) {
        case topic.includes('vitals'):
          await this.processVitalsData(deviceId, data);
          break;
        
        case topic.includes('ecg'):
          await this.processECGData(deviceId, data);
          break;
        
        case topic.includes('status'):
          await this.processDeviceStatus(deviceId, data);
          break;
      }
    } catch (error) {
      console.error('❌ Error processing message:', error);
    }
  }

  async processVitalsData(deviceId, data) {
    const vitalData = {
      deviceId,
      patientId: data.patientId || 'unknown',
      heartRate: data.heartRate,
      spO2: data.spO2,
      temperature: data.temperature,
      battery: data.battery,
      signalStrength: data.signalStrength,
      status: this.determineVitalStatus(data),
      timestamp: new Date()
    };

    try {
      // 1. Save to MySQL untuk historical data (primary storage)
      await mysqlService.saveVitals(deviceId, data.patientId, vitalData);
      
      // 2. Save to Firestore untuk real-time dashboard (latest data only)
      await this.updateRealtimeVitals(deviceId, vitalData);
      
      // 3. Check for alerts
      await this.checkAlerts(vitalData);
      
      console.log(`✅ Vitals processed - MySQL (historical) + Firestore (real-time)`);
    } catch (error) {
      console.error('❌ Error processing vitals:', error);
    }
  }

  async processECGData(deviceId, data) {
    try {
      // ECG data langsung ke MySQL saja (karena data besar)
      await mysqlService.saveECGData(deviceId, data.patientId, data);
      console.log(`✅ ECG data saved to MySQL for ${deviceId}`);
      
      // Jika butuh real-time ECG features, bisa extract metrics ringan
      if (data.ecgValues && data.ecgValues.length > 0) {
        const ecgMetrics = {
          deviceId,
          patientId: data.patientId,
          heartRate: this.calculateHeartRateFromECG(data.ecgValues),
          signalQuality: this.assessSignalQuality(data.ecgValues),
          timestamp: new Date()
        };
        
        // Simpan metrics ringan ke Firestore untuk real-time display
        await db.collection('ecg_metrics').add(ecgMetrics);
      }
    } catch (error) {
      console.error('❌ Error processing ECG data:', error);
    }
  }

  async processDeviceStatus(deviceId, data) {
    const deviceData = {
      deviceId,
      name: data.deviceName || `Device_${deviceId}`,
      status: data.status || 'connected',
      firmware: data.firmware || '1.0.0',
      lastSeen: new Date(),
      battery: data.battery,
      ipAddress: data.ipAddress,
      wifiStrength: data.wifiStrength,
      patientId: data.patientId || 'unknown'
    };

    try {
      // Device status simpan di Firestore untuk real-time monitoring
      await db.collection('devices').doc(deviceId).set(deviceData, { merge: true });
      console.log(`✅ Device status updated in Firestore: ${deviceId}`);
    } catch (error) {
      console.error('❌ Error updating device status:', error);
    }
  }

  async updateRealtimeVitals(deviceId, vitalData) {
    try {
      // Update latest vitals untuk real-time dashboard
      await db.collection('vitals_realtime').doc(deviceId).set(vitalData);
      
      // Update patient's current status
      if (vitalData.patientId && vitalData.patientId !== 'unknown') {
        await db.collection('patients').doc(vitalData.patientId).set({
          lastVitals: vitalData,
          lastUpdate: new Date(),
          status: vitalData.status
        }, { merge: true });
      }
    } catch (error) {
      console.error('❌ Error updating realtime vitals:', error);
    }
  }

  async checkAlerts(vitalData) {
    if (vitalData.status === 'critical' || vitalData.status === 'warning') {
      const alertData = {
        patientId: vitalData.patientId,
        deviceId: vitalData.deviceId,
        type: vitalData.status,
        message: this.generateAlertMessage(vitalData),
        timestamp: new Date(),
        resolved: false,
        vitalData: {
          heartRate: vitalData.heartRate,
          spO2: vitalData.spO2,
          temperature: vitalData.temperature
        }
      };

      try {
        await db.collection('alerts').add(alertData);
        console.log(`🚨 Alert created: ${alertData.message}`);
      } catch (error) {
        console.error('❌ Error creating alert:', error);
      }
    }
  }

  generateAlertMessage(vitalData) {
    const issues = [];
    
    if (vitalData.heartRate > 120 || vitalData.heartRate < 50) {
      issues.push(`Heart rate ${vitalData.heartRate} BPM`);
    }
    if (vitalData.spO2 < 95) {
      issues.push(`SpO2 ${vitalData.spO2}%`);
    }
    if (vitalData.temperature > 37.5) {
      issues.push(`Temperature ${vitalData.temperature}°C`);
    }
    
    return `Critical vitals: ${issues.join(', ')}`;
  }

  calculateHeartRateFromECG(ecgValues) {
    if (!ecgValues || ecgValues.length === 0) return 72;
    
    const avgValue = ecgValues.reduce((sum, val) => sum + Math.abs(val), 0) / ecgValues.length;
    return Math.round(60 + (avgValue * 10));
  }

  assessSignalQuality(ecgValues) {
    if (!ecgValues || ecgValues.length === 0) return 'poor';
    
    const noiseLevel = this.calculateNoiseLevel(ecgValues);
    return noiseLevel < 0.1 ? 'good' : noiseLevel < 0.3 ? 'fair' : 'poor';
  }

  calculateNoiseLevel(ecgValues) {
    if (!ecgValues || ecgValues.length < 2) return 0.5;
    
    const mean = ecgValues.reduce((sum, val) => sum + val, 0) / ecgValues.length;
    const variance = ecgValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / ecgValues.length;
    
    return Math.min(variance / 100, 1);
  }

  determineVitalStatus(data) {
    const { heartRate, spO2, temperature } = data;
    
    if (heartRate > 120 || heartRate < 50 || spO2 < 90 || temperature > 38.5) {
      return 'critical';
    } else if (heartRate > 100 || heartRate < 60 || spO2 < 95 || temperature > 37.5) {
      return 'warning';
    }
    return 'normal';
  }

  publish(topic, message) {
    if (this.isConnected) {
      this.client.publish(topic, JSON.stringify(message));
    } else {
      console.error('❌ Cannot publish - MQTT not connected');
    }
  }

  disconnect() {
    if (this.client) {
      this.client.end();
      this.isConnected = false;
      console.log('🔌 MQTT Client disconnected');
    }
  }
}

// Export instance sebagai default
const mqttClient = new HybridMQTTClient();
export default mqttClient;