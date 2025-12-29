const guiColors = {
    'motion-primary': 'oklab(0.80 -0.04 -0.08)',
    'motion-primary-transparent': 'oklab(0.80 -0.04 -0.08 / 0.75)',
    'motion-tertiary': 'oklab(0.82 -0.02 -0.06)',

    'looks-secondary': 'oklab(0.80 -0.04 -0.08)',
    'looks-transparent': 'oklab(0.80 -0.04 -0.08 / 0.35)',
    'looks-light-transparent': 'oklab(0.80 -0.04 -0.08 / 0.15)',
    'looks-secondary-dark': 'oklab(0.70 -0.06 -0.10)',

    'extensions-primary': 'oklab(0.82 -0.02 -0.06)',
    'extensions-tertiary': 'oklab(0.85 0.00 -0.04)',
    'extensions-transparent': 'oklab(0.82 -0.02 -0.06 / 0.35)',
    'extensions-light': 'oklab(0.88 0.00 -0.02)',
    
    'drop-highlight': 'oklab(0.80 -0.04 -0.08)',

    'menu-bar-background-image':
        'linear-gradient(90deg, ' +
        'oklab(0.75 -0.06 -0.10 / 0.8) 0%, ' + // soft blue
        'oklab(0.80 -0.04 -0.08 / 0.8) 20%, ' + // sky blue
        'oklab(0.83 -0.02 -0.06 / 0.8) 40%, ' + // light blue
        'oklab(0.86 0.00 -0.04 / 0.8) 60%, ' + // pale blue
        'oklab(0.88 0.00 -0.02 / 0.8) 80%, ' + // very pale blue
        'oklab(0.92 0.00 0.00 / 0.8) 100%)' // almost white
};

const blockColors = {
    checkboxActiveBackground: 'oklab(0.80 -0.04 -0.08)',
    checkboxActiveBorder: 'oklab(0.82 -0.02 -0.06)'
};

export {
    guiColors,
    blockColors
};
