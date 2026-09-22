import React from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import './Layout.css';

function Layout({ children }) {
  const location = useLocation();
  const isFormEditor = location.pathname.startsWith('/edit/');
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-main">
        <main className="app-content" style={{ paddingTop: 'var(--space-6)' }}>
          <div className="content-container">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default Layout;
