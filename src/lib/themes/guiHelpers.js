import {Theme, GUI_MAP} from './index.js';
import AddonHooks from '../../addons/hooks';
import {applyThemeFonts} from '../themes/fonts';
import './global-styles.css';

const BLOCK_COLOR_NAMES = [
    // Corresponds to the name of the object in blockColors
    'motion',
    'looks',
    'sounds',
    'control',
    'event',
    'sensing',
    'pen',
    'operators',
    'data',
    'data_lists',
    'more',
    'addons'
];

/**
 * @param {string} css CSS color or var(--...)
 * @returns {string} evaluated CSS
 */
const evaluateCSS = css => {
    const variableMatch = css.match(/^var\(([\w-]+)\)$/);
    if (variableMatch) {
        return document.documentElement.style.getPropertyValue(variableMatch[1]);
    }
    return css;
};

/**
 * Convert hex color to rgba with given opacity
 * @param {string} hex hex color string
 * @param {number} opacity opacity value (0-1)
 * @returns {string} rgba color string
 */
const hexToRgba = (hex, opacity) => {
    const cleanHex = hex.replace('#', '');
    const r = parseInt(cleanHex.substr(0, 2), 16);
    const g = parseInt(cleanHex.substr(2, 2), 16);
    const b = parseInt(cleanHex.substr(4, 2), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

/**
 * Apply transparency styling to a specific element
 * @param {Element} element the element to apply transparency to
 * @param {boolean} hasWallpaper whether wallpaper is active
 * @param {number} wallpaperOpacity opacity of the wallpaper (0.1 to 1.0)
 */
const applyTransparencyToElement = (element, hasWallpaper, wallpaperOpacity = 0.3) => {
    if (hasWallpaper) {
        // Calculate appropriate background transparency based on wallpaper opacity
        // Higher wallpaper opacity means we need more workspace transparency to see through
        const backgroundOpacity = Math.max(0.2, Math.min(0.8, 1 - wallpaperOpacity + 0.1));
        const guiColors = document.documentElement.style.getPropertyValue('--ui-primary') || '#e5f0ff';
        const backgroundColor = guiColors.startsWith('#') ?
            hexToRgba(guiColors, backgroundOpacity) :
            `rgba(229, 240, 255, ${backgroundOpacity})`;
        element.style.backgroundColor = backgroundColor;
    } else {
        // Remove transparency styling
        element.style.backgroundColor = '';
    }
};

/**
 * Apply or remove transparency from the blocks workspace using JavaScript
 * @param {boolean} hasWallpaper whether wallpaper is active
 * @param {number} wallpaperOpacity opacity of the wallpaper (0.1 to 1.0)
 * @param {number} retryCount current retry attempt (for internal use)
 */
const applyBlocksWorkspaceTransparency = (hasWallpaper, wallpaperOpacity = 0.3, retryCount = 0) => {
    // Find the blocks workspace SVG element using the specific selector
    const blocksSvg = document.querySelector('svg.blocklySvg');
    
    if (!blocksSvg) {
        // Fallback to a more general selector if the specific one doesn't work
        const fallbackSvg = document.querySelector('svg.blocklySvg');
        if (fallbackSvg) {
            applyTransparencyToElement(fallbackSvg, hasWallpaper, wallpaperOpacity);
            return;
        }
        
        // If no blocks workspace is found and we haven't retried too many times, try again
        // This handles cases where wallpaper is applied before blocks are loaded
        const maxRetries = 20; // Try for up to 10 seconds (50ms * 20 = 1000ms, then exponential backoff)
        if (retryCount < maxRetries) {
            // Use exponential backoff: start with 50ms, then increase
            const delay = retryCount < 10 ? 50 : Math.min(500, 50 * Math.pow(2, retryCount - 10));
            setTimeout(() => {
                applyBlocksWorkspaceTransparency(hasWallpaper, wallpaperOpacity, retryCount + 1);
            }, delay);
        }
        return;
    }
    
    applyTransparencyToElement(blocksSvg, hasWallpaper, wallpaperOpacity);
};


// Keep track of the current wallpaper state for observer
let currentWallpaperState = {hasWallpaper: false, opacity: 0.3};

/**
 * Observer to watch for blocks workspace changes and apply transparency when needed
 */
const createBlocksWorkspaceObserver = () => {
    // Only create observer if we don't already have one
    if (window.blocksWorkspaceObserver) {
        return;
    }
    
    const observer = new MutationObserver(mutations => {
        for (const mutation of mutations) {
            if (mutation.type === 'childList') {
                // Check for both specific and general blocks workspace selectors
                const blocksSvg = document.querySelector('svg.blocklySvg');
                
                if (blocksSvg && currentWallpaperState.hasWallpaper) {
                    // Apply transparency to newly created blocks workspace
                    applyTransparencyToElement(blocksSvg, true, currentWallpaperState.opacity);
                    
                    // Also check for any nested SVG elements that might need transparency
                    const nestedSvgs = blocksSvg.querySelectorAll('svg');
                    for (let i = 0; i < nestedSvgs.length; i++) {
                        applyTransparencyToElement(nestedSvgs[i], true, currentWallpaperState.opacity);
                    }
                    break;
                }
            }
        }
    });
    
    // Observe the entire document for changes
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    window.blocksWorkspaceObserver = observer;
};

/**
 * Update the observer's knowledge of current wallpaper state
 * @param {boolean} hasWallpaper whether wallpaper is active
 * @param {number} opacity wallpaper opacity
 */
const updateWallpaperObserverState = (hasWallpaper, opacity = 0.3) => {
    currentWallpaperState = {hasWallpaper, opacity};
    
    if (hasWallpaper) {
        createBlocksWorkspaceObserver();
        
        // Also add a listener for workspace creation events if available
        if (window.AddonHooks && window.AddonHooks.workspaceCreated) {
            window.AddonHooks.workspaceCreated(() => {
                if (currentWallpaperState.hasWallpaper) {
                    // Small delay to ensure workspace is fully initialized
                    setTimeout(() => {
                        applyBlocksWorkspaceTransparency(true, currentWallpaperState.opacity);
                    }, 50);
                }
            });
        }
    } else if (window.blocksWorkspaceObserver) {
        // Clean up observer when no wallpaper is active
        window.blocksWorkspaceObserver.disconnect();
        window.blocksWorkspaceObserver = null;
    }
};

/**
 * Apply wallpaper background to the GUI
 * @param {object} wallpaper wallpaper configuration
 */
const applyWallpaper = wallpaper => {
    const target = document.querySelector("[class*='blocks-wrapper_']");

    let checkCountTarget = 0;
    if (!target) {
        const maxChecks = 50;
        const checkInterval = setInterval(() => {
            checkCountTarget++;
            const newTarget = document.querySelector("[class*='blocks-wrapper_']");
            if (newTarget) {
                applyWallpaper(wallpaper);
                clearInterval(checkInterval);
            } else if (checkCountTarget >= maxChecks) {
                clearInterval(checkInterval);
            }
        }, 500);
        return;
    }

    if (wallpaper.url) {
        // Apply opacity by creating a semi-transparent overlay
        const opacity = Math.max(0.1, Math.min(1, wallpaper.opacity || 0.3));
        const overlayOpacity = 1 - opacity;
        
        // Apply darkness tinting with black overlay
        const darkness = Math.max(0, Math.min(0.8, wallpaper.darkness || 0));
        
        // Create a composite background with the image and darkness overlay
        // The darkness overlay is applied as a black semi-transparent layer over the image
        if (darkness > 0) {
            target.style.backgroundImage = `
                linear-gradient(rgba(0, 0, 0, ${darkness}), rgba(0, 0, 0, ${darkness})),
                url("${wallpaper.url}")
            `;
        } else {
            target.style.backgroundImage = `url("${wallpaper.url}")`;
        }
        
        target.style.backgroundSize = 'cover';
        target.style.backgroundPosition = 'center';
        target.style.backgroundRepeat = 'no-repeat';
        target.style.backgroundAttachment = 'fixed';
        
        // Use CSS custom properties for overlay and darkness
        document.documentElement.style.setProperty('--wallpaper-overlay-opacity', overlayOpacity.toString());
        document.documentElement.style.setProperty('--wallpaper-darkness', darkness.toString());
        
        // Apply JavaScript-based transparency to blocks workspace
        applyBlocksWorkspaceTransparency(true, opacity);
        
        // Update observer state for future blocks workspace changes
        updateWallpaperObserverState(true, opacity);
        
        // Also set up a periodic check for blocks workspace in case it loads later
        let checkCount = 0;
        const maxChecks = 50;
        const checkInterval = setInterval(() => {
            checkCount++;
            const blocksSvg = document.querySelector('svg.blocklySvg');
            
            if (blocksSvg) {
                // Found the blocks workspace, apply transparency and stop checking
                applyTransparencyToElement(blocksSvg, true, opacity);
                clearInterval(checkInterval);
            } else if (checkCount >= maxChecks) {
                // Stop checking after max attempts
                clearInterval(checkInterval);
            }
        }, 500);
    } else {
        // Remove wallpaper
        target.style.backgroundImage = '';
        target.style.backgroundSize = '';
        target.style.backgroundPosition = '';
        target.style.backgroundRepeat = '';
        target.style.backgroundAttachment = '';
        document.documentElement.style.removeProperty('--wallpaper-overlay-opacity');
        document.documentElement.style.removeProperty('--wallpaper-darkness');
        
        // Remove transparency from blocks workspace
        applyBlocksWorkspaceTransparency(false);
        
        // Update observer state
        updateWallpaperObserverState(false);
    }
};

/**
 * @param {Theme} theme the theme
 */
const applyGuiColors = theme => {
    const doc = document.documentElement;

    const defaultGuiColors = (Theme.defaults && Theme.defaults.light &&
                              typeof Theme.defaults.light.getGuiColors === 'function') ?
        Theme.defaults.light.getGuiColors() :
        (GUI_MAP && GUI_MAP.light && GUI_MAP.light.guiColors) || {};
    for (const [name, value] of Object.entries(defaultGuiColors)) {
        doc.style.setProperty(`--${name}-default`, value);
    }

    const guiColors = theme.getGuiColors();
    for (const [name, defaultValue] of Object.entries(defaultGuiColors)) {
        const value = Object.prototype.hasOwnProperty.call(guiColors, name) ? guiColors[name] : defaultValue;
        doc.style.setProperty(`--${name}`, value);

        // Convert hex colors to RGB values for overlay purposes
        if (name === 'ui-primary' && typeof value === 'string' && value.startsWith('#')) {
            const hex = value.replace('#', '');
            const r = parseInt(hex.substr(0, 2), 16);
            const g = parseInt(hex.substr(2, 2), 16);
            const b = parseInt(hex.substr(4, 2), 16);
            doc.style.setProperty('--ui-primary-rgb', `${r}, ${g}, ${b}`);
        } else if (name === 'ui-primary' && typeof value === 'string' && value.startsWith('hsla')) {
            // For HSLA values, set a default RGB fallback
            doc.style.setProperty('--ui-primary-rgb', '229, 240, 255');
        }
    }

    for (const [name, value] of Object.entries(guiColors)) {
        if (!Object.prototype.hasOwnProperty.call(defaultGuiColors, name)) {
            doc.style.setProperty(`--${name}`, value);
        }
    }

    const blockColors = theme.getBlockColors();
    doc.style.setProperty('--editorTheme3-blockText', blockColors.text);
    doc.style.setProperty('--editorTheme3-inputColor', blockColors.textField);
    doc.style.setProperty('--editorTheme3-inputColor-text', blockColors.textFieldText);
    for (const color of BLOCK_COLOR_NAMES) {
        doc.style.setProperty(`--editorTheme3-${color}-primary`, blockColors[color].primary);
        doc.style.setProperty(`--editorTheme3-${color}-secondary`, blockColors[color].secondary);
        doc.style.setProperty(`--editorTheme3-${color}-tertiary`, blockColors[color].tertiary);
        doc.style.setProperty(`--editorTheme3-${color}-field-background`, blockColors[color].quaternary);
    }
    
    // Set workspace-specific colors from GUI themes
    if (blockColors.workspace) {
        doc.style.setProperty('--editorTheme3-workspace-background', blockColors.workspace);
    }
    if (blockColors.toolbox) {
        doc.style.setProperty('--editorTheme3-toolbox-background', blockColors.toolbox);
    }
    if (blockColors.toolboxText || blockColors.flyoutLabelColor) {
        doc.style.setProperty('--editorTheme3-toolbox-text', blockColors.toolboxText || blockColors.flyoutLabelColor);
    }
    if (blockColors.flyout) {
        doc.style.setProperty('--editorTheme3-flyout-background', blockColors.flyout);
    }
    if (blockColors.flyoutText || blockColors.flyoutLabelColor) {
        doc.style.setProperty('--editorTheme3-flyout-text', blockColors.flyoutText || blockColors.flyoutLabelColor);
    }
    if (blockColors.scrollbar) {
        doc.style.setProperty('--editorTheme3-scrollbar', blockColors.scrollbar);
    }
    if (blockColors.gridColor) {
        doc.style.setProperty('--editorTheme3-grid-color', blockColors.gridColor);
    }

    // Some browsers will color their interfaces to match theme-color, so if we make it the same color as our
    // menu bar, it'll look pretty cool.
    let metaThemeColor = document.head.querySelector('meta[name=theme-color]');
    if (!metaThemeColor) {
        metaThemeColor = document.createElement('meta');
        metaThemeColor.setAttribute('name', 'theme-color');
        document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.setAttribute('content', evaluateCSS(guiColors['menu-bar-background']));

    // a horrible hack for icons...
    window.Recolor = {
        primary: guiColors['looks-secondary']
    };
    AddonHooks.recolorCallbacks.forEach(i => i());

    // Apply wallpaper
    applyWallpaper(theme.wallpaper);
    
    // Apply fonts (async but don't block UI)
    applyThemeFonts(theme.fonts).catch(console.error);
};

export {
    applyGuiColors,
    applyWallpaper,
    applyBlocksWorkspaceTransparency
};
