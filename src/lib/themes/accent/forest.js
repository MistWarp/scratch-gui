const guiColors = {
    'motion-primary': 'oklab(0.65 -0.12 0.12)',
    'motion-primary-transparent': 'oklab(0.65 -0.12 0.12 / 0.75)',
    'motion-tertiary': 'oklab(0.68 -0.10 0.14)',

    'looks-secondary': 'oklab(0.65 -0.12 0.12)',
    'looks-transparent': 'oklab(0.65 -0.12 0.12 / 0.35)',
    'looks-light-transparent': 'oklab(0.65 -0.12 0.12 / 0.15)',
    'looks-secondary-dark': 'oklab(0.55 -0.14 0.10)',

    'extensions-primary': 'oklab(0.68 -0.10 0.14)',
    'extensions-tertiary': 'oklab(0.72 -0.08 0.16)',
    'extensions-transparent': 'oklab(0.68 -0.10 0.14 / 0.35)',
    'extensions-light': 'oklab(0.75 -0.06 0.18)',
    
    'drop-highlight': 'oklab(0.65 -0.12 0.12)',

    'menu-bar-background-image':
        'linear-gradient(90deg, ' +
        'oklab(0.55 -0.14 0.10 / 0.8) 0%, ' + // deep forest
        'oklab(0.60 -0.12 0.12 / 0.8) 20%, ' + // dark green
        'oklab(0.65 -0.10 0.14 / 0.8) 40%, ' + // forest green
        'oklab(0.70 -0.08 0.16 / 0.8) 60%, ' + // medium green
        'oklab(0.75 -0.06 0.18 / 0.8) 80%, ' + // light green
        'oklab(0.80 -0.04 0.20 / 0.8) 100%)' // bright green
};

const blockColors = {
    checkboxActiveBackground: 'oklab(0.65 -0.12 0.12)',
    checkboxActiveBorder: 'oklab(0.68 -0.10 0.14)'
};

export {
    guiColors,
    blockColors
};
