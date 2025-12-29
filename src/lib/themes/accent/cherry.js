const guiColors = {
    'motion-primary': 'oklab(0.70 0.18 0.08)',
    'motion-primary-transparent': 'oklab(0.70 0.18 0.08 / 0.75)',
    'motion-tertiary': 'oklab(0.72 0.16 0.10)',

    'looks-secondary': 'oklab(0.70 0.18 0.08)',
    'looks-transparent': 'oklab(0.70 0.18 0.08 / 0.35)',
    'looks-light-transparent': 'oklab(0.70 0.18 0.08 / 0.15)',
    'looks-secondary-dark': 'oklab(0.60 0.20 0.06)',

    'extensions-primary': 'oklab(0.72 0.16 0.10)',
    'extensions-tertiary': 'oklab(0.68 0.14 0.04)',
    'extensions-transparent': 'oklab(0.72 0.16 0.10 / 0.35)',
    'extensions-light': 'oklab(0.78 0.12 0.12)',
    
    'drop-highlight': 'oklab(0.70 0.18 0.08)',

    'menu-bar-background-image':
        'linear-gradient(90deg, ' +
        'oklab(0.65 0.20 0.06 / 0.8) 0%, ' + // deep cherry
        'oklab(0.70 0.18 0.08 / 0.8) 20%, ' + // cherry red
        'oklab(0.72 0.16 0.12 / 0.8) 40%, ' + // warm cherry
        'oklab(0.75 0.14 0.14 / 0.8) 60%, ' + // cherry pink
        'oklab(0.78 0.12 0.08 / 0.8) 80%, ' + // soft pink
        'oklab(0.80 0.08 0.04 / 0.8) 100%)' // pale rose
};

const blockColors = {
    checkboxActiveBackground: 'oklab(0.70 0.18 0.08)',
    checkboxActiveBorder: 'oklab(0.72 0.16 0.10)'
};

export {
    guiColors,
    blockColors
};
