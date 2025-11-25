// src/components/SystemTest.jsx
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { patientService } from '../services/patientService';

export default function SystemTest() {
  const { user, login, register } = useAuth();
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const addTestResult = (testName, status, message = '') => {
    setTestResults(prev => [...prev, {
      id: Date.now(),
      name: testName,
      status,
      message,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const runAuthTests = async () => {
    setLoading(true);
    setTestResults([]);

    // Test 1: Register Doctor
    try {
      const doctorResult = await register({
        name: 'Dr. System Test',
        email: `system.test.doctor${Date.now()}@hospital.com`,
        password: 'password123',
        role: 'doctor',
        phone: '+62123456789',
        specialization: 'Cardiologist'
      });

      if (doctorResult.success) {
        addTestResult('Doctor Registration', 'success', 'Doctor account created successfully');
      } else {
        addTestResult('Doctor Registration', 'error', doctorResult.error);
      }
    } catch (error) {
      addTestResult('Doctor Registration', 'error', error.message);
    }

    // Test 2: Register Family
    try {
      const familyResult = await register({
        name: 'Family System Test',
        email: `system.test.family${Date.now()}@gmail.com`,
        password: 'password123',
        role: 'family',
        phone: '+62123456788',
        relationship: 'son'
      });

      if (familyResult.success) {
        addTestResult('Family Registration', 'success', 'Family account created successfully');
      } else {
        addTestResult('Family Registration', 'error', familyResult.error);
      }
    } catch (error) {
      addTestResult('Family Registration', 'error', error.message);
    }

    // Test 3: Login Test
    try {
      const loginResult = await login('test.doctor@hospital.com', 'password123');
      if (loginResult.success) {
        addTestResult('Login System', 'success', 'Login functionality working');
      } else {
        addTestResult('Login System', 'error', loginResult.error);
      }
    } catch (error) {
      addTestResult('Login System', 'error', error.message);
    }

    setLoading(false);
  };

  const runPatientTests = async () => {
    if (!user) return;

    try {
      let patients;
      if (user.role === 'doctor') {
        patients = await patientService.getDoctorPatients(user.userId);
      } else if (user.role === 'family') {
        patients = await patientService.getFamilyPatients(user.userId);
      }

      addTestResult('Patient Data Access', 'success', 
        `Successfully fetched ${patients?.length || 0} patients`
      );
    } catch (error) {
      addTestResult('Patient Data Access', 'error', error.message);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">System Integration Test</h1>
      
      <div className="mb-6 space-x-4">
        <button
          onClick={runAuthTests}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
        >
          {loading ? 'Running Tests...' : 'Run Auth Tests'}
        </button>
        
        <button
          onClick={runPatientTests}
          disabled={!user || loading}
          className="bg-green-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
        >
          Test Patient Access
        </button>
      </div>

      <div className="space-y-3">
        {testResults.map(test => (
          <div
            key={test.id}
            className={`p-4 rounded border ${
              test.status === 'success' 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="font-medium">{test.name}</span>
              <span className={`px-2 py-1 rounded text-xs ${
                test.status === 'success' 
                  ? 'bg-green-200 text-green-800' 
                  : 'bg-red-200 text-red-800'
              }`}>
                {test.status.toUpperCase()}
              </span>
            </div>
            {test.message && (
              <p className="text-sm mt-2 text-gray-600">{test.message}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">{test.timestamp}</p>
          </div>
        ))}
      </div>

      {testResults.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          Click "Run Tests" to start system verification
        </div>
      )}
    </div>
  );
}