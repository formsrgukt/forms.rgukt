import React, { useState, useEffect, useMemo } from 'react';
import Icon from './Icon/Icon';
import { FONT_LIST } from '../constants/fonts';
import { loadGoogleFont } from '../utils/fontLoader';

const API_CATEGORIES = ['sans-serif', 'serif', 'display', 'handwriting', 'monospace'];

function ThemeSidebar({ form, updateFormMeta, onClose }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [allFonts, setAllFonts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const currentFont = form.settings?.theme?.fontFamily || 'Inter';

  useEffect(() => {
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

  const handleSelectFont = (fontFamily) => {
    loadGoogleFont(fontFamily);
    const updatedSettings = {
      ...(form.settings || {}),
      theme: {
        ...(form.settings?.theme || {}),
        fontFamily
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
        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.2)', zIndex: 190 }}
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: '360px',
        backgroundColor: 'var(--bg-surface)', borderLeft: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-lg)', zIndex: 200, display: 'flex', flexDirection: 'column',
        transform: 'translateX(0)', transition: 'transform var(--transition-normal)'
      }}>
        <div className="flex-between" style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--border-color)' }}>
          <h2 style={{ fontSize: 'var(--text-lg)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Icon name="theme" size={20} color="var(--primary-600)" /> Theme Options
          </h2>
          <button className="btn-icon" onClick={onClose}>
            <Icon name="close" size={20} />
          </button>
        </div>

        <div style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', flex: 1, overflowY: 'auto' }}>
          
          <div>
            <h3 style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>Text Style</h3>
            <div className="search-bar" style={{ width: '100%', marginBottom: 'var(--space-3)' }}>
              <Icon name="search" size={16} className="search-icon" />
              <input 
                type="text" 
                placeholder="Search fonts..." 
                className="search-input" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-2)', overflowX: 'auto', paddingBottom: 'var(--space-2)', marginBottom: 'var(--space-2)', msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
              {isLoading && (
                <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                  <p style={{ color: 'var(--text-secondary)' }}>Loading 1,600+ fonts...</p>
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

        </div>
      </div>
    </>
  );
}

export default ThemeSidebar;
