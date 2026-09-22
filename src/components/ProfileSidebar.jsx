import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Icon from './Icon/Icon';
import { useAuth } from '../contexts/AuthContext';
import { signOut, deleteUser } from 'firebase/auth';
import { auth } from '../firebase';
import { deleteUserAccountAndData } from '../services/db';
import { useNavigate } from 'react-router-dom';

function ProfileSidebar({ isOpen, onClose }) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteStep, setDeleteStep] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteEmailConfirm, setDeleteEmailConfirm] = useState('');
  const [cursorTrailEnabled, setCursorTrailEnabled] = useState(localStorage.getItem('cursorTrail') === 'true');
  const [lofiEnabled, setLofiEnabled] = useState(localStorage.getItem('lofiMode') === 'true');

  useEffect(() => {
    if (cursorTrailEnabled) {
      localStorage.setItem('cursorTrail', 'true');
      // Cursor trail logic would be injected globally, but for now we just toggle state
      document.body.classList.add('cursor-trail-active');
    } else {
      localStorage.setItem('cursorTrail', 'false');
      document.body.classList.remove('cursor-trail-active');
    }
  }, [cursorTrailEnabled]);

  useEffect(() => {
    if (lofiEnabled) {
      localStorage.setItem('lofiMode', 'true');
      // Imagine an audio element playing lofi here
    } else {
      localStorage.setItem('lofiMode', 'false');
    }
  }, [lofiEnabled]);

  const handleLogout = async () => {
    if (loggingOut || deleting) return;
    setLoggingOut(true);
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
      setLoggingOut(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteEmailConfirm !== currentUser.email) return;
    if (deleting) return;
    setDeleting(true);
    setDeleteStep('Starting deletion...');
    try {
      await deleteUserAccountAndData(currentUser.uid, (step) => setDeleteStep(step));
      setDeleteStep('Removing Firebase account...');
      if (auth.currentUser) {
        await deleteUser(auth.currentUser);
      }
      navigate('/login');
    } catch (error) {
      console.error('Failed to delete account', error);
      if (error.code === 'auth/requires-recent-login') {
        alert("For security reasons, please log out and log back in before deleting your account.");
      }
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const [shouldRender, setShouldRender] = useState(isOpen);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      const timer = setTimeout(() => setVisible(true), 10);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!shouldRender) return null;

  return createPortal(
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, pointerEvents: 'none' }}>
      {/* Backdrop */}
      <div 
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(2px)', pointerEvents: 'auto', opacity: visible ? 1 : 0, transition: 'opacity 0.3s ease' }} 
        onClick={onClose} 
      />
      
      {/* Sidebar Panel */}
      <div 
        className="profile-sidebar"
        style={{ 
          position: 'absolute', 
          top: 0, 
          right: 0, 
          bottom: 0, 
          width: '380px', 
          backgroundColor: 'var(--bg-surface)', 
          boxShadow: '-4px 0 24px rgba(0,0,0,0.1)', 
          pointerEvents: 'auto',
          transform: visible ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div style={{ padding: 'var(--space-6)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 'var(--text-xl)', margin: 0, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Icon name="settings" size={24} color="var(--primary-500)" /> Profile & Settings
          </h2>
          <button className="btn-icon" onClick={onClose}>
            <Icon name="close" size={24} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
          
          {/* User Info */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'var(--primary-100)', color: 'var(--primary-600)', fontSize: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
              {currentUser?.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ fontSize: 'var(--text-lg)', margin: '0 0 var(--space-1) 0' }}>{currentUser?.displayName || 'User'}</h3>
              <p style={{ color: 'var(--text-secondary)', margin: 0 }}>{currentUser?.email}</p>
            </div>
          </div>

          {/* Unique Features section */}
          <div>
            <h4 style={{ fontSize: 'var(--text-sm)', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-tertiary)', marginBottom: 'var(--space-4)' }}>Experimental Features</h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {/* Feature 1 */}
              <div className="card" style={{ padding: 'var(--space-4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'var(--secondary-50)', color: 'var(--secondary-500)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="mouse" size={20} />
                  </div>
                  <div>
                    <h5 style={{ margin: 0, fontSize: 'var(--text-md)' }}>Cursor Trails</h5>
                    <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Add dynamic particle trails to cursor</p>
                  </div>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" checked={cursorTrailEnabled} onChange={(e) => setCursorTrailEnabled(e.target.checked)} />
                  <span className="slider round"></span>
                </label>
              </div>

              {/* Feature 2 */}
              <div className="card" style={{ padding: 'var(--space-4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'var(--success-50)', color: 'var(--success-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="music" size={20} />
                  </div>
                  <div>
                    <h5 style={{ margin: 0, fontSize: 'var(--text-md)' }}>Lofi Focus Mode</h5>
                    <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Background beats while working</p>
                  </div>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" checked={lofiEnabled} onChange={(e) => setLofiEnabled(e.target.checked)} />
                  <span className="slider round"></span>
                </label>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div style={{ padding: 'var(--space-6)', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--gray-50)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <button 
            className="btn" 
            style={{ width: '100%', backgroundColor: 'transparent', color: 'var(--error-600)', border: '1px solid var(--error-200)', display: 'flex', justifyContent: 'center', gap: 'var(--space-2)' }}
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Icon name="delete" size={18} /> Delete Account
          </button>
          
          <button 
            className="btn" 
            style={{ width: '100%', backgroundColor: 'var(--error-100)', color: 'var(--error-700)', border: 'none', display: 'flex', justifyContent: 'center', gap: 'var(--space-2)' }}
            onClick={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut ? <Icon name="loader" size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Icon name="logout" size={18} />}
            {loggingOut ? 'Signing out...' : 'Sign Out'}
          </button>
        </div>
      </div>
      
      <style>{`
        .toggle-switch {
          position: relative;
          display: inline-block;
          width: 44px;
          height: 24px;
        }
        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: var(--gray-300);
          transition: .4s;
        }
        .slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: .3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        input:checked + .slider {
          background-color: var(--primary-500);
        }
        input:focus + .slider {
          box-shadow: 0 0 1px var(--primary-500);
        }
        input:checked + .slider:before {
          transform: translateX(20px);
        }
        .slider.round {
          border-radius: 24px;
        }
        .slider.round:before {
          border-radius: 50%;
        }
        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-step-change {
          animation: slideUpFade 0.3s ease-out forwards;
        }
      `}</style>
      
      {/* Delete Account Modal Popup */}
      {showDeleteConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, backdropFilter: 'blur(4px)', pointerEvents: 'auto' }}>
          <div className="card animate-fade-in" style={{ padding: 'var(--space-8)', maxWidth: '480px', width: '90%', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', boxShadow: 'var(--shadow-xl)', textAlign: 'center' }}>
            
            <div style={{ width: '80px', height: '80px', margin: '0 auto', backgroundColor: 'var(--error-100)', color: 'var(--error-600)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="warning" size={40} />
            </div>

            <div>
              <h2 style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-2)', color: 'var(--error-600)' }}>Delete Account</h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                This will permanently delete your account, settings, and all your forms. This action cannot be undone. Please type <strong>{currentUser?.email}</strong> to confirm.
              </p>
            </div>

            <input 
              type="email" 
              placeholder="Confirm your email" 
              value={deleteEmailConfirm}
              onChange={(e) => setDeleteEmailConfirm(e.target.value)}
              style={{ width: '100%', padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: 'var(--text-base)', textAlign: 'center' }}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginTop: 'var(--space-2)' }}>
              <button 
                className="btn" 
                style={{ padding: 'var(--space-4)', fontSize: 'var(--text-lg)', backgroundColor: 'var(--gray-200)', color: 'var(--text-primary)', border: 'none' }}
                onClick={() => { setShowDeleteConfirm(false); setDeleteEmailConfirm(''); }}
                disabled={deleting}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                style={{ padding: 'var(--space-4)', fontSize: 'var(--text-lg)', backgroundColor: 'var(--error-600)', color: 'white', border: 'none', opacity: (deleteEmailConfirm === currentUser?.email && !deleting) ? 1 : 0.5 }}
                onClick={handleDeleteAccount}
                disabled={deleteEmailConfirm !== currentUser?.email || deleting}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>

            {deleting && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)', color: 'var(--text-secondary)' }}>
                <Icon name="loader" size={16} style={{ animation: 'spin 1s linear infinite' }} />
                <span key={deleteStep} className="animate-step-change" style={{ display: 'inline-block' }}>
                  {deleteStep || 'Erasing data...'}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}

export default ProfileSidebar;
