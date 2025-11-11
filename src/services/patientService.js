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

// Real-time vitals subscription
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