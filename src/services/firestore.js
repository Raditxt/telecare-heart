// src/services/firestore.js
import { db, serverTimestamp } from "./firebase";
import { doc, setDoc } from "firebase/firestore";

export const createUserProfile = async (user, role = "patient", extra = {}) => {
  const userRef = doc(db, "users", user.uid);
  await setDoc(userRef, {
    uid: user.uid,
    name: user.displayName || "",
    email: user.email,
    role,
    createdAt: serverTimestamp(),
    ...extra,
  });
};
