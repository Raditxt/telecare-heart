import { db } from './firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export const createUserProfile = async (userData) => {
  try {
    console.log("📝 Starting Firestore profile creation...");
    console.log("User data received:", userData);
    
    // Validate required fields
    if (!userData.uid) {
      throw new Error('User UID is required');
    }
    if (!userData.email) {
      throw new Error('User email is required');
    }
    if (!userData.name) {
      throw new Error('User name is required');
    }

    const userRef = doc(db, 'users', userData.uid);
    
    const profileData = {
      name: userData.name,
      email: userData.email,
      role: userData.role || 'patient',
      deviceId: userData.deviceId || '',
      createdAt: serverTimestamp()
    };
    
    console.log("📦 Profile data to save:", profileData);
    console.log("🔗 Firestore path: users/", userData.uid);
    
    await setDoc(userRef, profileData);
    
    console.log('✅ User profile created successfully in Firestore');
    return true;
    
  } catch (error) {
    console.error('❌ Firestore Error Details:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    throw new Error(`Gagal membuat profil: ${error.message}`);
  }
};