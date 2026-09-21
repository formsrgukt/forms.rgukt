import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from './Icon/Icon';
import CustomDropdown from './CustomDropdown';

const COVER_ICONS = [
  { value: 'form', label: 'Document', icon: 'form' },
  { value: 'star', label: 'Star', icon: 'star' },
  { value: 'check-circle', label: 'Check', icon: 'check-circle' },
  { value: 'activity', label: 'Activity', icon: 'activity' },
  { value: 'presentation', label: 'Presentation', icon: 'presentation' }
];

const COVER_ANIMATIONS = [
  { value: 'fade-up', label: 'Fade Up' },
  { value: 'zoom-in', label: 'Zoom In' },
  { value: 'bounce', label: 'Bounce' }
];

const FONT_OPTIONS = [
  { value: 'Inter', label: 'Inter' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Playfair Display', label: 'Playfair Display' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Outfit', label: 'Outfit' }
];

export default function CoverScreenModal({ initialSettings, onSave, onClose }) {
  const [settings, setSettings] = useState({
    enabled: true,
    title: '',
    description: '',
    buttonText: 'Start',
    icon: 'form',
    animation: 'fade-up',
    backgroundColor: '#ffffff',
    textColor: '#1f2937',
    buttonColor: '#3b82f6',
    fontFamily: 'Inter',
    ...initialSettings,
  });

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSave({ ...settings, enabled: true });
    onClose();
  };

  const handleRemove = () => {
    onSave({ ...settings, enabled: false });
    onClose();
  };

  // Preview animation logic
  const getAnimationProps = () => {
    switch (settings.animation) {
      case 'zoom-in':
        return {
          initial: { opacity: 0, scale: 0.8 },
          animate: { opacity: 1, scale: 1 },
          transition: { duration: 0.5, ease: "easeOut" }
        };
      case 'bounce':
        return {
          initial: { opacity: 0, y: -50 },
          animate: { opacity: 1, y: 0 },
          transition: { type: "spring", stiffness: 300, damping: 15 }
        };
      case 'fade-up':
      default:
        return {
          initial: { opacity: 0, y: 30, scale: 0.95 },
          animate: { opacity: 1, y: 0, scale: 1 },
          transition: { duration: 0.6, ease: "easeOut" }
        };
    }
  };

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex' }}>
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} 
        onClick={onClose} 
      />

      {/* Modal Content */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        style={{ 
          position: 'relative', 
          margin: 'auto', 
          width: '90%', 
          maxWidth: '1200px', 
          height: '90vh', 
          backgroundColor: 'var(--bg-app)', 
          borderRadius: 'var(--radius-xl)', 
          boxShadow: 'var(--shadow-2xl)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{ padding: 'var(--space-4) var(--space-6)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-card)' }}>
          <h2 style={{ fontSize: 'var(--text-xl)', margin: 0, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Icon name="presentation" size={24} color="var(--primary-600)" />
            Cover Screen Designer
          </h2>
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            {initialSettings?.enabled && (
              <button className="btn btn-ghost" onClick={handleRemove} style={{ color: 'var(--error-600)' }}>
                Remove Cover
              </button>
            )}
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave}>Save Changes</button>
          </div>
        </div>

        {/* Body (Split View) */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          
          {/* Settings Sidebar */}
          <div style={{ width: '400px', borderRight: '1px solid var(--border-color)', overflowY: 'auto', padding: 'var(--space-6)', backgroundColor: 'var(--bg-card)' }}>
            <h3 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-6)' }}>Content & Style</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
              
              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>Cover Title</label>
                <input
                  type="text"
                  className="input-field"
                  style={{ width: '100%', backgroundColor: 'var(--bg-app)' }}
                  value={settings.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="Welcome to the form"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>Cover Description</label>
                <textarea
                  className="input-field"
                  rows="3"
                  style={{ width: '100%', backgroundColor: 'var(--bg-app)', resize: 'vertical' }}
                  value={settings.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Please read the instructions before starting."
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>Button Text</label>
                <input
                  type="text"
                  className="input-field"
                  style={{ width: '100%', backgroundColor: 'var(--bg-app)' }}
                  value={settings.buttonText}
                  onChange={(e) => handleChange('buttonText', e.target.value)}
                  placeholder="Start Form"
                />
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: 'var(--space-2) 0' }} />

              <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>Icon</label>
                  <CustomDropdown
                    value={settings.icon}
                    options={COVER_ICONS}
                    onChange={(value) => handleChange('icon', value)}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>Animation</label>
                  <CustomDropdown
                    value={settings.animation}
                    options={COVER_ANIMATIONS}
                    onChange={(value) => handleChange('animation', value)}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>Font Family</label>
                <CustomDropdown
                  value={settings.fontFamily}
                  options={FONT_OPTIONS}
                  onChange={(value) => handleChange('fontFamily', value)}
                />
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>Background</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <input 
                      type="color" 
                      value={settings.backgroundColor} 
                      onChange={(e) => handleChange('backgroundColor', e.target.value)}
                      style={{ width: '36px', height: '36px', padding: 0, border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{settings.backgroundColor}</span>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>Text</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <input 
                      type="color" 
                      value={settings.textColor} 
                      onChange={(e) => handleChange('textColor', e.target.value)}
                      style={{ width: '36px', height: '36px', padding: 0, border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{settings.textColor}</span>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>Button</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <input 
                      type="color" 
                      value={settings.buttonColor} 
                      onChange={(e) => handleChange('buttonColor', e.target.value)}
                      style={{ width: '36px', height: '36px', padding: 0, border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{settings.buttonColor}</span>
                  </div>
                </div>
              </div>
              
            </div>
          </div>

          {/* Live Preview Area */}
          <div style={{ flex: 1, backgroundColor: 'var(--gray-100)', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: 'var(--space-3) var(--space-6)', backgroundColor: 'var(--gray-200)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-medium)' }}>
              Live Preview
            </div>
            
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-6)' }}>
              {/* Scaled down preview container */}
              <div style={{ 
                width: '100%', 
                maxWidth: '600px', 
                height: '100%',
                maxHeight: '600px',
                backgroundColor: settings.backgroundColor,
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-lg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 'var(--space-8)',
                fontFamily: `"${settings.fontFamily}", sans-serif`,
                overflow: 'hidden',
                position: 'relative'
              }}>
                <AnimatePresence mode="wait">
                  <motion.div 
                    key={settings.animation + settings.icon} // force re-render on animation/icon change for preview
                    {...getAnimationProps()}
                    style={{ textAlign: 'center', width: '100%' }}
                  >
                    <div
                      style={{ width: '80px', height: '80px', margin: '0 auto var(--space-6)', backgroundColor: `${settings.buttonColor}20`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: settings.buttonColor }}
                    >
                      <Icon name={settings.icon} size={40} />
                    </div>

                    <h1 
                      style={{ fontSize: 'var(--text-4xl)', marginBottom: 'var(--space-4)', color: settings.textColor, fontWeight: 'bold' }}
                    >
                      {settings.title || 'Form Title'}
                    </h1>
                    
                    <p 
                      style={{ fontSize: 'var(--text-lg)', color: settings.textColor, opacity: 0.8, marginBottom: 'var(--space-10)', lineHeight: '1.6' }}
                    >
                      {settings.description || 'Form Description goes here...'}
                    </p>
                    
                    <button 
                      style={{ 
                        padding: 'var(--space-4) var(--space-10)', 
                        fontSize: 'var(--text-xl)', 
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: settings.buttonColor,
                        color: '#ffffff',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: '600',
                        boxShadow: `0 4px 14px 0 ${settings.buttonColor}40`
                      }}
                    >
                      {settings.buttonText || 'Start'}
                    </button>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
          
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
