import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import Icon from './Icon/Icon';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    if (currentUser) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  const handleGoogleLogin = async () => {
    if (signingIn) return;
    setSigningIn(true);
    try {
      await signInWithPopup(auth, googleProvider);
      navigate('/');
    } catch (error) {
      console.error("Google login failed:", error);
      setSigningIn(false);
    }
  };

  return (
    <div className="login-page animate-fade-in">
      <div className="login-card">
        {/* Left Column: Auth Form */}
        <div className="login-form-container">
          <img src="/logo.png" alt="RGUKT FORMS Logo" style={{ width: '80px', height: '80px', objectFit: 'contain', marginBottom: 'var(--space-4)' }} />
          <h1>Welcome to RGUKT FORMS</h1>
          <p className="subtitle" style={{ marginBottom: 'var(--space-6)' }}>Get started - it's free.</p>

          <button 
            className="login-btn btn-google" 
            onClick={handleGoogleLogin}
            disabled={signingIn}
            style={{ opacity: signingIn ? 0.8 : 1, cursor: signingIn ? 'not-allowed' : 'pointer' }}
          >
            {signingIn ? (
              <>
                <Icon name="loader" size={20} style={{ animation: 'spin 1s linear infinite' }} />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span>CONTINUE WITH GOOGLE</span>
              </>
            )}
          </button>

          <div className="login-footer">
            <p style={{ marginBottom: '8px' }}>
              By continuing, you indicate that you have read, understood and agree to RGUKT FORMS's <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>
            </p>
          </div>
        </div>

        {/* Right Column: Showcase Background */}
        <div className="login-showcase-container">
          <div className="bubble bubble-1">PUC</div>
          <div className="bubble bubble-2">CSE</div>
          <div className="bubble bubble-3">ECE</div>
          <div className="bubble bubble-4">MME</div>
          <div className="bubble bubble-5">CIVIL</div>
          <div className="bubble bubble-6">CHEM</div>
          <div className="bubble bubble-7">MECH</div>
          <div className="bubble bubble-8">RGUKT</div>

          <p className="showcase-text">
            Trusted by students and faculty across all campuses.
          </p>
        </div>
      </div>
    </div>
  );
}
