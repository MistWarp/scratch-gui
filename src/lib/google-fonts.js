/**
 * Google Fonts integration utility
 */

const GOOGLE_FONTS_API_KEY = process.env.GOOGLE_FONTS_API_KEY || 'demo'; // Can be set via environment
const GOOGLE_FONTS_API_URL = 'https://www.googleapis.com/webfonts/v1/webfonts';

// Popular Google Fonts list for quick selection
const POPULAR_GOOGLE_FONTS = [
    'Open Sans',
    'Roboto',
    'Lato',
    'Montserrat',
    'Source Sans Pro',
    'Roboto Condensed',
    'Oswald',
    'Raleway',
    'Nunito',
    'Ubuntu',
    'Playfair Display',
    'Merriweather',
    'PT Sans',
    'Poppins',
    'Fira Sans',
    'Work Sans',
    'Roboto Slab',
    'Crimson Text',
    'Droid Sans',
    'Libre Baskerville'
];

let fontsCache = null;
let loadingPromise = null;

/**
 * Load a Google Font by adding a link tag to the document head
 * @param {string} fontFamily - The font family name
 * @param {string[]} weights - Array of font weights (e.g., ['400', '700'])
 * @returns {undefined}
 */
const loadGoogleFont = (fontFamily, weights = ['400']) => new Promise((resolve, reject) => {
    const fontName = fontFamily.replace(/\s+/g, '+');
    const weightStr = weights.join(',');
    const url = `https://fonts.googleapis.com/css2?family=${fontName}:wght@${weightStr}&display=swap`;
        
    // Check if already loaded
    const existingLink = document.querySelector(`link[href*="${fontName}"]`);
    if (existingLink) {
        resolve();
        return;
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
        
    link.onload = () => resolve();
    link.onerror = () => reject(new Error(`Failed to load font: ${fontFamily}`));
        
    document.head.appendChild(link);
});

/**
 * Get list of available Google Fonts
 * @returns {Promise<Array>} Array of font objects with family, category, variants
 */
const getGoogleFontsList = () => {
    if (fontsCache) {
        return fontsCache;
    }

    if (loadingPromise) {
        return loadingPromise;
    }

    loadingPromise = (async () => {
        try {
            // For demo purposes, return popular fonts if no API key
            if (GOOGLE_FONTS_API_KEY === 'demo') {
                fontsCache = POPULAR_GOOGLE_FONTS.map(family => ({
                    family,
                    category: 'sans-serif',
                    variants: ['regular', '700']
                }));
                return fontsCache;
            }

            const response = await fetch(`${GOOGLE_FONTS_API_URL}?key=${GOOGLE_FONTS_API_KEY}&sort=popularity`);
            
            if (!response.ok) {
                throw new Error(`Google Fonts API error: ${response.status}`);
            }

            const data = await response.json();
            fontsCache = data.items || [];
            return fontsCache;
        } catch (error) {
            console.warn('Failed to load Google Fonts list, using popular fonts:', error);
            // Fallback to popular fonts
            fontsCache = POPULAR_GOOGLE_FONTS.map(family => ({
                family,
                category: 'sans-serif',
                variants: ['regular', '700']
            }));
            return fontsCache;
        }
    })();

    return loadingPromise;
};

/**
 * Search Google Fonts by name
 * @param {string} query - Search query
 * @returns {Promise<Array>} Filtered array of font objects
 */
const searchGoogleFonts = async query => {
    const fonts = await getGoogleFontsList();
    const lowercaseQuery = query.toLowerCase();
    
    return fonts.filter(font =>
        font.family.toLowerCase().includes(lowercaseQuery)
    ).slice(0, 10); // Limit results
};

/**
 * Check if a font is a Google Font
 * @param {string} fontFamily - Font family name
 * @returns {boolean} if a font family is on google fonts
 */
const isGoogleFont = async fontFamily => {
    const fonts = await getGoogleFontsList();
    return fonts.some(font => font.family.toLowerCase() === fontFamily.toLowerCase());
};

/**
 * Get popular Google Fonts for quick selection
 * @returns {Array<string>} Array of popular font family names
 */
const getPopularGoogleFonts = () => [...POPULAR_GOOGLE_FONTS];

/**
 * Remove a Google Font from the document
 * @param {string} fontFamily - The font family name to remove
 */
const removeGoogleFont = fontFamily => {
    const fontName = fontFamily.replace(/\s+/g, '+');
    const existingLink = document.querySelector(`link[href*="${fontName}"]`);
    if (existingLink) {
        existingLink.remove();
    }
};

export {
    loadGoogleFont,
    getGoogleFontsList,
    searchGoogleFonts,
    isGoogleFont,
    getPopularGoogleFonts,
    removeGoogleFont
};
