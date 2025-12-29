const guiColors = {
    'motion-primary': 'oklab(0.72 0.14 0.10)',
    'motion-primary-transparent': 'oklab(0.72 0.14 0.10 / 0.75)',
    'motion-tertiary': 'oklab(0.75 0.12 0.08)',

    'looks-secondary': 'oklab(0.72 0.14 0.10)',
    'looks-transparent': 'oklab(0.72 0.14 0.10 / 0.35)',
    'looks-light-transparent': 'oklab(0.72 0.14 0.10 / 0.15)',
    'looks-secondary-dark': 'oklab(0.62 0.16 0.12)',

    'extensions-primary': 'oklab(0.75 0.12 0.08)',
    'extensions-tertiary': 'oklab(0.78 0.10 0.06)',
    'extensions-transparent': 'oklab(0.75 0.12 0.08 / 0.35)',
    'extensions-light': 'oklab(0.82 0.08 0.04)',
    
    'drop-highlight': 'oklab(0.72 0.14 0.10)',

    'menu-bar-background-image':
        'linear-gradient(90deg, ' +
        'oklab(0.68 0.16 0.12 / 0.8) 0%, ' + // deep coral
        'oklab(0.72 0.14 0.10 / 0.8) 20%, ' + // coral
        'oklab(0.75 0.12 0.08 / 0.8) 40%, ' + // light coral
        'oklab(0.78 0.10 0.06 / 0.8) 60%, ' + // pale coral
        'oklab(0.80 0.08 0.08 / 0.8) 80%, ' + // peach
        'oklab(0.85 0.06 0.04 / 0.8) 100%)' // soft peach
};

const blockColors = {
    checkboxActiveBackground: 'oklab(0.72 0.14 0.10)',
    checkboxActiveBorder: 'oklab(0.75 0.12 0.08)'
};

export {
    guiColors,
    blockColors
};
