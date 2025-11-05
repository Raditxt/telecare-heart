// src/api/firestore.js
import { collection, addDoc, query, where, orderBy, getDocs, limit, doc, setDoc } from "firebase/firestore";
import { db, serverTimestamp } from "../services/firebase";

// Collection references
const vitalsCol = collection(db, "vitals");
const usersCol = collection(db, "users");

// 1) Tulis data vitals baru
export const writeVitalRecord = async ({ uid, deviceId, hr, spo2, temp, ekg, status }) => {
  const docRef = await addDoc(vitalsCol, {
    uid,
    deviceId,
    hr,
    spo2,
    temp,
    ekg,
    status,
    timestamp: serverTimestamp(),
  });
  return docRef.id;
};

// 2) Ambil vitals terakhir pasien tertentu
export const getRecentVitalsByUser = async (uid, limitCount = 50) => {
  const q = query(vitalsCol, where("uid", "==", uid), orderBy("timestamp", "desc"), limit(limitCount));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

// 3) Ambil semua vitals yang statusnya 'critical' (untuk alert dokter)
export const getAllRecentCritical = async (limitCount = 50) => {
  const q = query(vitalsCol, where("status", "==", "critical"), orderBy("timestamp", "desc"), limit(limitCount));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

// 4) Buat profile user setelah registrasi
export const createUserProfile = async (user, role = "patient", extra = {}) => {
  const userRef = doc(usersCol, user.uid);
  await setDoc(userRef, {
    uid: user.uid,
    name: user.displayName || "",
    email: user.email,
    role,
    createdAt: serverTimestamp(),
    ...extra,
  });
};
