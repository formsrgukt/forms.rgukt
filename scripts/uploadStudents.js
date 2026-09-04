import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import xlsx from "xlsx";

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

const workbook = xlsx.readFile('ai&ml.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(worksheet, {header: 1});

async function upload() {
  console.log("Starting upload...");
  let count = 0;
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length < 2) continue;
    
    const id = row[1]; // ID.No.
    if (!id) continue;
    
    const studentData = {
      id: id.toString().trim(),
      name: (row[2] || '').toString().trim(),
      gender: (row[3] || '').toString().trim(),
      branch: (row[4] || '').toString().trim(),
      classSection: (row[5] || '').toString().trim()
    };
    
    try {
      await setDoc(doc(db, "students", studentData.id), studentData);
      count++;
      if (count % 10 === 0) console.log(`Uploaded ${count} students`);
    } catch (err) {
      console.error(`Error uploading ${id}:`, err);
    }
  }
  console.log(`Upload complete! Total: ${count}`);
  process.exit(0);
}

upload();
