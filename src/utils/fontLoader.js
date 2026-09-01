const loadedFonts = new Set(['Inter', 'Plus Jakarta Sans']); // Default fonts already in index.html

export function loadGoogleFont(fontFamily) {
  if (!fontFamily || loadedFonts.has(fontFamily)) {
    return;
  }
  
  // Create a link tag
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  
  // Format family name for Google Fonts URL (e.g., "Plus Jakarta Sans" -> "Plus+Jakarta+Sans")
  const formattedName = fontFamily.replace(/ /g, '+');
  link.href = `https://fonts.googleapis.com/css2?family=${formattedName}:wght@400;500;600;700&display=swap`;
  
  document.head.appendChild(link);
  loadedFonts.add(fontFamily);
}
