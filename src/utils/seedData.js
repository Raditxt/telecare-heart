import { db } from '../services/firebase';
import { collection, addDoc, doc, setDoc } from 'firebase/firestore';

export const seedDummyData = async () => {
  try {
    console.log('🌱 Starting dummy data seeding...');

    // Create Patients
    const patients = [
      {
        id: 'patient1',
        name: 'Budi Santoso',
        email: 'budi@example.com',
        role: 'patient',
        deviceId: 'ESP32-ABC123',
        age: 65,
        status: 'normal',
        lastHR: 72,
        lastSpO2: 98,
        lastTemp: 36.8,
        lastUpdate: new Date(),
        address: 'Jl. Merdeka No. 123, Jakarta',
        phone: '+62 812-3456-7890',
        emergencyContact: 'Ani Santoso (+62 813-9876-5432)',
        medicalNotes: 'Pasien dengan riwayat hipertensi. Monitor tekanan darah secara teratur.',
        createdAt: new Date()
      },
      {
        id: 'patient2', 
        name: 'Siti Rahayu',
        email: 'siti@example.com',
        role: 'patient',
        deviceId: 'ESP32-DEF456',
        age: 58,
        status: 'warning',
        lastHR: 88,
        lastSpO2: 96,
        lastTemp: 37.1,
        lastUpdate: new Date(Date.now() - 10 * 60000), // 10 minutes ago
        address: 'Jl. Sudirman No. 456, Bandung',
        phone: '+62 811-2233-4455',
        emergencyContact: 'Rudi Rahman (+62 817-5566-7788)',
        medicalNotes: 'Pasien diabetes tipe 2. Perhatikan kadar gula darah.',
        createdAt: new Date()
      },
      {
        id: 'patient3',
        name: 'Ahmad Hidayat',
        email: 'ahmad@example.com',
        role: 'patient', 
        deviceId: 'ESP32-GHI789',
        age: 72,
        status: 'critical',
        lastHR: 95,
        lastSpO2: 94,
        lastTemp: 37.8,
        lastUpdate: new Date(Date.now() - 5 * 60000), // 5 minutes ago
        address: 'Jl. Thamrin No. 789, Surabaya',
        phone: '+62 818-9988-7766',
        emergencyContact: 'Maya Hidayat (+62 819-6677-4455)',
        medicalNotes: 'Pasien dengan riwayat jantung. Memerlukan monitoring ketat.',
        createdAt: new Date()
      },
      {
        id: 'patient4',
        name: 'Dewi Lestari',
        email: 'dewi@example.com',
        role: 'patient',
        deviceId: 'ESP32-JKL012',
        age: 45,
        status: 'normal',
        lastHR: 68,
        lastSpO2: 99,
        lastTemp: 36.5,
        lastUpdate: new Date(Date.now() - 15 * 60000),
        address: 'Jl. Gatot Subroto No. 321, Medan',
        phone: '+62 813-4433-2211',
        emergencyContact: 'Budi Lestari (+62 812-1122-3344)',
        medicalNotes: 'Pasien dalam kondisi sehat. Monitoring rutin.',
        createdAt: new Date()
      }
    ];

    // Add patients to Firestore
    console.log('👥 Adding patients...');
    for (const patient of patients) {
      await setDoc(doc(db, 'users', patient.id), patient);
      console.log(`✅ Added patient: ${patient.name}`);
    }

    // Create vitals data
    console.log('❤️ Generating vital signs data...');
    const vitals = [];
    
    // Generate vitals for last 6 hours (every 10 minutes)
    const now = new Date();
    for (let i = 0; i < 36; i++) { // 36 records = 6 hours
      const timestamp = new Date(now.getTime() - i * 10 * 60000); // 10 min intervals
      
      // Patient 1 - Mostly normal with some variations
      const hr1 = Math.floor(Math.random() * 25) + 65; // 65-90 BPM
      const status1 = hr1 > 85 ? 'warning' : 'normal';
      
      vitals.push({
        uid: 'patient1',
        deviceId: 'ESP32-ABC123',
        hr: hr1,
        spo2: Math.floor(Math.random() * 3) + 97, // 97-99%
        temp: 36.5 + (Math.random() * 0.8), // 36.5-37.3°C
        status: status1,
        timestamp: timestamp
      });

      // Patient 2 - More variations, some warnings
      const hr2 = Math.floor(Math.random() * 35) + 60; // 60-95 BPM
      let status2 = 'normal';
      if (hr2 > 90) status2 = 'warning';
      else if (hr2 < 65) status2 = 'warning';
      
      vitals.push({
        uid: 'patient2',
        deviceId: 'ESP32-DEF456', 
        hr: hr2,
        spo2: Math.floor(Math.random() * 5) + 95, // 95-99%
        temp: 36.6 + (Math.random() * 0.9), // 36.6-37.5°C
        status: status2,
        timestamp: new Date(timestamp.getTime() - 30000) // slightly different time
      });

      // Patient 3 - Critical readings mixed with normal
      const hr3 = Math.floor(Math.random() * 50) + 50; // 50-100 BPM  
      let status3 = 'normal';
      if (hr3 > 95 || hr3 < 55) status3 = 'critical';
      else if (hr3 > 85 || hr3 < 60) status3 = 'warning';

      vitals.push({
        uid: 'patient3',
        deviceId: 'ESP32-GHI789',
        hr: hr3,
        spo2: Math.floor(Math.random() * 8) + 92, // 92-99%
        temp: 36.8 + (Math.random() * 1.4), // 36.8-38.2°C
        status: status3,
        timestamp: new Date(timestamp.getTime() - 60000)
      });

      // Patient 4 - Very stable, healthy
      const hr4 = Math.floor(Math.random() * 15) + 65; // 65-80 BPM
      vitals.push({
        uid: 'patient4',
        deviceId: 'ESP32-JKL012',
        hr: hr4,
        spo2: Math.floor(Math.random() * 2) + 98, // 98-99%
        temp: 36.4 + (Math.random() * 0.4), // 36.4-36.8°C
        status: 'normal',
        timestamp: new Date(timestamp.getTime() - 90000)
      });
    }

    // Add vitals to Firestore
    console.log('📊 Adding vital records...');
    for (const vital of vitals) {
      await addDoc(collection(db, 'vitals'), vital);
    }
    
    console.log(`✅ Added ${vitals.length} vital records`);
    console.log('🎉 Dummy data seeding completed!');
    console.log('📋 Summary:');
    console.log(`   - ${patients.length} patients created`);
    console.log(`   - ${vitals.length} vital records created`);
    console.log('🚀 You can now explore the dashboard with real data!');
    
    return {
      patients: patients.length,
      vitals: vitals.length
    };
    
  } catch (error) {
    console.error('❌ Error seeding dummy data:', error);
    throw error;
  }
};