// backend/services/mysql-service.js
import mysql from 'mysql2/promise';

class MySQLService {
  constructor() {
    this.pool = null;
    this.init();
  }

  init() {
    try {
      this.pool = mysql.createPool({
        host: process.env.MYSQL_HOST || 'localhost',
        port: process.env.MYSQL_PORT || 3306,
        user: process.env.MYSQL_USER || 'root',
        password: process.env.MYSQL_PASSWORD || '',
        database: process.env.MYSQL_DATABASE || 'telecare_heart',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
        // Hapus configuration options yang tidak valid:
        // acquireTimeout: 60000,    // Tidak valid untuk mysql2
        // timeout: 60000,          // Tidak valid untuk mysql2  
        // reconnect: true          // Tidak valid untuk mysql2
      });

      console.log('✅ MySQL connection pool created');
      this.testConnection();
    } catch (error) {
      console.error('❌ Error creating MySQL pool:', error);
    }
  }

  async testConnection() {
    try {
      const connection = await this.pool.getConnection();
      console.log('✅ MySQL connection test successful');
      connection.release();
    } catch (error) {
      console.error('❌ MySQL connection test failed:', error.message);
    }
  }

  async saveVitals(deviceId, patientId, vitals) {
    const connection = await this.pool.getConnection();
    
    try {
      const [result] = await connection.execute(
        `INSERT INTO vitals (device_id, patient_id, heart_rate, spO2, temperature, battery, status, signal_strength) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          deviceId, 
          patientId, 
          vitals.heartRate, 
          vitals.spO2, 
          vitals.temperature, 
          vitals.battery, 
          vitals.status,
          vitals.signalStrength || -50
        ]
      );
      
      console.log(`✅ Vitals saved to MySQL. ID: ${result.insertId}`);
      return result.insertId;
    } catch (error) {
      console.error('❌ MySQL Error saving vitals:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  async saveECGData(deviceId, patientId, ecgData) {
    const connection = await this.pool.getConnection();
    
    try {
      const [result] = await connection.execute(
        `INSERT INTO ecg_readings (device_id, patient_id, ecg_data, heart_rate, sampling_rate, signal_quality) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          deviceId, 
          patientId, 
          JSON.stringify(ecgData.ecgValues || []), 
          ecgData.heartRate, 
          ecgData.samplingRate || 250,
          ecgData.signalQuality || 'good'
        ]
      );
      
      console.log(`✅ ECG data saved to MySQL. ID: ${result.insertId}`);
      return result.insertId;
    } catch (error) {
      console.error('❌ MySQL Error saving ECG:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  async updateDevice(deviceId, deviceData) {
    const connection = await this.pool.getConnection();
    
    try {
      const [result] = await connection.execute(
        `INSERT INTO devices (device_id, device_name, patient_id, status, battery_level, firmware_version, ip_address) 
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
         device_name = VALUES(device_name),
         patient_id = VALUES(patient_id),
         status = VALUES(status),
         battery_level = VALUES(battery_level),
         firmware_version = VALUES(firmware_version),
         ip_address = VALUES(ip_address),
         last_seen = NOW()`,
        [
          deviceId,
          deviceData.deviceName || `Device_${deviceId}`,
          deviceData.patientId || 'unknown',
          deviceData.status || 'connected',
          deviceData.battery || 100,
          deviceData.firmware || '1.0.0',
          deviceData.ipAddress || 'unknown'
        ]
      );
      
      return result.insertId || result.affectedRows;
    } catch (error) {
      console.error('❌ MySQL Error updating device:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  async getVitals(patientId, limit = 100, hours = 24) {
    const connection = await this.pool.getConnection();
    
    try {
      const [rows] = await connection.execute(
        `SELECT * FROM vitals 
         WHERE patient_id = ? 
         AND created_at >= DATE_SUB(NOW(), INTERVAL ? HOUR)
         ORDER BY created_at DESC 
         LIMIT ?`,
        [patientId, hours, limit]
      );
      
      return rows;
    } catch (error) {
      console.error('❌ MySQL Error fetching vitals:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  async getECGData(patientId, limit = 50) {
    const connection = await this.pool.getConnection();
    
    try {
      const [rows] = await connection.execute(
        `SELECT * FROM ecg_readings 
         WHERE patient_id = ? 
         ORDER BY created_at DESC 
         LIMIT ?`,
        [patientId, limit]
      );
      
      return rows;
    } catch (error) {
      console.error('❌ MySQL Error fetching ECG:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  async getDevices() {
    const connection = await this.pool.getConnection();
    
    try {
      const [rows] = await connection.execute(
        `SELECT * FROM devices ORDER BY last_seen DESC`
      );
      
      return rows;
    } catch (error) {
      console.error('❌ MySQL Error fetching devices:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  async getPatients() {
    const connection = await this.pool.getConnection();
    
    try {
      const [rows] = await connection.execute(
        `SELECT * FROM patients ORDER BY name`
      );
      
      return rows;
    } catch (error) {
      console.error('❌ MySQL Error fetching patients:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  async createAlert(alertData) {
    const connection = await this.pool.getConnection();
    
    try {
      const [result] = await connection.execute(
        `INSERT INTO alerts (patient_id, device_id, type, message) 
         VALUES (?, ?, ?, ?)`,
        [
          alertData.patientId,
          alertData.deviceId,
          alertData.type,
          alertData.message
        ]
      );
      
      return result.insertId;
    } catch (error) {
      console.error('❌ MySQL Error creating alert:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // Health check method
  async healthCheck() {
    try {
      const connection = await this.pool.getConnection();
      const [result] = await connection.execute('SELECT 1 as test');
      connection.release();
      return result[0].test === 1;
    } catch (error) {
      console.error('❌ MySQL Health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
const mysqlService = new MySQLService();
export default mysqlService;