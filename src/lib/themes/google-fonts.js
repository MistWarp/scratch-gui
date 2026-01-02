/**
 * Google Fonts integration utility
 */

const GOOGLE_FONTS_API_KEY = process.env.GOOGLE_FONTS_API_KEY || 'demo'; // Can be set via environment
const GOOGLE_FONTS_API_URL = 'https://www.googleapis.com/webfonts/v1/webfonts';
const GOOGLE_FONTS_METADATA_URL = 'https://fonts.google.com/metadata/fonts';

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

const normalizeFamily = fontFamily => (fontFamily || '').trim();

const encodeCss2Family = fontFamily => encodeURIComponent(normalizeFamily(fontFamily)).replace(/%20/g, '+');

const uniqSortedWeights = weights => {
    const normalized = (weights || [])
        .map(w => String(w).trim())
        .filter(Boolean)
        .map(w => (w === 'regular' ? '400' : w));
    return [...new Set(normalized)].sort((a, b) => Number(a) - Number(b));
};

const buildCss2AxisSpecifier = (weights, {includeItalic}) => {
    const w = uniqSortedWeights(weights);
    const fallback = w.length ? w : ['400', '700'];
    if (includeItalic) {
        const entries = [];
        for (const weight of fallback) {
            entries.push(`0,${weight}`);
        }
        for (const weight of fallback) {
            entries.push(`1,${weight}`);
        }
        return `ital,wght@${entries.join(';')}`;
    }
    return `wght@${fallback.join(';')}`;
};

const getOrCreateGoogleFontLink = fontFamily => {
    const family = normalizeFamily(fontFamily);
    const existing = document.querySelector(`link[data-google-font="${CSS.escape(family)}"]`);
    if (existing) return existing;

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.setAttribute('data-google-font', family);
    document.head.appendChild(link);
    return link;
};

const fetchGoogleFontsMetadata = async () => {
    const response = await fetch(GOOGLE_FONTS_METADATA_URL);
    if (!response.ok) {
        throw new Error(`Google Fonts metadata error: ${response.status}`);
    }

    const text = await response.text();
    const jsonText = text.replace(/^\)\]\}'\n/, '');
    const data = JSON.parse(jsonText);
    const list = data.familyMetadataList || [];

    return list.map(item => ({
        family: item.family,
        category: item.category || 'sans-serif',
        variants: item.fonts ? Object.keys(item.fonts) : []
    }));
};

/**
 * Load a Google Font by adding a link tag to the document head
 * @param {string} fontFamily - The font family name
 * @param {string[]} weightsOrOptions - Array of font weights (e.g., ['400', '700'])
 * @returns {undefined}
 */
const loadGoogleFont = (fontFamily, weightsOrOptions) => new Promise((resolve, reject) => {
    const family = normalizeFamily(fontFamily);
    if (!family) {
        resolve();
        return;
    }

    // Back-compat: second arg used to be an array of weights
    const includeItalic = !weightsOrOptions || Array.isArray(weightsOrOptions) ?
        true : (weightsOrOptions.includeItalic !== false);
    
    const weights = Array.isArray(weightsOrOptions) ? weightsOrOptions : (weightsOrOptions && weightsOrOptions.weights);

    const familyParam = encodeCss2Family(family);
    const axis = buildCss2AxisSpecifier(weights, {includeItalic});
    const url = `https://fonts.googleapis.com/css2?family=${familyParam}:${axis}&display=swap`;

    const link = getOrCreateGoogleFontLink(family);
    if (link.href === url) {
        resolve();
        return;
    }

    link.onload = () => resolve();
    link.onerror = () => reject(new Error(`Failed to load font: ${family}`));
    link.href = url;
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
            // If no API key, fall back to the public metadata endpoint (no key required).
            if (GOOGLE_FONTS_API_KEY === 'demo') {
                try {
                    fontsCache = await fetchGoogleFontsMetadata();
                    return fontsCache;
                } catch (error) {
                    // If metadata fetch fails (offline/CSP/etc.), fall back to popular fonts.
                    fontsCache = POPULAR_GOOGLE_FONTS.map(family => ({
                        family,
                        category: 'sans-serif',
                        variants: ['regular', '700']
                    }));
                    return fontsCache;
                }
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
    const family = normalizeFamily(fontFamily);
    const existingLink = family ? document.querySelector(`link[data-google-font="${CSS.escape(family)}"]`) : null;
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
