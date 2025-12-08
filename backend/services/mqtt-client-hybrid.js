// backend/services/mqtt-client-hybrid.js
import mqtt from 'mqtt';
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
      // Save to MySQL untuk historical data
      await mysqlService.saveVitals(deviceId, vitalData.patientId, vitalData);
      
      // Check for alerts
      await this.checkAlerts(vitalData);
      
      console.log(`✅ Vitals saved to MySQL for ${deviceId}`);
    } catch (error) {
      console.error('❌ Error processing vitals:', error);
    }
  }

  async processECGData(deviceId, data) {
    try {
      // ECG data langsung ke MySQL
      await mysqlService.saveECGData(deviceId, data.patientId, data);
      console.log(`✅ ECG data saved to MySQL for ${deviceId}`);
    } catch (error) {
      console.error('❌ Error processing ECG data:', error);
    }
  }

  async processDeviceStatus(deviceId, data) {
    const deviceData = {
      deviceId,
      deviceName: data.deviceName || `Device_${deviceId}`,
      patientId: data.patientId || 'unknown',
      status: data.status || 'connected',
      battery: data.battery,
      firmware: data.firmware || '1.0.0',
      ipAddress: data.ipAddress,
      lastSeen: new Date()
    };

    try {
      // Device status simpan di MySQL
      await mysqlService.updateDevice(deviceId, deviceData);
      console.log(`✅ Device status updated in MySQL: ${deviceId}`);
    } catch (error) {
      console.error('❌ Error updating device status:', error);
    }
  }

  async checkAlerts(vitalData) {
    if (vitalData.status === 'critical' || vitalData.status === 'warning') {
      const alertData = {
        patientId: vitalData.patientId,
        deviceId: vitalData.deviceId,
        type: vitalData.status,
        message: this.generateAlertMessage(vitalData),
        timestamp: new Date()
      };

      try {
        await mysqlService.createAlert(alertData);
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
    if (this.isConnected && this.client) {
      this.client.publish(topic, JSON.stringify(message));
      return true;
    } else {
      console.error('❌ Cannot publish - MQTT not connected');
      return false;
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

// Export singleton instance
const hybridMQTTClient = new HybridMQTTClient();
export default hybridMQTTClient;