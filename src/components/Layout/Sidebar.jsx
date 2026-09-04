import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import Icon from '../Icon/Icon';
import './Layout.css';

function Sidebar() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
      setLoggingOut(false);
    }
  };

  const navItems = [
    { icon: 'dashboard', label: 'Dashboard', path: '/' },
    { icon: 'form', label: 'My Forms', path: '/forms' },
    { icon: 'templates', label: 'Templates', path: '/templates' },
    { icon: 'analytics', label: 'Analytics', path: '/analytics' },
  ];

  return (
    <aside className="app-sidebar hide-on-mobile">
      <div className="sidebar-brand">
        <div className="brand-icon" style={{ background: 'transparent' }}>
          <img src="/logo.png" alt="RGUKT FORMS" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
        </div>
        <span className="brand-text">RGUKT FORMS</span>
      </div>

      <nav className="sidebar-nav">
        <ul>
          {navItems.map((item, index) => {
            return (
              <li key={index}>
                <NavLink
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                  <Icon name={item.icon} size={20} />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="sidebar-footer">
        {currentUser && (
          <div className="user-profile-mini">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flex: 1, overflow: 'hidden' }}>
              {currentUser.photoURL ? (
                <img src={currentUser.photoURL} alt="Profile" className="avatar" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
              ) : (
                <div className="avatar" style={{ flexShrink: 0 }}>{currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'U'}</div>
              )}
              <div className="user-info" style={{ overflow: 'hidden' }}>
                <span className="user-name" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                  {currentUser.displayName || currentUser.email || 'User'}
                </span>
                <span className="user-role" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                  {currentUser.email || 'User'}
                </span>
              </div>
            </div>
            <button 
              className="btn-icon" 
              onClick={() => setShowLogoutConfirm(true)} 
              title="Logout" 
              style={{ color: 'var(--text-secondary)', padding: 'var(--space-2)' }}
            >
              <Icon name="logout" size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(2px)' }}>
          <div className="card animate-fade-in" style={{ padding: 'var(--space-6)', maxWidth: '400px', width: '90%', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', color: 'var(--error-600)' }}>
              <Icon name="logout" size={24} />
              <h3 style={{ fontSize: 'var(--text-lg)', margin: 0 }}>Confirm Logout</h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
              Are you sure you want to log out of your account?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
              <button 
                className="btn" 
                style={{ backgroundColor: 'var(--gray-100)', color: 'var(--text-primary)', border: 'none', opacity: loggingOut ? 0.7 : 1 }} 
                onClick={() => setShowLogoutConfirm(false)}
                disabled={loggingOut}
              >
                Cancel
              </button>
              <button 
                className="btn" 
                style={{ backgroundColor: 'var(--error-600)', color: 'white', border: 'none', opacity: loggingOut ? 0.7 : 1, minWidth: '85px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)' }} 
                onClick={handleLogout}
                disabled={loggingOut}
              >
                {loggingOut ? (
                  <>
                    <Icon name="loader" size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    Logging out...
                  </>
                ) : (
                  'Logout'
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </aside>
  );
}

export default Sidebar;
