const fs = require('fs');
let content = fs.readFileSync('src/components/FormViewer.jsx', 'utf8');

content = content.replace(
  /let viewerAuth;\r?\ntry \{[\s\S]*?\} catch \(e\) \{\r?\n  console\.error\('Secondary Auth error:', e\);\r?\n  viewerAuth = fallbackAuth;\r?\n\}\r?\nimport Icon from '\.\/Icon\/Icon';\r?\nimport Loader from '\.\/Loader';\r?\nimport \{ useToast \} from '\.\.\/contexts\/ToastContext';/,
  `import Icon from './Icon/Icon';
import Loader from './Loader';
import { useToast } from '../contexts/ToastContext';

let viewerAuth;
try {
  const viewerApp = getApps().find(app => app.name === 'ViewerApp') || initializeApp(firebaseConfig, 'ViewerApp');
  viewerAuth = getAuth(viewerApp);
} catch (e) {
  console.error('Secondary Auth error:', e);
  viewerAuth = fallbackAuth;
}`
);

fs.writeFileSync('src/components/FormViewer.jsx', content);
