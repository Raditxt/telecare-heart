// backend/test-mysql.js
import 'dotenv/config';
import mysqlService from './services/mysql-service.js';

async function testMySQL() {
  console.log('🧪 Testing MySQL Connection...');
  
  try {
    // Test connection
    const isHealthy = await mysqlService.healthCheck();
    console.log('✅ MySQL Connection:', isHealthy ? 'HEALTHY' : 'UNHEALTHY');
    
    // Test getting patients
    const patients = await mysqlService.getPatients();
    console.log('✅ Patients count:', patients.length);
    
    // Test getting devices
    const devices = await mysqlService.getDevices();
    console.log('✅ Devices count:', devices.length);
    
    // Test inserting sample vitals
    const sampleVitals = {
      heartRate: 75,
      spO2: 97,
      temperature: 36.9,
      battery: 90,
      status: 'normal',
      signalStrength: -60
    };
    
    const vitalId = await mysqlService.saveVitals('TEST_DEVICE', 'PATIENT_001', sampleVitals);
    console.log('✅ Sample vitals inserted. ID:', vitalId);
    
    console.log('🎉 All MySQL tests passed!');
    
  } catch (error) {
    console.error('❌ MySQL test failed:', error.message);
  }
}

testMySQL();