const guiColors = {
    'motion-primary': 'oklab(0.65 -0.08 -0.12)',
    'motion-primary-transparent': 'oklab(0.65 -0.08 -0.12 / 0.75)',
    'motion-tertiary': 'oklab(0.70 -0.06 -0.10)',

    'looks-secondary': 'oklab(0.65 -0.08 -0.12)',
    'looks-transparent': 'oklab(0.65 -0.08 -0.12 / 0.35)',
    'looks-light-transparent': 'oklab(0.65 -0.08 -0.12 / 0.15)',
    'looks-secondary-dark': 'oklab(0.55 -0.10 -0.14)',

    'extensions-primary': 'oklab(0.70 -0.06 -0.10)',
    'extensions-tertiary': 'oklab(0.75 -0.04 -0.08)',
    'extensions-transparent': 'oklab(0.70 -0.06 -0.10 / 0.35)',
    'extensions-light': 'oklab(0.80 -0.02 -0.06)',
    
    'drop-highlight': 'oklab(0.65 -0.08 -0.12)',

    'menu-bar-background-image':
        'linear-gradient(90deg, ' +
        'oklab(0.45 -0.05 -0.15 / 0.8) 0%, ' + // deep blue
        'oklab(0.55 -0.08 -0.12 / 0.8) 20%, ' + // ocean blue
        'oklab(0.65 -0.08 -0.08 / 0.8) 40%, ' + // teal
        'oklab(0.70 -0.06 -0.04 / 0.8) 60%, ' + // aqua
        'oklab(0.80 -0.02 -0.02 / 0.8) 80%, ' + // cyan
        'oklab(0.85 0.00 0.00 / 0.8) 100%)' // light cyan
};

const blockColors = {
    checkboxActiveBackground: 'oklab(0.65 -0.08 -0.12)',
    checkboxActiveBorder: 'oklab(0.70 -0.06 -0.10)'
};

export {
    guiColors,
    blockColors
};
