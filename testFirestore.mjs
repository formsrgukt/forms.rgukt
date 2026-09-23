import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD9ZxcacBeB0wzhivs3AcfV91qf05e5cb8",
  authDomain: "rgukt-forms-v2.firebaseapp.com",
  projectId: "rgukt-forms-v2",
  storageBucket: "rgukt-forms-v2.firebasestorage.app",
  messagingSenderId: "600717376496",
  appId: "1:600717376496:web:e10b1258fd445034b9bb35",
  measurementId: "G-QNZBPZSW3M"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function test() {
  try {
    const q = collection(db, 'forms');
    const snapshot = await getDocs(q);
    console.log("Total forms:", snapshot.size);
    snapshot.forEach(doc => {
      console.log(doc.id, "=>", doc.data().title, "| userId:", doc.data().userId);
    });
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

test();
