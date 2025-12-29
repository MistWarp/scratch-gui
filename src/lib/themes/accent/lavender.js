const guiColors = {
    'motion-primary': 'oklab(0.75 0.08 -0.12)',
    'motion-primary-transparent': 'oklab(0.75 0.08 -0.12 / 0.75)',
    'motion-tertiary': 'oklab(0.78 0.06 -0.10)',

    'looks-secondary': 'oklab(0.75 0.08 -0.12)',
    'looks-transparent': 'oklab(0.75 0.08 -0.12 / 0.35)',
    'looks-light-transparent': 'oklab(0.75 0.08 -0.12 / 0.15)',
    'looks-secondary-dark': 'oklab(0.65 0.10 -0.14)',

    'extensions-primary': 'oklab(0.78 0.06 -0.10)',
    'extensions-tertiary': 'oklab(0.82 0.04 -0.08)',
    'extensions-transparent': 'oklab(0.78 0.06 -0.10 / 0.35)',
    'extensions-light': 'oklab(0.85 0.02 -0.06)',
    
    'drop-highlight': 'oklab(0.75 0.08 -0.12)',

    'menu-bar-background-image':
        'linear-gradient(90deg, ' +
        'oklab(0.72 0.10 -0.14 / 0.8) 0%, ' + // deep lavender
        'oklab(0.75 0.08 -0.12 / 0.8) 20%, ' + // lavender
        'oklab(0.78 0.06 -0.08 / 0.8) 40%, ' + // light lavender
        'oklab(0.80 0.08 -0.04 / 0.8) 60%, ' + // lavender pink
        'oklab(0.82 0.10 0.00 / 0.8) 80%, ' + // soft pink
        'oklab(0.85 0.08 0.04 / 0.8) 100%)' // pale pink
};

const blockColors = {
    checkboxActiveBackground: 'oklab(0.75 0.08 -0.12)',
    checkboxActiveBorder: 'oklab(0.78 0.06 -0.10)'
};

export {
    guiColors,
    blockColors
};
