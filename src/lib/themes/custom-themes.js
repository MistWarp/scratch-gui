/**
 * Custom theme management for Mistwarp
 * Handles creation, storage, and management of user-defined themes including custom gradients and accents
 */

import {Theme, GUI_MAP} from './index.js';

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
    constructor (name, description, accent, gui, blocks, menuBarAlign, wallpaper, fonts, author = 'User') {
        // If accent is an object (custom gradient),
        // pass a default string to parent and store the custom accent separately
        const accentKey = typeof accent === 'object' ? 'red' : accent; // Default to 'red' as fallback
        super(accentKey, gui, blocks, menuBarAlign, wallpaper, fonts);

        /** @readonly */
        this.name = name;
        /** @readonly */
        this.description = description;
        /** @readonly */
        this.author = author;
        /** @readonly */
        this.createdAt = new Date().toISOString();
        /** @readonly */
        this.uuid = this.generateUUID();
        /** @readonly */
        this.customAccent = typeof accent === 'object' ? accent : null;
        /** @readonly */
        this.originalAccent = accent; // Store the original accent for export
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

    /**
     * @param {string} what - The property to change (e.g., 'gui', 'blocks', 'accent')
     * @param {*} to - The new value for the property
     * @returns {Theme|CustomTheme} A new theme instance with the updated property
     */
    set (what, to) {
        if (what === 'accent') {
            return super.set(what, to);
        }

        if (this.customAccent) {
            const next = {
                name: this.name,
                description: this.description,
                author: this.author,
                accent: this.customAccent,
                gui: this.gui,
                blocks: this.blocks,
                menuBarAlign: this.menuBarAlign,
                wallpaper: this.wallpaper,
                fonts: this.fonts
            };

            if (Object.prototype.hasOwnProperty.call(next, what)) {
                next[what] = to;
            } else if (what === 'name') {
                next.name = to;
            } else {
                return super.set(what, to);
            }

            return new CustomTheme(
                next.name,
                next.description,
                next.accent,
                next.gui,
                next.blocks,
                next.menuBarAlign,
                next.wallpaper,
                next.fonts,
                next.author
            );
        }

        return super.set(what, to);
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
        return {
            uuid: this.uuid,
            name: this.name,
            description: this.description,
            author: this.author,
            createdAt: this.createdAt,
            accent: this.originalAccent, // Use original accent (not the fallback string)
            customAccent: this.customAccent, // Include custom accent data
            gui: this.gui,
            blocks: this.blocks,
            menuBarAlign: this.menuBarAlign,
            wallpaper: this.wallpaper,
            fonts: this.fonts,
            version: '1.0'
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

        if (!data.name || !data.accent || !data.gui || !data.blocks) {
            throw new Error('Missing required theme properties');
        }

        // Use the original accent from the export data
        const accentToUse = data.customAccent ? data.accent : data.accent;

        const theme = new CustomTheme(
            data.name,
            data.description || '',
            accentToUse, // This will be the gradient object for custom themes
            data.gui,
            data.blocks,
            data.menuBarAlign,
            data.wallpaper,
            data.fonts,
            data.author || 'Unknown'
        );

        // Preserve original UUID and creation date if available
        if (data.uuid) {
            Object.defineProperty(theme, 'uuid', {value: data.uuid, writable: false});
        }
        if (data.createdAt) {
            Object.defineProperty(theme, 'createdAt', {value: data.createdAt, writable: false});
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
            if (stored) {
                const themesData = JSON.parse(stored);
                for (const themeData of themesData) {
                    try {
                        const theme = CustomTheme.import(themeData);
                        this.themes.set(theme.uuid, theme);
                    } catch (e) {
                        console.warn('Failed to load custom theme:', e);
                    }
                }
            }
        } catch (e) {
            console.warn('Failed to load custom themes from storage:', e);
        }
    }

    /**
     * Save custom themes to localStorage
     */
    saveCustomThemes () {
        try {
            const themesData = Array.from(this.themes.values()).map(theme => theme.export());
            localStorage.setItem(CUSTOM_THEMES_STORAGE_KEY, JSON.stringify(themesData));
            this._emitChange();
        } catch (e) {
            console.warn('Failed to save custom themes to storage:', e);
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
            updates.accent || existingTheme.accent,
            updates.gui || existingTheme.gui,
            updates.blocks || existingTheme.blocks,
            updates.menuBarAlign || existingTheme.menuBarAlign,
            updates.wallpaper || existingTheme.wallpaper,
            updates.fonts || existingTheme.fonts,
            existingTheme.author
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
            existingTheme.author
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
            version: '1.0',
            exportedAt: new Date().toISOString(),
            themes: themes,
            count: themes.length
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
            currentTheme.fonts
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
            baseTheme?.fonts || null
        );

        this.addTheme(customTheme);
        return customTheme;
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
