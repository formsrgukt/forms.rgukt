import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import xlsx from "xlsx";

const firebaseConfig = {
  apiKey: "AIzaSyD9ZxcacBeB0wzhivs3AcfV91qf05e5cb8",
  authDomain: "rgukt-forms-v2.firebaseapp.com",
  projectId: "rgukt-forms-v2",
  storageBucket: "rgukt-forms-v2.firebasestorage.app",
  messagingSenderId: "600717376496",
  appId: "1:600717376496:web:e10b1258fd445034b9bb35"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const workbook = xlsx.readFile('R24 BATCH BRANCH ALLOCATION.xlsx');
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
  console.log("Starting R24 upload...");
  let count = 0;
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length < 2) continue;
    
    const id = row[0]; // clg_id
    if (!id || typeof id !== 'string' || !id.trim()) continue;
    
    let rawBranch = (row[3] || '').toString().trim(); // allotted_branch
    let branchCode = branchMap[rawBranch] || rawBranch;

    const emailDomain = 'rguktrkv.ac.in'; // assuming from mail
    const correctEmail = `${id.toLowerCase()}@${emailDomain}`;

    const studentData = {
      id: id.trim(),
      name: (row[1] || '').toString().trim(),
      gender: (row[2] || '').toString().trim(),
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
  console.log(`R24 Upload complete! Total: ${count}`);
  process.exit(0);
}

upload();
