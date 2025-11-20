import { auth } from "./firebase";
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  updatePassword,
  updateProfile,
  EmailAuthProvider,
  reauthenticateWithCredential
} from "firebase/auth";
import { 
  createUserProfile, 
  updateUserProfile as updateUserProfileInFirestore,
  updateUserPreferences as updateUserPreferencesInFirestore 
} from './userService'; // ✅ Import yang diperbaiki

export const login = async (email, password) => {
  try {
    console.log("Attempting login with:", email);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log("Login successful:", userCredential.user);
    return userCredential.user;
  } catch (error) {
    console.error("Login error:", error.message);
    
    // User-friendly error messages untuk login
    let errorMessage = "Login gagal. Silakan coba lagi.";
    if (error.code === 'auth/invalid-email') {
      errorMessage = "Format email tidak valid.";
    } else if (error.code === 'auth/user-not-found') {
      errorMessage = "Email tidak terdaftar.";
    } else if (error.code === 'auth/wrong-password') {
      errorMessage = "Password salah.";
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = "Terlalu banyak percobaan login. Coba lagi nanti.";
    }
    
    throw new Error(errorMessage);
  }
};

export const register = async (email, password, userData) => {
  try {
    console.log("🔐 Attempting Firebase registration...", email);
    
    // 1. Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log("✅ Auth registration successful - UID:", user.uid);

    // 2. Create user profile in Firestore - BUT DON'T FAIL REGISTRATION IF THIS FAILS
    try {
      await createUserProfile({
        uid: user.uid,
        email: email,
        name: userData.name,
        role: userData.role,
        deviceId: userData.deviceId || ''
      });
      console.log("✅ User profile created in Firestore");
    } catch (firestoreError) {
      console.warn("⚠️ Firestore profile creation failed, but auth succeeded:", firestoreError.message);
      // JANGAN throw error di sini! Auth sudah berhasil, user bisa login
      // Profile bisa dibuat manual nanti atau di update saat login pertama
    }
    
    console.log("🎉 Registration COMPLETE - returning user");
    return user;
    
  } catch (error) {
    console.error("❌ Registration FAILED:", error);
    
    // User-friendly error messages HANYA untuk auth errors
    let errorMessage = "Pendaftaran gagal. Silakan coba lagi.";
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = "Email sudah digunakan. Silakan gunakan email lain.";
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = "Format email tidak valid.";
    } else if (error.code === 'auth/weak-password') {
      errorMessage = "Password terlalu lemah. Minimal 6 karakter.";
    }
    
    throw new Error(errorMessage);
  }
};

export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    throw new Error(error.message);
  }
};

// 🔧 FUNGSI UPDATE PROFILE YANG DIPERBAIKI

export const updateUserProfile = async (profileData) => {
  try {
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error("No user is currently signed in");
    }

    // Update Firebase Auth profile
    if (profileData.displayName) {
      await updateProfile(user, {
        displayName: profileData.displayName
      });
    }

    // Update Firestore user profile
    const firestoreData = {
      name: profileData.displayName || profileData.name,
      phoneNumber: profileData.phoneNumber,
      department: profileData.department,
      updatedAt: new Date()
    };

    await updateUserProfileInFirestore(user.uid, firestoreData); // ✅ Sekarang fungsi ini tersedia
    
    return { success: true, message: "Profile updated successfully" };
  } catch (error) {
    console.error("Error updating profile:", error);
    throw new Error(`Failed to update profile: ${error.message}`);
  }
};

export const changePassword = async (currentPassword, newPassword) => {
  try {
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error("No user is currently signed in");
    }

    // Re-authenticate user before changing password
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);

    // Change password
    await updatePassword(user, newPassword);
    
    return { success: true, message: "Password changed successfully" };
  } catch (error) {
    console.error("Error changing password:", error);
    
    let errorMessage = "Failed to change password";
    if (error.code === 'auth/wrong-password') {
      errorMessage = "Current password is incorrect";
    } else if (error.code === 'auth/weak-password') {
      errorMessage = "New password is too weak";
    } else if (error.code === 'auth/requires-recent-login') {
      errorMessage = "Please log in again to change your password";
    }
    
    throw new Error(errorMessage);
  }
};

export const updateUserPreferences = async (preferences) => {
  try {
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error("No user is currently signed in");
    }

    // Update preferences in Firestore menggunakan fungsi terpisah
    await updateUserPreferencesInFirestore(user.uid, preferences); // ✅ Sekarang fungsi ini tersedia
    
    return { success: true, message: "Preferences updated successfully" };
  } catch (error) {
    console.error("Error updating preferences:", error);
    throw new Error(`Failed to update preferences: ${error.message}`);
  }
};

// Helper function to get current user
export const getCurrentUser = () => {
  return auth.currentUser;
};

// Helper function to check if user is logged in
export const isUserLoggedIn = () => {
  return !!auth.currentUser;
};