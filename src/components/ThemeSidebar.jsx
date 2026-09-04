import React, { useState, useEffect, useMemo } from 'react';
import Icon from './Icon/Icon';
import Loader from './Loader';
import { FONT_LIST } from '../constants/fonts';
import { loadGoogleFont } from '../utils/fontLoader';

const API_CATEGORIES = ['sans-serif', 'serif', 'display', 'handwriting', 'monospace'];

const THEME_COLORS = [
  '#000666', // RGUKT Blue (Default)
  '#ef4444', // Red
  '#f97316', // Orange
  '#eab308', // Yellow
  '#22c55e', // Green
  '#0ea5e9', // Sky blue
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#64748b', // Slate
];

function ThemeSidebar({ form, updateFormMeta, onClose }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [allFonts, setAllFonts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentScreen, setCurrentScreen] = useState('main');
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  
  const currentFont = form.settings?.theme?.fontFamily || 'Inter';
  const currentFormColor = form.settings?.theme?.color || '#000666';
  const currentTextColor = form.settings?.theme?.textColor || '#111827';
  const [colorMode, setColorMode] = useState('form');
  const currentColor = colorMode === 'form' ? currentFormColor : currentTextColor;

  useEffect(() => {
    setIsVisible(true);
    // Fetch 1600+ Google Fonts from open API
    fetch('https://api.fontsource.org/v1/fonts')
      .then(res => res.json())
      .then(data => {
        // Filter out non-google fonts if necessary, though most are.
        const googleFonts = data.filter(f => f.type === 'google');
        setAllFonts(googleFonts);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch fonts, falling back to curated list', err);
        setAllFonts(FONT_LIST);
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    // Load the currently selected font just in case
    loadGoogleFont(currentFont);
  }, [currentFont]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 300); // Wait for slide out animation
  };

  const handleSelectFont = (fontFamily) => {
    loadGoogleFont(fontFamily);
    const updatedSettings = {
      ...(form.settings || {}),
      theme: {
        ...(form.settings?.theme || {}),
        fontFamily,
        color: currentColor
      }
    };
    updateFormMeta('settings', updatedSettings);
  };

  const handleSelectColor = (color) => {
    const updatedSettings = {
      ...(form.settings || {}),
      theme: {
        ...(form.settings?.theme || {}),
        fontFamily: currentFont,
        color: colorMode === 'form' ? color : currentFormColor,
        textColor: colorMode === 'text' ? color : currentTextColor,
      }
    };
    updateFormMeta('settings', updatedSettings);
  };

  const handlePreviewFont = (fontFamily) => {
    loadGoogleFont(fontFamily);
  };

  const filteredFonts = useMemo(() => {
    if (isLoading) return [];
    
    let result = allFonts.filter(font => {
      const matchesSearch = font.family.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = activeCategory === 'All' || font.category === activeCategory;
      return matchesSearch && matchesCategory;
    });

    // To prevent the DOM from lagging with 1600+ items, we'll only render the first 100 matching results
    // If the user searches, they will instantly see the matching subset.
    return result.slice(0, 100);
  }, [allFonts, searchTerm, activeCategory, isLoading]);

  return (
    <>
      {/* Backdrop */}
      <div 
        style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.2)', zIndex: 190,
          opacity: isVisible && !isClosing ? 1 : 0, transition: 'opacity 0.3s ease'
        }}
        onClick={handleClose}
      />
      
      {/* Sidebar */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: '360px',
        backgroundColor: 'var(--bg-surface)', borderLeft: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-lg)', zIndex: 200, display: 'flex', flexDirection: 'column',
        transform: isVisible && !isClosing ? 'translateX(0)' : 'translateX(100%)', 
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        <div className="flex-between" style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--border-color)' }}>
          {currentScreen === 'main' ? (
            <h2 style={{ fontSize: 'var(--text-lg)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Icon name="theme" size={20} color="var(--primary-600)" /> Theme Options
            </h2>
          ) : (
            <button 
              style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 'var(--text-lg)', fontWeight: 'var(--font-weight-medium)', color: 'var(--text-primary)' }}
              onClick={() => setCurrentScreen('main')}
            >
              <Icon name="arrow-left" size={20} />
              {currentScreen === 'color' ? (colorMode === 'form' ? 'Form Color' : 'Text Color') : 'Text Style'}
            </button>
          )}
          <button className="btn-icon" onClick={handleClose}>
            <Icon name="close" size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'hidden' }}>
          
          {currentScreen === 'main' && (
            <div style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <button 
                className="flex-between" 
                style={{ width: '100%', padding: 'var(--space-4)', background: 'var(--gray-50)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
                onClick={() => { setColorMode('form'); setCurrentScreen('color'); }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: currentFormColor, border: '2px solid var(--bg-surface)', boxShadow: '0 0 0 1px var(--border-color)' }}></div>
                  <h3 style={{ fontSize: 'var(--text-base)', color: 'var(--text-primary)', margin: 0, fontWeight: 'var(--font-weight-medium)' }}>Form Color</h3>
                </div>
                <Icon name="arrow-right" size={20} color="var(--text-secondary)" />
              </button>

              <button 
                className="flex-between" 
                style={{ width: '100%', padding: 'var(--space-4)', background: 'var(--gray-50)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
                onClick={() => { setColorMode('text'); setCurrentScreen('color'); }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: currentTextColor, border: '2px solid var(--bg-surface)', boxShadow: '0 0 0 1px var(--border-color)' }}></div>
                  <h3 style={{ fontSize: 'var(--text-base)', color: 'var(--text-primary)', margin: 0, fontWeight: 'var(--font-weight-medium)' }}>Text Color</h3>
                </div>
                <Icon name="arrow-right" size={20} color="var(--text-secondary)" />
              </button>

              <button 
                className="flex-between" 
                style={{ width: '100%', padding: 'var(--space-4)', background: 'var(--gray-50)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
                onClick={() => setCurrentScreen('text')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', color: 'var(--text-primary)', fontWeight: 'bold', fontSize: '18px', fontFamily: 'serif' }}>A</div>
                  <h3 style={{ fontSize: 'var(--text-base)', color: 'var(--text-primary)', margin: 0, fontWeight: 'var(--font-weight-medium)' }}>Text Style</h3>
                </div>
                <Icon name="arrow-right" size={20} color="var(--text-secondary)" />
              </button>
            </div>
          )}

          {currentScreen === 'color' && (
            <div style={{ padding: 'var(--space-4)' }}>
              <button
                style={{
                  width: '100%', padding: 'var(--space-3)', marginBottom: 'var(--space-4)',
                  backgroundColor: 'var(--gray-50)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)',
                  fontSize: 'var(--text-sm)', color: 'var(--text-primary)', fontWeight: 'var(--font-weight-medium)'
                }}
                onClick={() => handleSelectColor(colorMode === 'form' ? '#000666' : '#111827')}
              >
                <Icon name="undo" size={16} /> Restore Default {colorMode === 'form' ? 'Form Color' : 'Text Color'}
              </button>
              <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                {THEME_COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => handleSelectColor(color)}
                    style={{
                      width: '40px', height: '40px', borderRadius: '50%', backgroundColor: color,
                      border: '3px solid', borderColor: currentColor === color ? 'var(--text-primary)' : 'transparent',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  >
                    {currentColor === color && <Icon name="check" size={20} color="#ffffff" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentScreen === 'text' && (
            <div style={{ padding: 'var(--space-4)', flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'hidden', minHeight: 0 }}>
              <button
                style={{
                  width: '100%', padding: 'var(--space-3)', marginBottom: 'var(--space-4)', flexShrink: 0,
                  backgroundColor: 'var(--gray-50)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)',
                  fontSize: 'var(--text-sm)', color: 'var(--text-primary)', fontWeight: 'var(--font-weight-medium)'
                }}
                onClick={() => handleSelectFont('Inter')}
              >
                <Icon name="undo" size={16} /> Restore Default Font
              </button>

              <div className="search-bar" style={{ width: '100%', marginBottom: 'var(--space-3)', flexShrink: 0 }}>
                <Icon name="search" size={16} className="search-icon" />
                <input 
                  type="text" 
                  placeholder="Search fonts..." 
                  className="search-input" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-2)', overflowX: 'auto', paddingBottom: 'var(--space-2)', marginBottom: 'var(--space-2)', msOverflowStyle: 'none', scrollbarWidth: 'none', flexShrink: 0 }}>
                <button 
                  className={`badge ${activeCategory === 'All' ? 'badge-success' : 'badge-draft'}`}
                  style={{ cursor: 'pointer', whiteSpace: 'nowrap', border: 'none' }}
                  onClick={() => setActiveCategory('All')}
                >
                  All
                </button>
                {API_CATEGORIES.map(cat => (
                  <button 
                    key={cat}
                    className={`badge ${activeCategory === cat ? 'badge-success' : 'badge-draft'}`}
                    style={{ cursor: 'pointer', whiteSpace: 'nowrap', border: 'none', textTransform: 'capitalize' }}
                    onClick={() => setActiveCategory(cat)}
                  >
                    {cat.replace('-', ' ')}
                  </button>
                ))}
              </div>

              <div style={{ flex: 1, overflowY: 'auto', paddingRight: 'var(--space-1)' }}>
                {isLoading && (
                  <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
                    <Loader />
                  </div>
                )}
                {!isLoading && filteredFonts.map(font => (
                  <button
                    key={font.family}
                    onMouseEnter={() => handlePreviewFont(font.family)}
                    onClick={() => handleSelectFont(font.family)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 'var(--space-3) var(--space-4)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid',
                      borderColor: currentFont === font.family ? 'var(--primary-500)' : 'transparent',
                      backgroundColor: currentFont === font.family ? 'var(--primary-50)' : 'transparent',
                      color: currentFont === font.family ? 'var(--primary-600)' : 'var(--text-primary)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all var(--transition-fast)',
                      marginBottom: 'var(--space-1)',
                      width: '100%'
                    }}
                    onMouseOver={(e) => {
                      if (currentFont !== font.family) e.currentTarget.style.backgroundColor = 'var(--gray-50)';
                    }}
                    onMouseOut={(e) => {
                      if (currentFont !== font.family) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <div>
                      <div style={{ fontFamily: `"${font.family}", sans-serif`, fontSize: '16px', lineHeight: 1.2 }}>
                        {font.family}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {font.category}
                      </div>
                    </div>
                    {currentFont === font.family && <Icon name="check" size={16} />}
                  </button>
                ))}
                {!isLoading && filteredFonts.length === 100 && (
                  <p style={{ textAlign: 'center', padding: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>
                    Showing top 100 results. Use search to find more.
                  </p>
                )}
                {!isLoading && filteredFonts.length === 0 && (
                  <p style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--text-secondary)' }}>No fonts found.</p>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}

export default ThemeSidebar;
