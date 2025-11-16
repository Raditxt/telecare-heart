// utils/testFirestore.js
import { db } from '../services/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export const testFirestoreConnection = async () => {
  try {
    console.log('🧪 Testing Firestore connection...');
    
    // Test write operation
    const testDocRef = doc(db, 'test_collection', 'test_document');
    await setDoc(testDocRef, {
      message: 'Test connection',
      timestamp: new Date(),
      status: 'success'
    });
    console.log('✅ Write test passed');

    // Test read operation  
    const docSnapshot = await getDoc(testDocRef);
    if (docSnapshot.exists()) {
      console.log('✅ Read test passed:', docSnapshot.data());
    } else {
      console.log('❌ Read test failed - document not found');
    }

    return true;
  } catch (error) {
    console.error('❌ Firestore test failed:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    return false;
  }
};