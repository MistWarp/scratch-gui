const guiColors = {
    'motion-primary': 'oklab(0.75 0.12 0.08)',
    'motion-primary-transparent': 'oklab(0.75 0.12 0.08 / 0.75)',
    'motion-tertiary': 'oklab(0.72 0.14 0.06)',

    'looks-secondary': 'oklab(0.75 0.12 0.08)',
    'looks-transparent': 'oklab(0.75 0.12 0.08 / 0.35)',
    'looks-light-transparent': 'oklab(0.75 0.12 0.08 / 0.15)',
    'looks-secondary-dark': 'oklab(0.65 0.15 0.10)',

    'extensions-primary': 'oklab(0.72 0.14 0.06)',
    'extensions-tertiary': 'oklab(0.68 0.16 0.04)',
    'extensions-transparent': 'oklab(0.72 0.14 0.06 / 0.35)',
    'extensions-light': 'oklab(0.80 0.10 0.10)',
    
    'drop-highlight': 'oklab(0.75 0.12 0.08)',

    'menu-bar-background-image':
        'linear-gradient(90deg, ' +
        'oklab(0.72 0.14 0.12 / 0.8) 0%, ' + // warm orange
        'oklab(0.75 0.12 0.08 / 0.8) 25%, ' + // coral
        'oklab(0.70 0.15 0.02 / 0.8) 50%, ' + // pink
        'oklab(0.65 0.12 -0.04 / 0.8) 75%, ' + // purple-pink
        'oklab(0.58 0.08 -0.08 / 0.8) 100%)' // deep purple
};

const blockColors = {
    checkboxActiveBackground: 'oklab(0.75 0.12 0.08)',
    checkboxActiveBorder: 'oklab(0.72 0.14 0.06)'
};

export {
    guiColors,
    blockColors
};
