import React, { createContext, useContext, useState, useCallback } from 'react';
import Icon from '../components/Icon/Icon';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ text: msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: 'var(--space-6)',
          right: 'var(--space-6)',
          backgroundColor: toast.type === 'error' ? 'var(--error-50)' : 'var(--bg-surface)',
          color: toast.type === 'error' ? 'var(--error-600)' : 'var(--text-primary)',
          border: `1px solid ${toast.type === 'error' ? 'var(--error-500)' : 'var(--border-color)'}`,
          padding: 'var(--space-3) var(--space-5)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div className="animate-pop-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon 
              name={toast.type === 'error' ? 'delete' : 'check-circle'} 
              size={20} 
              color={toast.type === 'error' ? 'var(--error-600)' : 'var(--success-600)'} 
            />
          </div>
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-medium)' }}>
            {toast.text}
          </span>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
