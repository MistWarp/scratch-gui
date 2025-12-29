const guiColors = {
    'motion-primary': 'oklab(0.68 0.15 -0.08)',
    'motion-primary-transparent': 'oklab(0.68 0.15 -0.08 / 0.75)',
    'motion-tertiary': 'oklab(0.72 0.12 -0.06)',

    'looks-secondary': 'oklab(0.68 0.15 -0.08)',
    'looks-transparent': 'oklab(0.68 0.15 -0.08 / 0.35)',
    'looks-light-transparent': 'oklab(0.68 0.15 -0.08 / 0.15)',
    'looks-secondary-dark': 'oklab(0.58 0.18 -0.10)',

    'extensions-primary': 'oklab(0.72 0.12 -0.06)',
    'extensions-tertiary': 'oklab(0.65 0.08 -0.12)',
    'extensions-transparent': 'oklab(0.72 0.12 -0.06 / 0.35)',
    'extensions-light': 'oklab(0.78 0.08 -0.04)',
    
    'drop-highlight': 'oklab(0.68 0.15 -0.08)',

    'menu-bar-background-image':
        'linear-gradient(90deg, ' +
        'oklab(0.45 0.08 -0.15 / 0.8) 0%, ' + // deep purple
        'oklab(0.55 0.12 -0.12 / 0.8) 20%, ' + // purple
        'oklab(0.65 0.15 -0.08 / 0.8) 40%, ' + // magenta
        'oklab(0.70 0.12 -0.04 / 0.8) 60%, ' + // pink
        'oklab(0.65 0.05 -0.10 / 0.8) 80%, ' + // blue-purple
        'oklab(0.60 -0.02 -0.12 / 0.8) 100%)' // cosmic blue
};

const blockColors = {
    checkboxActiveBackground: 'oklab(0.68 0.15 -0.08)',
    checkboxActiveBorder: 'oklab(0.72 0.12 -0.06)'
};

export {
    guiColors,
    blockColors
};
