const guiColors = {
    'motion-primary': 'oklab(0.68 0.18 0.12)',
    'motion-primary-transparent': 'oklab(0.68 0.18 0.12 / 0.75)',
    'motion-tertiary': 'oklab(0.72 0.15 0.10)',

    'looks-secondary': 'oklab(0.68 0.18 0.12)',
    'looks-transparent': 'oklab(0.68 0.18 0.12 / 0.35)',
    'looks-light-transparent': 'oklab(0.68 0.18 0.12 / 0.15)',
    'looks-secondary-dark': 'oklab(0.58 0.20 0.14)',

    'extensions-primary': 'oklab(0.72 0.15 0.10)',
    'extensions-tertiary': 'oklab(0.76 0.12 0.08)',
    'extensions-transparent': 'oklab(0.72 0.15 0.10 / 0.35)',
    'extensions-light': 'oklab(0.80 0.10 0.06)',
    
    'drop-highlight': 'oklab(0.68 0.18 0.12)',

    'menu-bar-background-image':
        'linear-gradient(90deg, ' +
        'oklab(0.55 0.20 0.16 / 0.8) 0%, ' + // deep red
        'oklab(0.65 0.18 0.14 / 0.8) 25%, ' + // red-orange
        'oklab(0.72 0.15 0.12 / 0.8) 50%, ' + // orange
        'oklab(0.78 0.12 0.10 / 0.8) 75%, ' + // yellow-orange
        'oklab(0.85 0.08 0.08 / 0.8) 100%)' // bright yellow
};

const blockColors = {
    checkboxActiveBackground: 'oklab(0.68 0.18 0.12)',
    checkboxActiveBorder: 'oklab(0.72 0.15 0.10)'
};

export {
    guiColors,
    blockColors
};
