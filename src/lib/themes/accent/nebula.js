const guiColors = {
    'motion-primary': 'oklab(0.55 0.08 -0.12)',
    'motion-primary-transparent': 'oklab(0.55 0.08 -0.12 / 0.75)',
    'motion-tertiary': 'oklab(0.60 0.06 -0.10)',

    'looks-secondary': 'oklab(0.55 0.08 -0.12)',
    'looks-transparent': 'oklab(0.55 0.08 -0.12 / 0.35)',
    'looks-light-transparent': 'oklab(0.55 0.08 -0.12 / 0.15)',
    'looks-secondary-dark': 'oklab(0.45 0.10 -0.14)',

    'extensions-primary': 'oklab(0.60 0.06 -0.10)',
    'extensions-tertiary': 'oklab(0.50 0.12 0.04)',
    'extensions-transparent': 'oklab(0.60 0.06 -0.10 / 0.35)',
    'extensions-light': 'oklab(0.70 0.04 -0.08)',
    
    'drop-highlight': 'oklab(0.55 0.08 -0.12)',

    'menu-bar-background-image':
        'linear-gradient(90deg, ' +
        'oklab(0.25 0.02 -0.08 / 0.9) 0%, ' + // deep space black
        'oklab(0.35 0.08 -0.12 / 0.85) 15%, ' + // dark purple
        'oklab(0.45 0.12 -0.08 / 0.8) 30%, ' + // purple
        'oklab(0.55 0.15 0.02 / 0.8) 50%, ' + // magenta-pink
        'oklab(0.65 0.08 0.08 / 0.8) 70%, ' + // coral
        'oklab(0.75 0.02 0.12 / 0.8) 85%, ' + // gold
        'oklab(0.85 -0.02 0.08 / 0.8) 100%)' // bright yellow
};

const blockColors = {
    checkboxActiveBackground: 'oklab(0.55 0.08 -0.12)',
    checkboxActiveBorder: 'oklab(0.60 0.06 -0.10)'
};

export {
    guiColors,
    blockColors
};
