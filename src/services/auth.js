import { auth } from "./firebase";
import { 
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut 
} from "firebase/auth";

export const login = async (email, password) => {
  try {
    console.log("Attempting login with:", email); // ✅ Debug log
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log("Login successful:", userCredential.user); // ✅ Debug log
    return userCredential.user;
  } catch (error) {
    console.error("Login error:", error.message); // ✅ Debug log
    throw new Error(error.message);
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