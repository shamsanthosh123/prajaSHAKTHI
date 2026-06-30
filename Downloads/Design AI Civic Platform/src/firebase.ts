import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? "AIzaSyAJzQDJnrov8pIA0QybT3kibXK3xbxQnX8",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? "prajashakthi-2026.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "prajashakthi-2026",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? "prajashakthi-2026.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "714591074379",
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? "1:714591074379:web:154b197b7967f2e022f5ce",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ?? "G-1JVLR044E0",
};


const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
