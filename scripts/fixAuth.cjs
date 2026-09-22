const fs = require('fs');
let content = fs.readFileSync('src/components/FormViewer.jsx', 'utf8');

// Replace imports
content = content.replace(
  /import \{ useAuth \} from '\.\.\/contexts\/AuthContext';\r?\nimport \{ signInWithPopup, signOut, GoogleAuthProvider \} from 'firebase\/auth';\r?\nimport \{ auth, googleProvider \} from '\.\.\/firebase';/,
  `import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, signOut, GoogleAuthProvider, onAuthStateChanged } from 'firebase/auth';
import { auth as fallbackAuth, firebaseConfig, googleProvider } from '../firebase';

let viewerAuth;
try {
  const viewerApp = getApps().find(app => app.name === 'ViewerApp') || initializeApp(firebaseConfig, 'ViewerApp');
  viewerAuth = getAuth(viewerApp);
} catch (e) {
  console.error('Secondary Auth error:', e);
  viewerAuth = fallbackAuth;
}`
);

// Replace state
content = content.replace(
  /  const \{ currentUser \} = useAuth\(\);\r?\n  const \{ showToast \} = useToast\(\);/,
  `  const [viewerUser, setViewerUser] = useState(null);
  const { showToast } = useToast();`
);

// Replace the first useEffect
content = content.replace(
  /  useEffect\(\(\) => \{\r?\n    if \(currentUser && form\?\.settings\?\.privacy\?\.collectEmail\) \{\r?\n      setEmail\(currentUser\.email\);\r?\n    \}\r?\n  \}, \[currentUser, form\]\);/,
  `  useEffect(() => {
    if (!viewerAuth) return;
    const unsubscribe = onAuthStateChanged(viewerAuth, (user) => {
      setViewerUser(user);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (viewerUser && form?.settings?.privacy?.collectEmail) {
      setEmail(viewerUser.email);
    }
  }, [viewerUser, form]);`
);

// Replace auth with viewerAuth in signInWithPopup and signOut
content = content.replace(/signInWithPopup\(auth, /g, 'signInWithPopup(viewerAuth, ');
content = content.replace(/signOut\(auth\)/g, 'signOut(viewerAuth)');

// Replace currentUser with viewerUser
content = content.replace(/currentUser/g, 'viewerUser');

fs.writeFileSync('src/components/FormViewer.jsx', content);
