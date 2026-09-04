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

const workbook = xlsx.readFile('RKV1 BRANCH ALLOCATION DATA.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(worksheet, {header: 1});

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

async function upload() {
  console.log("Starting RKV1 upload...");
  let count = 0;
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length < 2) continue;
    
    const id = row[1]; // CAMPUS ID
    if (!id || typeof id !== 'string' || !id.trim()) continue;
    
    let rawBranch = (row[4] || '').toString().trim();
    let branchCode = branchMap[rawBranch] || rawBranch;

    // Generate accurate email based on ID prefix since Excel 'Mails' column is corrupted/misaligned
    let emailDomain = 'rguktrkv.ac.in';
    const idPrefix = id.charAt(0).toUpperCase();
    if (idPrefix === 'N') emailDomain = 'rguktn.ac.in';
    else if (idPrefix === 'O') emailDomain = 'rgukto.ac.in';
    else if (idPrefix === 'S') emailDomain = 'rguktsklm.ac.in';
    
    const correctEmail = `${id.toLowerCase()}@${emailDomain}`;

    const studentData = {
      id: id.trim(),
      name: (row[2] || '').toString().trim(),
      gender: (row[3] || '').toString().trim(),
      branch: branchCode,
      email: correctEmail
    };
    
    try {
      await setDoc(doc(db, "students", studentData.id), studentData);
      count++;
      if (count % 100 === 0) console.log(`Uploaded ${count} students`);
    } catch (err) {
      console.error(`Error uploading ${id}:`, err);
    }
  }
  console.log(`RKV1 Upload complete! Total: ${count}`);
  process.exit(0);
}

upload();
