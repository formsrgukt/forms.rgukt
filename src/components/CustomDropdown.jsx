import React, { useState, useRef, useEffect } from 'react';
import Icon from './Icon/Icon';

function CustomDropdown({ value, options, onChange, style }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value) || options[0];

  return (
    <div ref={dropdownRef} style={{ position: 'relative', width: '100%', ...style }}>
      <button
        type="button"
        className="input-field"
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          cursor: 'pointer',
          backgroundColor: 'var(--bg-surface)',
          textAlign: 'left'
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          {selectedOption.icon && <Icon name={selectedOption.icon} size={18} color="var(--gray-500)" />}
          <span>{selectedOption.label}</span>
        </div>
        <Icon name="chevron-down" size={16} color="var(--gray-500)" />
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0,
          right: 0,
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 1000,
          padding: 'var(--space-1) 0',
          maxHeight: '300px',
          overflowY: 'auto'
        }}>
          {options.map((opt) => (
            <div
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className="dropdown-item"
              onMouseEnter={(e) => {
                if (value !== opt.value) e.currentTarget.style.backgroundColor = 'var(--gray-50)';
              }}
              onMouseLeave={(e) => {
                if (value !== opt.value) e.currentTarget.style.backgroundColor = 'transparent';
              }}
              style={{
                padding: 'var(--space-2) var(--space-3)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                backgroundColor: value === opt.value ? 'var(--primary-50)' : 'transparent',
                color: value === opt.value ? 'var(--primary-600)' : 'var(--text-primary)',
                transition: 'background-color var(--transition-fast)'
              }}
            >
              {opt.icon && (
                <Icon 
                  name={opt.icon} 
                  size={18} 
                  color={value === opt.value ? 'var(--primary-600)' : 'var(--gray-500)'} 
                />
              )}
              <span>{opt.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CustomDropdown;
