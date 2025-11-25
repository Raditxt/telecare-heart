// backend/comprehensive-test.js
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const API_BASE = 'http://localhost:3001/api';

async function runTests() {
  console.log('🧪 Starting Comprehensive System Tests...\n');

  try {
    // Test 1: Health Check
    console.log('1. Testing Health Check...');
    const healthResponse = await axios.get(`${API_BASE}/../health`);
    console.log('✅ Health Check:', healthResponse.data.status);
    console.log('   Services:', healthResponse.data.services);

    // Test 2: MySQL Health
    console.log('\n2. Testing MySQL Health...');
    const mysqlHealth = await axios.get(`${API_BASE}/mysql/health`);
    console.log('✅ MySQL Health:', mysqlHealth.data.status);

    // Test 3: Register Doctor
    console.log('\n3. Testing Doctor Registration...');
    const doctorData = {
      name: 'Dr. Test Doctor',
      email: `test.doctor.${Date.now()}@hospital.com`,
      password: 'password123',
      role: 'doctor',
      phone: '+62123456789',
      specialization: 'Cardiologist'
    };

    const doctorReg = await axios.post(`${API_BASE}/auth/register`, doctorData);
    console.log('✅ Doctor Registered:', doctorReg.data.user.userId);

    // Test 4: Register Family
    console.log('\n4. Testing Family Registration...');
    const familyData = {
      name: 'Test Family Member',
      email: `test.family.${Date.now()}@gmail.com`,
      password: 'password123',
      role: 'family',
      phone: '+62123456788',
      relationship: 'son'
    };

    const familyReg = await axios.post(`${API_BASE}/auth/register`, familyData);
    console.log('✅ Family Registered:', familyReg.data.user.userId);

    // Test 5: Login Tests
    console.log('\n5. Testing Login System...');
    
    // Doctor Login
    const doctorLogin = await axios.post(`${API_BASE}/auth/login`, {
      email: doctorData.email,
      password: doctorData.password
    });
    console.log('✅ Doctor Login:', doctorLogin.data.user.role);
    
    const doctorToken = doctorLogin.data.token;

    // Family Login
    const familyLogin = await axios.post(`${API_BASE}/auth/login`, {
      email: familyData.email,
      password: familyData.password
    });
    console.log('✅ Family Login:', familyLogin.data.user.role);

    // Test 6: Patient API Access
    console.log('\n6. Testing Patient API Access...');
    
    // Doctor should access patients
    const doctorPatients = await axios.get(`${API_BASE}/mysql/patients`, {
      headers: { Authorization: `Bearer ${doctorToken}` }
    });
    console.log('✅ Doctor Patients Access:', doctorPatients.data.length, 'patients');

    console.log('\n🎉 ALL TESTS PASSED! System is ready for integration.');

  } catch (error) {
    console.error('❌ Test Failed:', error.response?.data || error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Make sure the backend server is running on port 3001');
      console.log('   Run: npm start in the backend directory');
    }
  }
}

runTests();