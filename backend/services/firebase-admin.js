// backend/services/firebase-admin.js
import admin from 'firebase-admin';

// Cek apakah environment variables sudah terload
console.log('Firebase Config Check:');
console.log('- Project ID:', process.env.FIREBASE_PROJECT_ID ? '✅ Set' : '❌ Missing');
console.log('- Private Key:', process.env.FIREBASE_PRIVATE_KEY ? '✅ Set' : '❌ Missing');
console.log('- Client Email:', process.env.FIREBASE_CLIENT_EMAIL ? '✅ Set' : '❌ Missing');

// Service account untuk Firestore saja
const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(process.env.FIREBASE_CLIENT_EMAIL || '')}`
};

// Validasi service account
if (!serviceAccount.project_id) {
  throw new Error('FIREBASE_PROJECT_ID is required');
}
if (!serviceAccount.private_key) {
  throw new Error('FIREBASE_PRIVATE_KEY is required');
}
if (!serviceAccount.client_email) {
  throw new Error('FIREBASE_CLIENT_EMAIL is required');
}

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`
  });

  console.log('✅ Firebase Admin initialized successfully');
} catch (error) {
  console.error('❌ Firebase Admin initialization failed:', error.message);
  throw error;
}

// Hanya export Firestore dan Auth
const db = admin.firestore();
const auth = admin.auth();

export { admin, db, auth };
export default { admin, db, auth };