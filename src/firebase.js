// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { initializeFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAanCQfoUadykz8LTQ5Mfl44L7i3Xoz9pw",
  authDomain: "rguktforms.firebaseapp.com",
  projectId: "rguktforms",
  storageBucket: "rguktforms.firebasestorage.app",
  messagingSenderId: "864422477402",
  appId: "1:864422477402:web:4669b188c339e29c36a263",
  measurementId: "G-CN0QGP2725"
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
