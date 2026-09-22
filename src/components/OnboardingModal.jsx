import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import Icon from './Icon/Icon';

function OnboardingModal({ isOpen, onComplete }) {
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSelect = async (isRguktian) => {
    if (submitting) return;
    setSubmitting(true);
    await onComplete(isRguktian);
    setSubmitting(false);
  };

  return createPortal(
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)' }}>
      <div className="card animate-fade-in" style={{ padding: 'var(--space-8)', maxWidth: '480px', width: '90%', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', boxShadow: 'var(--shadow-xl)', textAlign: 'center' }}>
        
        <div style={{ width: '80px', height: '80px', margin: '0 auto', backgroundColor: 'var(--primary-100)', color: 'var(--primary-600)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="users" size={40} />
        </div>

        <div>
          <h2 style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-2)' }}>Welcome to RGUKT FORMS!</h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            To personalize your experience and show you the most relevant templates, please tell us:
          </p>
          <h3 style={{ fontSize: 'var(--text-xl)', marginTop: 'var(--space-4)' }}>Are you an RGUKTian?</h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginTop: 'var(--space-2)' }}>
          <button 
            className="btn btn-primary" 
            style={{ padding: 'var(--space-4)', fontSize: 'var(--text-lg)' }}
            onClick={() => handleSelect(true)}
            disabled={submitting}
          >
            Yes, I am
          </button>
          <button 
            className="btn" 
            style={{ padding: 'var(--space-4)', fontSize: 'var(--text-lg)', backgroundColor: 'var(--gray-200)', color: 'var(--text-primary)', border: 'none' }}
            onClick={() => handleSelect(false)}
            disabled={submitting}
          >
            No, I'm not
          </button>
        </div>

        {submitting && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)', color: 'var(--text-secondary)' }}>
            <Icon name="loader" size={16} style={{ animation: 'spin 1s linear infinite' }} />
            Setting up your workspace...
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

export default OnboardingModal;
