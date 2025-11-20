import { db } from './firebase';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  serverTimestamp 
} from 'firebase/firestore';

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
      department: userData.department || 'Medical Staff',
      phoneNumber: userData.phoneNumber || '',
      preferences: {
        emailNotifications: true,
        pushNotifications: true,
        criticalAlerts: true,
        theme: 'light',
        language: 'en',
        timezone: 'Asia/Jakarta',
        dateFormat: 'DD/MM/YYYY',
        autoRefresh: true,
        dataDensity: 'normal'
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
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

// 🔧 FUNGSI BARU YANG DIPERLUKAN

export const updateUserProfile = async (uid, updates) => {
  try {
    console.log("📝 Updating user profile for UID:", uid);
    console.log("Updates:", updates);

    if (!uid) {
      throw new Error('User UID is required');
    }

    const userRef = doc(db, 'users', uid);
    
    // Check if document exists
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      throw new Error('User profile not found');
    }

    const updateData = {
      ...updates,
      updatedAt: serverTimestamp()
    };

    console.log("📦 Update data to save:", updateData);
    
    await updateDoc(userRef, updateData);
    
    console.log('✅ User profile updated successfully in Firestore');
    return { success: true, message: "Profile updated successfully" };
    
  } catch (error) {
    console.error('❌ Firestore Update Error:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    throw new Error(`Gagal mengupdate profil: ${error.message}`);
  }
};

export const getUserProfile = async (uid) => {
  try {
    console.log("📖 Getting user profile for UID:", uid);

    if (!uid) {
      throw new Error('User UID is required');
    }

    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      console.log('✅ User profile retrieved successfully:', userData);
      return userData;
    } else {
      throw new Error('User profile not found');
    }
    
  } catch (error) {
    console.error('❌ Firestore Get Error:');
    console.error('Error message:', error.message);
    
    throw new Error(`Gagal mengambil profil: ${error.message}`);
  }
};

export const updateUserPreferences = async (uid, preferences) => {
  try {
    console.log("⚙️ Updating user preferences for UID:", uid);
    console.log("New preferences:", preferences);

    if (!uid) {
      throw new Error('User UID is required');
    }

    const userRef = doc(db, 'users', uid);
    
    // Check if document exists
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      throw new Error('User profile not found');
    }

    const updateData = {
      preferences: preferences,
      updatedAt: serverTimestamp()
    };

    await updateDoc(userRef, updateData);
    
    console.log('✅ User preferences updated successfully');
    return { success: true, message: "Preferences updated successfully" };
    
  } catch (error) {
    console.error('❌ Preferences Update Error:');
    console.error('Error message:', error.message);
    
    throw new Error(`Gagal mengupdate preferensi: ${error.message}`);
  }
};

export const getUserPreferences = async (uid) => {
  try {
    const userProfile = await getUserProfile(uid);
    return userProfile.preferences || {};
  } catch (error) {
    console.error('Error getting user preferences:', error.message);
    // Return default preferences if error
    return {
      emailNotifications: true,
      pushNotifications: true,
      criticalAlerts: true,
      theme: 'light',
      language: 'en',
      timezone: 'Asia/Jakarta',
      dateFormat: 'DD/MM/YYYY',
      autoRefresh: true,
      dataDensity: 'normal'
    };
  }
};

// Helper function to check if user profile exists
export const checkUserProfileExists = async (uid) => {
  try {
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);
    return userDoc.exists();
  } catch (error) {
    console.error('Error checking user profile:', error.message);
    return false;
  }
};