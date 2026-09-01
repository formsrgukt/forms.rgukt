export const FONT_CATEGORIES = [
  'Modern SaaS',
  'Academic',
  'Minimal',
  'Elegant',
  'Geometric',
  'Editorial',
  'Creative',
  'Display'
];

export const FONTS = [
  // Modern SaaS
  { family: 'Inter', category: 'Modern SaaS' },
  { family: 'Roboto', category: 'Modern SaaS' },
  { family: 'Open Sans', category: 'Modern SaaS' },
  { family: 'Lato', category: 'Modern SaaS' },
  { family: 'Montserrat', category: 'Modern SaaS' },
  { family: 'Source Sans 3', category: 'Modern SaaS' },
  { family: 'Poppins', category: 'Modern SaaS' },
  { family: 'Nunito', category: 'Modern SaaS' },
  { family: 'Work Sans', category: 'Modern SaaS' },
  { family: 'Fira Sans', category: 'Modern SaaS' },
  { family: 'Rubik', category: 'Modern SaaS' },
  { family: 'Heebo', category: 'Modern SaaS' },
  { family: 'Mukta', category: 'Modern SaaS' },
  { family: 'Public Sans', category: 'Modern SaaS' },
  
  // Academic
  { family: 'Merriweather', category: 'Academic' },
  { family: 'Lora', category: 'Academic' },
  { family: 'PT Serif', category: 'Academic' },
  { family: 'Crimson Text', category: 'Academic' },
  { family: 'EB Garamond', category: 'Academic' },
  { family: 'Libre Baskerville', category: 'Academic' },
  { family: 'Bitter', category: 'Academic' },
  { family: 'Noto Serif', category: 'Academic' },
  { family: 'Source Serif 4', category: 'Academic' },
  { family: 'Zilla Slab', category: 'Academic' },
  { family: 'Tinos', category: 'Academic' },
  { family: 'Cardo', category: 'Academic' },
  
  // Minimal
  { family: 'Quicksand', category: 'Minimal' },
  { family: 'Manrope', category: 'Minimal' },
  { family: 'DM Sans', category: 'Minimal' },
  { family: 'Mulish', category: 'Minimal' },
  { family: 'Hind', category: 'Minimal' },
  { family: 'Karla', category: 'Minimal' },
  { family: 'Josefin Sans', category: 'Minimal' },
  { family: 'Cabin', category: 'Minimal' },
  { family: 'Varela Round', category: 'Minimal' },
  { family: 'Outfit', category: 'Minimal' },
  { family: 'Sen', category: 'Minimal' },
  { family: 'Epilogue', category: 'Minimal' },

  // Elegant
  { family: 'Playfair Display', category: 'Elegant' },
  { family: 'Cormorant Garamond', category: 'Elegant' },
  { family: 'Cinzel', category: 'Elegant' },
  { family: 'Marcellus', category: 'Elegant' },
  { family: 'Prata', category: 'Elegant' },
  { family: 'Bodoni Moda', category: 'Elegant' },
  { family: 'Sorts Mill Goudy', category: 'Elegant' },
  { family: 'Vollkorn', category: 'Elegant' },
  { family: 'Amiri', category: 'Elegant' },
  { family: 'Philosopher', category: 'Elegant' },
  
  // Geometric
  { family: 'Plus Jakarta Sans', category: 'Geometric' },
  { family: 'Space Grotesk', category: 'Geometric' },
  { family: 'Syne', category: 'Geometric' },
  { family: 'Prompt', category: 'Geometric' },
  { family: 'Archivo', category: 'Geometric' },
  { family: 'Spartan', category: 'Geometric' },
  { family: 'Questrial', category: 'Geometric' },
  { family: 'Chivo', category: 'Geometric' },
  { family: 'Lexend', category: 'Geometric' },
  { family: 'Jost', category: 'Geometric' },
  { family: 'Commissioner', category: 'Geometric' },
  { family: 'Kumbh Sans', category: 'Geometric' },

  // Editorial
  { family: 'Abril Fatface', category: 'Editorial' },
  { family: 'Aleo', category: 'Editorial' },
  { family: 'Arvo', category: 'Editorial' },
  { family: 'Roboto Slab', category: 'Editorial' },
  { family: 'Josefin Slab', category: 'Editorial' },
  { family: 'Frank Ruhl Libre', category: 'Editorial' },
  { family: 'BioRhyme', category: 'Editorial' },
  { family: 'Lora', category: 'Editorial' },
  { family: 'Spectral', category: 'Editorial' },
  { family: 'Fraunces', category: 'Editorial' },
  { family: 'Domine', category: 'Editorial' },
  { family: 'Neuton', category: 'Editorial' },

  // Creative
  { family: 'Dancing Script', category: 'Creative' },
  { family: 'Pacifico', category: 'Creative' },
  { family: 'Caveat', category: 'Creative' },
  { family: 'Shadows Into Light', category: 'Creative' },
  { family: 'Satisfy', category: 'Creative' },
  { family: 'Great Vibes', category: 'Creative' },
  { family: 'Sacramento', category: 'Creative' },
  { family: 'Kalam', category: 'Creative' },
  { family: 'Courgette', category: 'Creative' },
  { family: 'Yellowtail', category: 'Creative' },
  { family: 'Permanent Marker', category: 'Creative' },
  { family: 'Patrick Hand', category: 'Creative' },
  { family: 'Rock Salt', category: 'Creative' },

  // Display
  { family: 'Oswald', category: 'Display' },
  { family: 'Bebas Neue', category: 'Display' },
  { family: 'Anton', category: 'Display' },
  { family: 'Righteous', category: 'Display' },
  { family: 'Alfa Slab One', category: 'Display' },
  { family: 'Bangers', category: 'Display' },
  { family: 'Fredoka One', category: 'Display' },
  { family: 'Carter One', category: 'Display' },
  { family: 'Patua One', category: 'Display' },
  { family: 'Passion One', category: 'Display' },
  { family: 'Russo One', category: 'Display' },
  { family: 'Paytone One', category: 'Display' },
  { family: 'Bungee', category: 'Display' },
  { family: 'Fjalla One', category: 'Display' },
  { family: 'Teko', category: 'Display' }
];

// Deduplicate fonts (in case I accidentally added one twice)
const uniqueFonts = Array.from(new Set(FONTS.map(a => a.family)))
  .map(family => {
    return FONTS.find(a => a.family === family)
  });

export const FONT_LIST = uniqueFonts.sort((a, b) => a.family.localeCompare(b.family));
