/**
 * Custom theme management for Mistwarp
 * Handles creation, storage, and management of user-defined themes including custom gradients and accents
 */

import {Theme, GUI_MAP} from './index.js';
import {mergeStoredAppearance} from './appearance.js';

const CUSTOM_THEMES_STORAGE_KEY = 'tw:custom-themes';
const MAX_CUSTOM_THEMES = 50; // Reasonable limit to prevent storage issues

/**
 * Utility functions for custom gradients and accent creation
 */
class GradientUtils {
    /**
     * Create a linear gradient CSS string from color stops
     * @param {Array} colorStops - Array of {color: string, position: number} objects
     * @param {number} direction - Gradient direction in degrees (default: 90 for horizontal)
     * @returns {string} CSS linear-gradient string
     */
    static createLinearGradient (colorStops, direction = 90) {
        if (!Array.isArray(colorStops) || colorStops.length < 2) {
            throw new Error('At least 2 color stops are required');
        }

        const sortedStops = colorStops
            .sort((a, b) => a.position - b.position)
            .map(stop => `${stop.color} ${stop.position}%`);

        return `linear-gradient(${direction}deg, ${sortedStops.join(', ')})`;
    }

    /**
     * Convert hex color to RGBA
     * @param {string} hex - Hex color string
     * @param {number} opacity - Opacity value (0-1)
     * @returns {string} RGBA color string
     */
    static hexToRgba (hex, opacity = 1) {
        const cleanHex = hex.replace('#', '');
        const r = parseInt(cleanHex.substr(0, 2), 16);
        const g = parseInt(cleanHex.substr(2, 2), 16);
        const b = parseInt(cleanHex.substr(4, 2), 16);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }

    /**
     * Convert hex to HSL
     * @param {string} hex - Hex color string
     * @returns {object} HSL object {h, s, l}
     */
    static hexToHsl (hex) {
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h; let s; const l = (max + min) / 2;

        if (max === min) {
            h = s = 0; // achromatic
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
            case r: h = ((g - b) / d) + (g < b ? 6 : 0); break;
            case g: h = ((b - r) / d) + 2; break;
            case b: h = ((r - g) / d) + 4; break;
            }
            h /= 6;
        }

        return {
            h: Math.round(h * 360),
            s: Math.round(s * 100),
            l: Math.round(l * 100)
        };
    }

    /**
     * Convert HSL to hex
     * @param {number} h - Hue (0-360)
     * @param {number} s - Saturation (0-100)
     * @param {number} l - Lightness (0-100)
     * @returns {string} Hex color string
     */
    static hslToHex (h, s, l) {
        h /= 360;
        s /= 100;
        l /= 100;

        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (((q - p) * 6) * t);
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (((q - p) * ((2 / 3) - t)) * 6);
            return p;
        };

        let r; let g; let b;
        if (s === 0) {
            r = g = b = l; // achromatic
        } else {
            const q = l < 0.5 ? l * (1 + s) : l + s - (l * s);
            const p = (2 * l) - q;
            r = hue2rgb(p, q, h + (1 / 3));
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - (1 / 3));
        }

        const toHex = c => {
            const hex = Math.round(c * 255).toString(16);
            return hex.length === 1 ? `0${hex}` : hex;
        };

        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }

    /**
     * Lighten a color by percentage
     * @param {string} hex - Hex color string
     * @param {number} percent - Percentage to lighten (0-100)
     * @returns {string} Lightened hex color
     */
    static lightenColor (hex, percent) {
        const hsl = this.hexToHsl(hex);
        hsl.l = Math.min(100, hsl.l + percent);
        return this.hslToHex(hsl.h, hsl.s, hsl.l);
    }

    /**
     * Darken a color by percentage
     * @param {string} hex - Hex color string
     * @param {number} percent - Percentage to darken (0-100)
     * @returns {string} Darkened hex color
     */
    static darkenColor (hex, percent) {
        const hsl = this.hexToHsl(hex);
        hsl.l = Math.max(0, hsl.l - percent);
        return this.hslToHex(hsl.h, hsl.s, hsl.l);
    }

    /**
     * Generate color variations for an accent theme
     * @param {string} baseColor - Base hex color
     * @returns {object} Color variations
     */
    static generateColorVariations (baseColor) {
        return {
            primary: baseColor,
            light: this.lightenColor(baseColor, 15),
            lighter: this.lightenColor(baseColor, 30),
            dark: this.darkenColor(baseColor, 15),
            darker: this.darkenColor(baseColor, 30),
            transparent: this.hexToRgba(baseColor, 0.35),
            lightTransparent: this.hexToRgba(baseColor, 0.15),
            mediumTransparent: this.hexToRgba(baseColor, 0.75)
        };
    }

    /**
     * Generate accent theme colors from a primary color
     * @param {string} primaryColor - Primary color (hex, rgb, hsl, etc.)
     * @param {object} options - Options for color generation
     * @returns {object} Generated accent colors
     */
    static generateAccentColors (primaryColor) {
        const variations = this.generateColorVariations(primaryColor);

        return {
            'motion-primary': variations.primary,
            'motion-primary-transparent': variations.mediumTransparent,
            'motion-tertiary': variations.dark,

            'looks-secondary': variations.primary,
            'looks-tertiary': variations.dark,
            'looks-transparent': variations.transparent,
            'looks-light-transparent': variations.lightTransparent,
            'looks-secondary-dark': variations.dark,

            'extensions-primary': variations.light,
            'extensions-tertiary': variations.lighter,
            'extensions-transparent': variations.transparent,
            'extensions-light': variations.lighter,

            'drop-highlight': variations.light
        };
    }

    /**
     * Create a custom gradient accent theme
     * @param {Array} colorStops - Gradient color stops
     * @param {string} primaryColor - Primary accent color
     * @param {object} options - Additional options
     * @returns {object} Custom accent theme object
     */
    static createGradientAccent (colorStops, primaryColor, options = {}) {
        const baseColors = this.generateAccentColors(primaryColor, options);

        // Create a version with reduced opacity for menu bar background
        const gradientStopsWithOpacity = colorStops.map(stop => ({
            color: this.hexToRgba(stop.color, 0.8),
            position: stop.position
        }));
        const gradientWithOpacity = this.createLinearGradient(gradientStopsWithOpacity, options.direction || 90);

        return {
            guiColors: {
                ...baseColors,
                'menu-bar-background-image': gradientWithOpacity
            },
            blockColors: {
                checkboxActiveBackground: primaryColor,
                checkboxActiveBorder: this.darkenColor(primaryColor, 10)
            }
        };
    }

    /**
     * Generate complementary colors for color harmonies
     * @param {string} baseColor - Base hex color
     * @returns {object} Complementary color schemes
     */
    static generateColorHarmonies (baseColor) {
        const hsl = this.hexToHsl(baseColor);

        const complementary = this.hslToHex((hsl.h + 180) % 360, hsl.s, hsl.l);
        const triadic1 = this.hslToHex((hsl.h + 120) % 360, hsl.s, hsl.l);
        const triadic2 = this.hslToHex((hsl.h + 240) % 360, hsl.s, hsl.l);
        const analogous1 = this.hslToHex((hsl.h + 30) % 360, hsl.s, hsl.l);
        const analogous2 = this.hslToHex((hsl.h - 30 + 360) % 360, hsl.s, hsl.l);

        return {
            complementary: [baseColor, complementary],
            triadic: [baseColor, triadic1, triadic2],
            analogous: [baseColor, analogous1, analogous2],
            monochromatic: [
                baseColor,
                this.lightenColor(baseColor, 20),
                this.darkenColor(baseColor, 20)
            ]
        };
    }

    /**
     * Generate gradient presets
     * @returns {Array} Array of gradient presets
     */
    static getGradientPresets () {
        return [
            {
                name: 'Sunset',
                colors: ['#ff6b6b', '#feca57', '#ff9ff3'],
                direction: 90
            },
            {
                name: 'Ocean',
                colors: ['#667eea', '#764ba2', '#6dd5ed'],
                direction: 45
            },
            {
                name: 'Forest',
                colors: ['#134e5e', '#71b280', '#a8e6cf'],
                direction: 135
            },
            {
                name: 'Purple Rain',
                colors: ['#667eea', '#764ba2', '#f093fb'],
                direction: 90
            },
            {
                name: 'Fire',
                colors: ['#ff416c', '#ff4b2b', '#ffb347'],
                direction: 45
            },
            {
                name: 'Aurora',
                colors: ['#00c9ff', '#92fe9d', '#a8e6cf'],
                direction: 90
            },
            {
                name: 'Space',
                colors: ['#2c3e50', '#4ca1af', '#c0392b'],
                direction: 180
            },
            {
                name: 'Cherry',
                colors: ['#eb3349', '#f45c43', '#ff8a80'],
                direction: 90
            }
        ];
    }

    /**
     * Create gradient from preset
     * @param {string} presetName - Name of the preset
     * @param {string} primaryColor - Primary color override (optional)
     * @returns {object} Gradient accent theme
     */
    static createPresetGradient (presetName, primaryColor = null) {
        const preset = this.getGradientPresets().find(p => p.name === presetName);
        if (!preset) {
            throw new Error(`Gradient preset "${presetName}" not found`);
        }

        const colorStops = preset.colors.map((color, index) => ({
            color: color,
            position: (index / (preset.colors.length - 1)) * 100
        }));

        const primary = primaryColor || preset.colors[0];

        return this.createGradientAccent(colorStops, primary, {
            direction: preset.direction
        });
    }
}

/**
 * CustomTheme class extends Theme with additional metadata
 */
class CustomTheme extends Theme {
    constructor (
        name, description, accent, gui, blocks, menuBarAlign, wallpaper, fonts, author = 'User',
        appearance = {}, sourceId = ''
    ) {
        // If accent is an object (custom gradient),
        // pass a default string to parent and store the custom accent separately
        const accentKey = typeof accent === 'object' ? 'red' : accent; // Default to 'red' as fallback
        super(accentKey, gui, blocks, menuBarAlign, wallpaper, fonts, null, appearance);

        /** @readonly */
        this.name = name;
        /** @readonly */
        this.description = description;
        /** @readonly */
        this.author = author;
        /** @readonly */
        this.sourceId = sourceId;
        /** @readonly */
        this.createdAt = new Date().toISOString();
        /** @readonly */
        this.uuid = this.generateUUID();

        // Raw gradient data ({colors, direction}) becomes a full accent, same as import()
        const isGradientData = accent && typeof accent === 'object' && Array.isArray(accent.colors);
        const resolved = isGradientData ?
            GradientUtils.createGradientAccent(
                accent.colors,
                accent.colors[0] ? accent.colors[0].color : '#ff6b6b',
                {direction: accent.direction || '90'}
            ) :
            accent;
        this.customAccent = resolved && typeof resolved === 'object' && resolved.guiColors ? resolved : null;

        // Store the original accent data (either gradient format or full accent object)
        this.originalAccent = accent;
    }

    generateUUID () {
        return `custom-theme-${Date.now()}-${Math.random().toString(36)
            .substr(2, 9)}`;
    }

    /**
     * Override getGuiColors to handle custom accent objects
     * @returns {object} GUI colors
     */
    getGuiColors () {
        if (this.customAccent) {
            // Use dynamic imports to avoid circular dependency issues
            const defaultsDeep = require('lodash.defaultsdeep');

            // Get the base GUI colors directly without importing from index.js
            let baseGuiColors = {};

            try {
                baseGuiColors = GUI_MAP[this.gui].guiColors || {};
            } catch (e) {
                console.warn('Failed to load GUI theme modules:', e);
                // Fallback to basic colors if import fails
                baseGuiColors = {
                    'color-scheme': 'light',
                    'ui-primary': '#E5F0FF',
                    'text-primary': '#575E75'
                };
            }

            // For custom accents, use the custom accent object directly
            const mergedColors = defaultsDeep(
                {},
                this.customAccent.guiColors || {},
                baseGuiColors
            );

            return mergedColors;
        }

        // For standard accents, use the parent implementation
        return super.getGuiColors();
    }

    _getOptions () {
        return {
            ...super._getOptions(),
            accent: this.originalAccent || this.accent
        };
    }

    _create (options) {
        const theme = new CustomTheme(
            options.name,
            this.description,
            options.accent,
            options.gui,
            options.blocks,
            options.menuBarAlign,
            options.wallpaper,
            options.fonts,
            this.author,
            options.appearance,
            this.sourceId
        );
        theme.createdAt = this.createdAt;
        return theme;
    }

    /**
     * Override getBlockColors to handle custom accent objects
     * @returns {object} Block colors
     */
    getBlockColors () {
        if (this.customAccent) {
            // Use dynamic imports to avoid circular dependency issues
            const defaultsDeep = require('lodash.defaultsdeep');

            // Get base block colors directly without importing from index.js
            let baseGuiColors = {};
            let baseBlockColors = {};

            try {
                // Import block theme modules directly
                if (this.blocks === 'high-contrast') {
                    const blocksHighContrast = require('./blocks/high-contrast.js');
                    baseBlockColors = blocksHighContrast.blockColors || {};
                } else if (this.blocks === 'dark') {
                    const blocksDark = require('./blocks/dark.js');
                    baseBlockColors = blocksDark.blockColors || {};
                } else {
                    const blocksThree = require('./blocks/three.js');
                    baseBlockColors = blocksThree.blockColors || {};
                }
 
                baseGuiColors = GUI_MAP[this.gui].blockColors || {};
            } catch (e) {
                console.warn('Failed to load block theme modules:', e);
                // Fallback to basic block colors if import fails
                baseBlockColors = {
                    motion: {primary: '#4C97FF', secondary: '#4280D7', tertiary: '#3373CC'},
                    looks: {primary: '#9966FF', secondary: '#855CD6', tertiary: '#774DCB'}
                };
            }

            // For custom accents, use the custom accent object directly
            const mergedColors = defaultsDeep(
                {},
                this.customAccent.blockColors || {},
                baseGuiColors,
                baseBlockColors
            );

            return mergedColors;
        }

        // For standard accents, use the parent implementation
        return super.getBlockColors();
    }

    /**
     * Export theme to JSON format
     * @returns {object} Theme data
     */
    export () {
        const accentExport = this._exportGradient();

        const menuBarForeground = this.customAccent && this.customAccent.guiColors &&
            this.customAccent.guiColors['menu-bar-foreground'];

        return {
            uuid: this.uuid,
            createdAt: this.createdAt,
            name: this.name,
            description: this.description,
            author: this.author,
            sourceId: this.sourceId || null,
            accent: accentExport || (typeof this.originalAccent === 'string' ? this.originalAccent : null),
            menuBarForeground: menuBarForeground || null,
            gui: this.gui,
            blocks: this.blocks,
            menuBarAlign: this.menuBarAlign,
            appearance: this.appearance,
            wallpaper: this.wallpaper || {url: '', opacity: 0.3, darkness: 0, gridVisible: true, history: []},
            fonts: this.fonts || {system: [], google: [], history: []}
        };
    }

    /**
     * Convert OKLab to sRGB (0–255)
     * Based on Björn Ottosson's reference implementation
     * @param {number} L OKLab L component
     * @param {number} a OKLab a component
     * @param {number} b OKLab b component
     * @returns {object} An object of {r, g, b}
     */
    oklabToRgb (L, a, b) {
        // OKLab → LMS
        const l_ = L + (0.3963377774 * a) + (0.2158037573 * b);
        const m_ = L - (0.1055613458 * a) - (0.0638541728 * b);
        const s_ = L - (0.0894841775 * a) - (1.2914855480 * b);

        const l = l_ * l_ * l_;
        const m = m_ * m_ * m_;
        const s = s_ * s_ * s_;

        // LMS → linear sRGB
        let r = (4.0767416621 * l) - (3.3077115913 * m) + (0.2309699292 * s);
        let g = (-1.2684380046 * l) + (2.6097574011 * m) - (0.3413193965 * s);
        let b2 = (-0.0041960863 * l) - (0.7034186147 * m) + (1.7076147010 * s);

        // linear → gamma
        const compand = x =>
            (x <= 0.0031308 ?
                12.92 * x :
                (1.055 * Math.pow(x, 1 / 2.4)) - 0.055);

        r = compand(r);
        g = compand(g);
        b2 = compand(b2);

        const clamp = v => Math.min(255, Math.max(0, Math.round(v * 255)));

        return {
            r: clamp(r),
            g: clamp(g),
            b: clamp(b2)
        };
    }

    
    /**
  * Export gradient accent to format
 * @returns {object} Gradient format
  */
    _exportGradient () {
        if (this.originalAccent && typeof this.originalAccent === 'object' &&
            Array.isArray(this.originalAccent.colors)) {
            return this.originalAccent;
        }

        // Only ever derive the gradient from this theme's own stored colors.
        // Reading the live DOM here would export whatever theme is currently
        // applied and silently overwrite every other theme with it.
        const menuBarImage = (this.customAccent && this.customAccent.guiColors &&
            this.customAccent.guiColors['menu-bar-background-image']) || '';

        if (!menuBarImage) return null;

        const directionMatch = menuBarImage.match(/([\d.]+)deg/i);
        const direction = directionMatch ? directionMatch[1] : '90';

        const colorStops = [];

        // Match full color stop tokens (rgb/rgba/hex/oklab + optional position)
        const stops = menuBarImage.match(
            /(oklab\([^)]+\)|rgba?\([^)]+\)|#[a-fA-F0-9]{3,8})\s*([\d.]+%?)?/gi
        ) || [];

        stops.forEach((stop, index) => {
            let color = null;
            let position = null;

            const rgbaMatch = stop.match(
                /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*[\d.]+)?\s*\)\s*([\d.]+)?%?/i
            );

            const hexMatch = stop.match(/#([a-fA-F0-9]{3,8})/);

            const oklabMatch = stop.match(
                /oklab\(\s*([+-]?[\d.]+)\s+([+-]?[\d.]+)\s+([+-]?[\d.]+)(?:\s*\/\s*([+-]?[\d.]+))?\s*\)\s*([\d.]+)?%?/i
            );

            if (rgbaMatch) {
                const [, r, g, b, pos] = rgbaMatch;

                color =
                `#${
                    parseInt(r, 10).toString(16)
                        .padStart(2, '0')
                }${parseInt(g, 10).toString(16)
                    .padStart(2, '0')
                }${parseInt(b, 10).toString(16)
                    .padStart(2, '0')}`;

                position = typeof pos === 'undefined' ?
                    (index / (stops.length - 1)) * 100 :
                    parseFloat(pos);

            } else if (hexMatch) {
                color = hexMatch[0];

                const posMatch = stop.match(/([\d.]+)%/);
                position = posMatch ?
                    parseFloat(posMatch[1]) :
                    (index / (stops.length - 1)) * 100;

            } else if (oklabMatch) {
                const [, L, A, B, _alpha, pos] = oklabMatch;

                const {r, g, b} = this.oklabToRgb(
                    parseFloat(L),
                    parseFloat(A),
                    parseFloat(B)
                );

                color = `#${r.toString(16).padStart(2, '0')
                }${g.toString(16).padStart(2, '0')
                }${b.toString(16).padStart(2, '0')}`;

                position = typeof pos === 'undefined' ?
                    (index / (stops.length - 1)) * 100 :
                    parseFloat(pos);
            }

            if (color !== null && position !== null) {
                colorStops.push({color, position});
            }
        });

        colorStops.sort((a, b) => a.position - b.position);

        return {
            colors: colorStops,
            direction: direction.toString()
        };
    }

    /**
     * Export standard accent to format
     * @param {string} accent - Standard accent color name
     * @returns {object} Standard accent format
     */
    _exportStandardAccent (accent) {
        return {
            type: 'standard',
            name: accent
        };
    }

    /**
     * Create CustomTheme from exported data
     * @param {object} data the inputted custom theme data
     * @returns {CustomTheme} the finished custom theme object
     */
    static import (data) {
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid theme data');
        }

        if (!data.name || !data.gui || !data.blocks) {
            throw new Error('Missing required theme properties');
        }

        let accentToUse = data.accent;

        // Handle null/undefined accent - create a default accent
        if (!accentToUse) {
            accentToUse = {
                guiColors: GradientUtils.generateAccentColors('#ff6b6b')
            };
        } else if (accentToUse && typeof accentToUse === 'object' && Array.isArray(accentToUse.colors)) {
            // Check if accent is in gradient format (colors array)
            const colors = accentToUse.colors;
            const direction = accentToUse.direction || '90';
            const primaryColor = colors[0] ? colors[0].color : '#ff6b6b';
            accentToUse = GradientUtils.createGradientAccent(colors, primaryColor, {direction});
        }

        if (data.menuBarForeground && accentToUse && typeof accentToUse === 'object') {
            accentToUse = {
                ...accentToUse,
                guiColors: {
                    ...(accentToUse.guiColors || {}),
                    'menu-bar-foreground': data.menuBarForeground
                }
            };
        }

        const theme = new CustomTheme(
            data.name,
            data.description || '',
            accentToUse, // This will be the gradient object for custom themes
            data.gui,
            data.blocks,
            data.menuBarAlign,
            data.wallpaper,
            data.fonts,
            data.author || 'Unknown',
            data.appearance || {
                menuBarLayout: data.menuBarLayout || null,
                styles: data.styleSettings || null
            },
            data.sourceId || ''
        );

        // Preserve original UUID and creation date if available
        if (data.uuid) {
            Object.defineProperty(theme, 'uuid', {value: data.uuid, writable: false});
        }
        if (data.createdAt) {
            Object.defineProperty(theme, 'createdAt', {value: data.createdAt, writable: false});
        }

        // Keep the stored gradient data as the export source of truth so the
        // theme round-trips losslessly through import/export cycles.
        if (data.accent && typeof data.accent === 'object' && Array.isArray(data.accent.colors)) {
            theme.originalAccent = data.accent;
        }

        return theme;
    }
}

/**
 * CustomThemeManager handles storage and management of custom themes
 */
class CustomThemeManager {
    constructor () {
        this.themes = new Map();
        this._listeners = new Set();
        this.loadCustomThemes();
    }

    subscribe (listener) {
        if (typeof listener !== 'function') {
            throw new Error('Listener must be a function');
        }
        this._listeners.add(listener);
        return () => {
            this._listeners.delete(listener);
        };
    }

    _emitChange () {
        for (const listener of this._listeners) {
            try {
                listener();
            } catch (e) {
                // Ignore listener errors
            }
        }
    }

    /**
     * Load custom themes from localStorage
     */
    loadCustomThemes () {
        try {
            const stored = localStorage.getItem(CUSTOM_THEMES_STORAGE_KEY);
            if (!stored) {
                return;
            }

            const themesData = JSON.parse(stored);
            if (!Array.isArray(themesData)) {
                console.warn('Invalid themes data format in storage - not an array');
                return;
            }

            for (const themeData of themesData) {
                try {
                    const theme = CustomTheme.import(themeData);
                    this.themes.set(theme.uuid, theme);
                } catch (e) {
                    console.warn(`Failed to load custom theme "${themeData?.name || 'unknown'}":`, e);
                }
            }
        } catch (e) {
            console.error('Failed to load custom themes from storage:', e);
        }
    }

    /**
     * Save custom themes to localStorage
     */
    saveCustomThemes () {
        try {
            const themesData = Array.from(this.themes.values()).map(theme => theme.export());

            if (themesData.length === 0) {
                localStorage.removeItem(CUSTOM_THEMES_STORAGE_KEY);
                try {
                    require('../rotur/cloud-sync.js').notifyLocalChange();
                } catch (_) {
                    // cloud sync optional
                }
                this._emitChange();
                return;
            }

            const jsonString = JSON.stringify(themesData, null, 2);

            if (jsonString.length > 5 * 1024 * 1024) {
                console.warn('Theme data is very large (over 5MB), may cause storage issues');
            }

            localStorage.setItem(CUSTOM_THEMES_STORAGE_KEY, jsonString);

            try {
                require('../rotur/cloud-sync.js').notifyLocalChange();
            } catch (_) {
                // cloud sync optional
            }

            this._emitChange();
        } catch (e) {
            console.error('Failed to save custom themes to storage:', e);

            if (e.name === 'QuotaExceededError') {
                const currentData = localStorage.getItem(CUSTOM_THEMES_STORAGE_KEY);
                if (currentData) {
                    localStorage.setItem(`${CUSTOM_THEMES_STORAGE_KEY}_backup`, currentData);
                }
                throw new Error('Storage quota exceeded - try deleting some themes');
            }

            throw new Error(`Failed to save themes: ${e.message}`);
        }
    }

    /**
     * Add a new custom theme
     * @param {CustomTheme} theme a custom theme
     */
    addTheme (theme) {
        if (!(theme instanceof CustomTheme)) {
            throw new Error('Theme must be an instance of CustomTheme');
        }

        if (this.themes.size >= MAX_CUSTOM_THEMES) {
            throw new Error(`Maximum number of custom themes (${MAX_CUSTOM_THEMES}) reached`);
        }

        // Check for duplicate names
        for (const existingTheme of this.themes.values()) {
            if (existingTheme.name === theme.name) {
                throw new Error(`Theme with name "${theme.name}" already exists`);
            }
        }

        this.themes.set(theme.uuid, theme);
        this.saveCustomThemes();
    }

    /**
     * Remove a custom theme
     * @param {string} uuid the uuid of a custom theme
     * @returns {boolean} whether the deletion was successful
     */
    removeTheme (uuid) {
        if (this.themes.has(uuid)) {
            this.themes.delete(uuid);
            this.saveCustomThemes();
            return true;
        }
        return false;
    }

    /**
     * Get a custom theme by UUID
     * @param {string} uuid a custom theme uuid
     * @returns {CustomTheme|null} a custom theme
     */
    getTheme (uuid) {
        return this.themes.get(uuid) || null;
    }

    /**
     * Get all custom themes
     * @returns {CustomTheme[]} all custom themes
     */
    getAllThemes () {
        return Array.from(this.themes.values()).sort((a, b) => a.name.localeCompare(b.name));
    }

    /**
     * Update an existing theme
     * @param {string} uuid a custom theme uuid
     * @param {object} updates an object of key value pairs to edit
     * @throws when the theme doesnt exist
     * @returns {CustomTheme} the updated custom theme
     */
    updateTheme (uuid, updates) {
        const existingTheme = this.themes.get(uuid);
        if (!existingTheme) {
            throw new Error('Theme not found');
        }

        // Create new theme with updates
        const updatedTheme = new CustomTheme(
            updates.name || existingTheme.name,
            typeof updates.description === 'undefined' ? existingTheme.description : updates.description,
            updates.accent || existingTheme.originalAccent || existingTheme.accent,
            updates.gui || existingTheme.gui,
            updates.blocks || existingTheme.blocks,
            updates.menuBarAlign || existingTheme.menuBarAlign,
            updates.wallpaper || existingTheme.wallpaper,
            updates.fonts || existingTheme.fonts,
            existingTheme.author,
            updates.appearance || existingTheme.appearance,
            existingTheme.sourceId
        );

        // Preserve original UUID and creation date
        Object.defineProperty(updatedTheme, 'uuid', {value: uuid, writable: false});
        Object.defineProperty(updatedTheme, 'createdAt', {value: existingTheme.createdAt, writable: false});

        this.themes.set(uuid, updatedTheme);
        this.saveCustomThemes();

        return updatedTheme;
    }

    /**
     * Update gradient for an existing custom theme
     * @param {string} uuid - Theme UUID
     * @param {Array} colorStops - New gradient color stops
     * @param {string} primaryColor - New primary accent color
     * @param {object} options - Additional options
     * @returns {CustomTheme} Updated theme
     */
    updateThemeGradient (uuid, colorStops, primaryColor, options = {}) {
        const existingTheme = this.themes.get(uuid);
        if (!existingTheme) {
            throw new Error('Theme not found');
        }

        // Generate new gradient accent
        const gradientAccent = GradientUtils.createGradientAccent(colorStops, primaryColor, options);

        // Create updated theme with new gradient
        const updatedTheme = new CustomTheme(
            existingTheme.name,
            existingTheme.description,
            gradientAccent, // Updated gradient accent
            existingTheme.gui,
            existingTheme.blocks,
            existingTheme.menuBarAlign,
            existingTheme.wallpaper,
            existingTheme.fonts,
            existingTheme.author,
            existingTheme.appearance,
            existingTheme.sourceId
        );

        // Preserve original UUID and creation date
        Object.defineProperty(updatedTheme, 'uuid', {value: uuid, writable: false});
        Object.defineProperty(updatedTheme, 'createdAt', {value: existingTheme.createdAt, writable: false});

        this.themes.set(uuid, updatedTheme);
        this.saveCustomThemes();

        return updatedTheme;
    }

    /**
     * Check if a theme has a custom gradient
     * @param {string} uuid - Theme UUID
     * @returns {boolean} True if theme has custom gradient
     */
    hasCustomGradient (uuid) {
        const theme = this.themes.get(uuid);
        return theme && theme.customAccent && theme.customAccent.guiColors &&
            theme.customAccent.guiColors['menu-bar-background-image'];
    }

    /**
     * Convert RGBA color to hex
     * @param {string} rgba - RGBA color string like "rgba(255, 107, 107, 0.8)"
     * @returns {string} Hex color string
     */
    rgbaToHex (rgba) {
        const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
        if (!match) return rgba; // Return original if not RGBA format

        const r = parseInt(match[1], 10);
        const g = parseInt(match[2], 10);
        const b = parseInt(match[3], 10);

        const toHex = n => {
            const hex = n.toString(16);
            return hex.length === 1 ? `0${hex}` : hex;
        };

        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }

    /**
     * Extract gradient information from a custom theme
     * @param {string} uuid - Theme UUID
     * @returns {object|null} Gradient information or null if not a gradient theme
     */
    getThemeGradientInfo (uuid) {
        const theme = this.themes.get(uuid);
        if (!theme || !this.hasCustomGradient(uuid)) {
            return null;
        }

        const gradientString = theme.customAccent.guiColors['menu-bar-background-image'];

        // Try to parse the gradient string to extract colors and direction
        const gradientMatch = gradientString.match(/linear-gradient\((\d+)deg,\s*(.+)\)/);
        if (!gradientMatch) {
            return null;
        }

        const direction = parseInt(gradientMatch[1], 10);
        const colorString = gradientMatch[2];

        // Parse color stops using a more sophisticated approach
        const colorStops = [];
        
        // Split the color string by looking for patterns that start with rgba( or #
        // This handles the comma issue within RGBA values
        const stopPattern = /(?:rgba?\(\d+,\s*\d+,\s*\d+(?:,\s*[\d.]+)?\)\s*[\d.]*%?|#[a-fA-F0-9]{3,8}\s*[\d.]*%?)/g;
        const stopMatches = colorString.match(stopPattern);
        
        if (!stopMatches) {
            return null;
        }

        stopMatches.forEach((stopString, index) => {
            let color;
            let position;

            // Clean up the stop string
            stopString = stopString.trim();

            // Check for RGBA format: rgba(255, 107, 107, 0.8) 50%
            const rgbaMatch = stopString.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)\s*([\d.]+)%?/);
            if (rgbaMatch) {
                const [, r, g, b, pos] = rgbaMatch;
                const rHex = parseInt(r, 10).toString(16)
                    .padStart(2, '0');
                const gHex = parseInt(g, 10).toString(16)
                    .padStart(2, '0');
                const bHex = parseInt(b, 10).toString(16)
                    .padStart(2, '0');
                color = `#${rHex}${gHex}${bHex}`;
                position = pos ? parseFloat(pos) : (index / (stopMatches.length - 1)) * 100;
            } else {
                // Check for hex format: #ff6b6b 50%
                const hexMatch = stopString.match(/#([a-fA-F0-9]{3,8})/);
                const posMatch = stopString.match(/([\d.]+)%/);
                
                if (hexMatch) {
                    color = hexMatch[0];
                    // Ensure 6-digit hex
                    if (color.length === 4) {
                        color = `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`;
                    }
                } else {
                    color = '#000000'; // fallback
                }
                
                position = posMatch ? parseFloat(posMatch[1]) : (index / (stopMatches.length - 1)) * 100;
            }

            colorStops.push({color, position});
        });

        // Sort color stops by position
        colorStops.sort((a, b) => a.position - b.position);

        // Try to extract primary color from accent colors
        let primaryColor = '#ff6b6b'; // fallback
        if (theme.customAccent.guiColors['motion-primary']) {
            primaryColor = theme.customAccent.guiColors['motion-primary'];
        }

        // If we have color stops, use the first one as primary color
        if (colorStops.length > 0) {
            primaryColor = colorStops[0].color;
        }

        return {
            colorStops,
            direction,
            primaryColor,
            gradientString
        };
    }

    /**
     * Export all custom themes
     * @returns {object} all your custom themes
     */
    exportAllThemes () {
        const themes = this.getAllThemes().map(theme => theme.export());
        return {
            version: '2.0',
            platform: 'MistWarp',
            timestamp: Date.now(),
            themes: themes
        };
    }

    /**
     * Import themes from exported data
     * @param {object} data your custom theme json file
     * @param {boolean} overwrite Whether to overwrite existing themes with same name
     * @returns {object} Import results
     */
    importThemes (data, overwrite = false) {
        const isPlainObject = obj => obj && typeof obj === 'object' && !Array.isArray(obj);

        const looksLikeNitroboltTheme = obj => isPlainObject(obj) &&
            typeof obj.name === 'string' &&
            (typeof obj.isGradient === 'boolean' || isPlainObject(obj.gradient) || obj.gradient === null) &&
            (typeof obj.primaryColor === 'string' ||
            typeof obj.secondaryColor === 'string' ||
            typeof obj.tertiaryColor === 'string');

        const toNumberOrNull = value => {
            if (typeof value === 'number' && Number.isFinite(value)) return value;
            if (typeof value === 'string' && value.trim() !== '') {
                const parsed = Number(value);
                if (Number.isFinite(parsed)) return parsed;
            }
            return null;
        };

        const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

        const importNitroboltTheme = nitrobolt => {
            const name = (nitrobolt.name || '').trim();
            if (!name) throw new Error('Theme name is required');

            const description = '';

            // Nitrobolt format provides a few colors; treat primary as the accent base.
            const primaryColor = typeof nitrobolt.primaryColor === 'string' ? nitrobolt.primaryColor : '#ff6b6b';

            const gradient = nitrobolt.gradient;
            const hasGradient = Boolean(nitrobolt.isGradient) &&
                isPlainObject(gradient) &&
                Array.isArray(gradient.colors);

            let accent;
            if (hasGradient) {
                const directionRaw = toNumberOrNull(gradient.direction);
                const direction = directionRaw === null ? 90 : directionRaw;

                const colorStops = gradient.colors
                    .filter(stop => stop && typeof stop.color === 'string')
                    .map(stop => {
                        const pos = toNumberOrNull(stop.position);
                        return {
                            color: stop.color,
                            position: pos === null ? 0 : clamp(pos, 0, 100)
                        };
                    })
                    .sort((a, b) => a.position - b.position);

                if (colorStops.length < 2) {
                    throw new Error('Gradient themes must have at least 2 color stops');
                }

                accent = GradientUtils.createGradientAccent(colorStops, primaryColor, {direction});
            } else {
                // No gradient (or gradient is null/missing): keep default GUI theme background.
                accent = {
                    guiColors: GradientUtils.generateAccentColors(primaryColor),
                    blockColors: {
                        checkboxActiveBackground: primaryColor,
                        checkboxActiveBorder: GradientUtils.darkenColor(primaryColor, 10)
                    }
                };
            }

            return new CustomTheme(
                name,
                description,
                accent,
                'light',
                'three',
                'left',
                null,
                null
            );
        };

        let themesToImport;
        if (data && Array.isArray(data.themes)) {
            themesToImport = data.themes.map(t => ({kind: 'mistwarp', data: t}));
        } else if (Array.isArray(data) && data.every(looksLikeNitroboltTheme)) {
            themesToImport = data.map(t => ({kind: 'nitrobolt', data: t}));
        } else if (looksLikeNitroboltTheme(data)) {
            themesToImport = [{kind: 'nitrobolt', data}];
        } else {
            throw new Error('Invalid import data format');
        }

        const results = {
            imported: 0,
            skipped: 0,
            errors: []
        };

        for (const entry of themesToImport) {
            try {
                const theme = entry.kind === 'mistwarp' ?
                    CustomTheme.import(entry.data) :
                    importNitroboltTheme(entry.data);

                // Check for existing theme with same name
                const existingTheme = Array.from(this.themes.values())
                    .find(t => t.name === theme.name);

                if (existingTheme && !overwrite) {
                    results.skipped++;
                    continue;
                }

                if (existingTheme && overwrite) {
                    this.removeTheme(existingTheme.uuid);
                }

                this.addTheme(theme);
                results.imported++;
            } catch (e) {
                const themeName = entry && entry.data && entry.data.name ? entry.data.name : 'Unknown';
                results.errors.push(`Failed to import theme "${themeName}": ${e.message}`);
            }
        }

        return results;
    }

    /**
     * Clear all custom themes
     */
    clearAllThemes () {
        this.themes.clear();
        try {
            localStorage.removeItem(CUSTOM_THEMES_STORAGE_KEY);
        } catch (e) {
            console.warn('Failed to clear custom themes storage:', e);
        }
    }

    /**
     * Create a custom theme from current theme
     * @param {Theme} currentTheme the current theme
     * @param {string} name the name for the new theme
     * @param {string} description the description for the new theme
     * @returns {CustomTheme} the new custom theme
     */
    createFromCurrentTheme (currentTheme, name, description = '') {
        if (!name || typeof name !== 'string') {
            throw new Error('Theme name is required');
        }

        const customTheme = new CustomTheme(
            name.trim(),
            description.trim(),
            currentTheme.accent,
            currentTheme.gui,
            currentTheme.blocks,
            currentTheme.menuBarAlign,
            currentTheme.wallpaper,
            currentTheme.fonts,
            'User',
            mergeStoredAppearance(currentTheme.appearance)
        );

        this.addTheme(customTheme);
        return customTheme;
    }

    /**
     * Create a custom gradient theme
     * @param {string} name - Theme name
     * @param {string} description - Theme description
     * @param {Array} colorStops - Gradient color stops
     * @param {string} primaryColor - Primary accent color
     * @param {object} options - Additional options
     * @param {Theme} baseTheme - Base theme for GUI and block settings
     * @returns {CustomTheme} the new theme
     */
    createGradientTheme (name, description, colorStops, primaryColor, options = {}, baseTheme) {
        if (!name || typeof name !== 'string') {
            throw new Error('Theme name is required');
        }

        // Generate gradient accent
        const gradientAccent = GradientUtils.createGradientAccent(colorStops, primaryColor, options);

        const customTheme = new CustomTheme(
            name.trim(),
            description.trim(),
            gradientAccent, // Custom gradient accent
            baseTheme?.gui || 'light',
            baseTheme?.blocks || 'three',
            baseTheme?.menuBarAlign || 'left',
            baseTheme?.wallpaper || null,
            baseTheme?.fonts || null,
            'User',
            mergeStoredAppearance(baseTheme?.appearance)
        );

        this.addTheme(customTheme);
        return customTheme;
    }

    /**
     * Whether a theme name is already in use
     * @param {string} name theme name
     * @returns {boolean} true if taken
     */
    isNameTaken (name) {
        const trimmed = (name || '').trim().toLowerCase();
        if (!trimmed) return false;
        for (const theme of this.themes.values()) {
            if (theme.name.toLowerCase() === trimmed) return true;
        }
        return false;
    }

    /**
     * Produce a unique library name, appending (2), (3), …
     * @param {string} baseName preferred name
     * @returns {string} unique name
     */
    uniqueName (baseName) {
        const base = (baseName || 'Imported Theme').trim() || 'Imported Theme';
        if (!this.isNameTaken(base)) return base;
        let n = 2;
        while (this.isNameTaken(`${base} (${n})`)) n += 1;
        return `${base} (${n})`;
    }

    /**
     * Add a MistWarp export JSON theme into the local library.
     * Always assigns a fresh UUID so marketplace ids never collide with local ones.
     * @param {object} data export payload ({themes:[…]}) or a single theme object
     * @param {object} [meta] optional overrides {name, description, author, sourceId}
     * @returns {CustomTheme} the saved theme
     */
    addFromExportData (data, meta = {}) {
        let config = data;
        if (data && Array.isArray(data.themes) && data.themes.length > 0) {
            config = data.themes[0];
        }
        if (!config || typeof config !== 'object') {
            throw new Error('Invalid theme data');
        }

        const name = this.uniqueName(meta.name || config.name || 'Imported Theme');
        const description = typeof meta.description === 'string' ?
            meta.description :
            (config.description || '');
        const author = meta.author || config.author || 'User';

        // Drop marketplace uuid so CustomTheme generates a local one.
        const rest = Object.assign({}, config);
        delete rest.uuid;
        delete rest.createdAt;
        const theme = CustomTheme.import({
            ...rest,
            name,
            description,
            author,
            sourceId: meta.sourceId || config.sourceId || ''
        });

        this.addTheme(theme);
        return theme;
    }

    /**
     * Get storage diagnostics
     * @returns {object} Storage information
     */
    getStorageInfo () {
        try {
            const stored = localStorage.getItem(CUSTOM_THEMES_STORAGE_KEY);
            const size = stored ? new Blob([stored]).size : 0;
            const parsed = stored ? JSON.parse(stored) : [];

            return {
                hasData: Boolean(stored),
                themeCount: Array.isArray(parsed) ? parsed.length : 0,
                dataSize: size,
                dataSizeFormatted: `${(size / 1024).toFixed(2)} KB`,
                isValid: Array.isArray(parsed),
                quotaEstimate: {
                    used: size,
                    total: 5 * 1024 * 1024,
                    percentage: ((size / (5 * 1024 * 1024)) * 100).toFixed(2)
                }
            };
        } catch (e) {
            return {
                error: e.message,
                hasData: !!localStorage.getItem(CUSTOM_THEMES_STORAGE_KEY)
            };
        }
    }
}

// Singleton instance
const customThemeManager = new CustomThemeManager();

export {
    CustomTheme,
    CustomThemeManager,
    GradientUtils,
    customThemeManager
};
