// src/config/firebase-config.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Hanya config yang essential
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "telecare-heart.firebaseapp.com",
  projectId: "telecare-heart",
  storageBucket: "telecare-heart.appspot.com", // Biarkan default, tapi kita gak pakai
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};

const app = initializeApp(firebaseConfig);

// Hanya export yang kita butuhkan
export const db = getFirestore(app);
export const auth = getAuth(app);

// JANGAN export storage karena kita gak pakai
export default app;