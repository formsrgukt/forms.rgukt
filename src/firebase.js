// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { initializeFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Your web app's Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyD9ZxcacBeB0wzhivs3AcfV91qf05e5cb8",
  authDomain: "rgukt-forms-v2.firebaseapp.com",
  projectId: "rgukt-forms-v2",
  storageBucket: "rgukt-forms-v2.firebasestorage.app",
  messagingSenderId: "600717376496",
  appId: "1:600717376496:web:e10b1258fd445034b9bb35",
  measurementId: "G-QNZBPZSW3M"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Use long-polling instead of WebSockets to bypass strict firewalls/antivirus
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true
});

// Enable offline persistence
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
  } else if (err.code === 'unimplemented') {
    console.warn('The current browser does not support all of the features required to enable persistence');
  }
});

export default app;
