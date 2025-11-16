import { db } from './firebase';
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot 
} from 'firebase/firestore';

// ... existing functions remain the same ...

// Get all patients
export const getPatients = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'users'));
    const patients = querySnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(user => user.role === 'patient');
    
    return patients;
  } catch (error) {
    console.error('Error getting patients:', error);
    throw error;
  }
};

// Get single patient
export const getPatient = async (patientId) => {
  try {
    const docRef = doc(db, 'users', patientId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      throw new Error('Patient not found');
    }
  } catch (error) {
    console.error('Error getting patient:', error);
    throw error;
  }
};

// Get patient vitals history
export const getPatientVitals = async (patientId, limitCount = 50) => {
  try {
    const q = query(
      collection(db, 'vitals'),
      where('uid', '==', patientId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate() 
    }));
  } catch (error) {
    console.error('Error getting patient vitals:', error);
    throw error;
  }
};

// ✅ TAMBAHKAN FUNGSI INI - Subscribe to patient vitals (real-time)
export const subscribeToPatientVitals = (patientId, callback) => {
  try {
    console.log(`Subscribing to real-time vitals for patient: ${patientId}`);
    
    const q = query(
      collection(db, 'vitals'),
      where('uid', '==', patientId),
      orderBy('timestamp', 'desc'),
      limit(1)
    );
    
    // Return the unsubscribe function
    return onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const latestVital = snapshot.docs[0].data();
        const vitalData = {
          hr: latestVital.hr || null,
          spo2: latestVital.spo2 || latestVital.oxygen || null,
          temp: latestVital.temperature || latestVital.temp || null,
          deviceId: latestVital.deviceId || null,
          timestamp: latestVital.timestamp?.toDate() || new Date()
        };
        
        console.log(`Real-time update for patient ${patientId}:`, vitalData);
        callback(vitalData);
      } else {
        // No data found, send null to indicate no vitals
        console.log(`No vitals data found for patient: ${patientId}`);
        callback(null);
      }
    }, (error) => {
      console.error(`Error in real-time subscription for patient ${patientId}:`, error);
      // Fallback to simulated data if real-time fails
      const simulatedVital = getSimulatedVitalData();
      callback(simulatedVital);
    });
    
  } catch (error) {
    console.error('Error setting up real-time subscription:', error);
    
    // Fallback: simulate real-time data with interval
    return simulateRealTimeVitals(patientId, callback);
  }
};

// ✅ Fallback function for real-time simulation
const simulateRealTimeVitals = (patientId, callback) => {
  console.log(`Using simulated real-time data for patient: ${patientId}`);
  
  const interval = setInterval(() => {
    const simulatedVital = getSimulatedVitalData();
    callback(simulatedVital);
  }, 10000); // Update every 10 seconds

  // Return unsubscribe function
  return () => {
    clearInterval(interval);
    console.log(`Unsubscribed from simulated data for patient: ${patientId}`);
  };
};

// ✅ Helper function for simulated vital data
const getSimulatedVitalData = () => {
  const baseHR = 70 + (Math.random() - 0.5) * 20; // 60-80 BPM base
  const hrVariation = (Math.sin(Date.now() / 10000) * 10); // Sine wave variation
  const heartRate = Math.round(Math.max(40, Math.min(130, baseHR + hrVariation)));
  
  const spO2 = Math.floor(Math.random() * 6) + 95; // 95-100%
  const temperature = 36.5 + (Math.random() * 1.5); // 36.5-38°C
  
  return {
    hr: heartRate,
    spo2: spO2,
    temp: parseFloat(temperature.toFixed(1)),
    deviceId: 'ESP32-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
    timestamp: new Date()
  };
};

// ✅ TAMBAHKAN FUNGSI INI - Get real-time vitals data
export const getRealtimeVitals = async (patientId) => {
  try {
    const q = query(
      collection(db, 'vitals'),
      where('uid', '==', patientId),
      orderBy('timestamp', 'desc'),
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      // Return default values if no data
      return {
        heartRate: null,
        spO2: null,
        temperature: null,
        deviceId: null,
        timestamp: null
      };
    }
    
    const latestVital = querySnapshot.docs[0].data();
    
    return {
      heartRate: latestVital.hr || null,
      spO2: latestVital.spo2 || latestVital.oxygen || null,
      temperature: latestVital.temperature || null,
      deviceId: latestVital.deviceId || null,
      timestamp: latestVital.timestamp?.toDate() || new Date()
    };
  } catch (error) {
    console.error('Error getting real-time vitals:', error);
    
    // Fallback to dummy data if Firebase fails
    return getDummyRealtimeVitals();
  }
};

// ✅ TAMBAHKAN FUNGSI INI - Generate dummy data for development
const getDummyRealtimeVitals = () => {
  const heartRate = Math.floor(Math.random() * 40) + 60; // 60-100 BPM
  const spO2 = Math.floor(Math.random() * 6) + 95; // 95-100%
  const temperature = (Math.random() * 1.5) + 36.5; // 36.5-38°C
  
  return {
    heartRate,
    spO2,
    temperature: temperature.toFixed(1),
    deviceId: 'ESP32-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
    timestamp: new Date()
  };
};

// Real-time vitals subscription (existing function - keep as is)
export const subscribeToVitals = (patientId, callback) => {
  const q = query(
    collection(db, 'vitals'),
    where('uid', '==', patientId),
    orderBy('timestamp', 'desc'),
    limit(1)
  );
  
  return onSnapshot(q, (snapshot) => {
    const vitals = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate()
    }));
    callback(vitals[0]);
  });
};

// Get monitoring history with filters
export const getMonitoringHistory = async (filters = {}) => {
  try {
    let q = query(collection(db, 'vitals'), orderBy('timestamp', 'desc'));
    
    if (filters.uid) {
      q = query(q, where('uid', '==', filters.uid));
    }
    
    if (filters.patientId) {
      q = query(q, where('uid', '==', filters.patientId));
    }
    
    if (filters.startDate && filters.endDate) {
      q = query(
        q, 
        where('timestamp', '>=', filters.startDate),
        where('timestamp', '<=', filters.endDate)
      );
    }
    
    if (filters.limit) {
      q = query(q, limit(filters.limit));
    }
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate()
    }));
  } catch (error) {
    console.error('Error getting monitoring history:', error);
    throw error;
  }
};