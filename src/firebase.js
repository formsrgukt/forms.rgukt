// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
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
// and enable multi-tab persistent cache
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});

export default app;
