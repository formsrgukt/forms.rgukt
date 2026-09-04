import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, updateDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAanCQfoUadykz8LTQ5Mfl44L7i3Xoz9pw",
  authDomain: "rguktforms.firebaseapp.com",
  projectId: "rguktforms",
  storageBucket: "rguktforms.firebasestorage.app",
  messagingSenderId: "864422477402",
  appId: "1:864422477402:web:4669b188c339e29c36a263"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const branchMap = {
  'Computer Science Engineering': 'CSE',
  'Computer Science and Engineering': 'CSE',
  'Electronics and Communications Engineering': 'ECE',
  'Electronics and Communication Engineering': 'ECE',
  'Civil Engineering': 'CE',
  'Mechanical Engineering': 'ME',
  'Metallurgical and Materials Engineering': 'MME',
  'Chemical Engineering': 'CHEM',
  'Artificial Intelligence and Machine Learning': 'AIML',
  'Electrical and Electronics Engineering': 'EEE'
};

async function fix() {
  console.log("Fetching students to fix branches...");
  const snapshot = await getDocs(collection(db, "students"));
  let updated = 0;
  
  for (const document of snapshot.docs) {
    const data = document.data();
    if (branchMap[data.branch]) {
      await updateDoc(doc(db, "students", document.id), {
        branch: branchMap[data.branch]
      });
      updated++;
      if (updated % 100 === 0) console.log(`Fixed ${updated} branches...`);
    }
  }
  
  console.log(`Branch fix complete! Updated ${updated} students.`);
  process.exit(0);
}

fix();
