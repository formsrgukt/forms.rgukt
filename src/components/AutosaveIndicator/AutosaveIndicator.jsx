import React from 'react';
import './AutosaveIndicator.css';

export default function AutosaveIndicator({ status = 'saved' }) {
  // status can be: 'saving', 'saved', 'error'
  
  const titleText = 
    status === 'saving' ? 'Saving...' :
    status === 'saved' ? 'All changes saved' : 'Save failed';
  
  return (
    <div className={`autosave-indicator status-${status}`} title={titleText}>
      <div className="autosave-icon-wrapper">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="cloud-base">
          <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
        </svg>
        
        {status === 'saving' && (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inner-icon sync-icon">
            <path d="M12 9.5a3 3 0 1 1-3 3" />
          </svg>
        )}
        
        {status === 'saved' && (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inner-icon check-icon">
            <path d="M9 12.5l2.5 2.5 4-5.5" />
          </svg>
        )}
        
        {status === 'error' && (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inner-icon error-icon">
            <path d="M12 9v4" />
            <path d="M12 15.5h.01" />
          </svg>
        )}
      </div>
    </div>
  );
}
