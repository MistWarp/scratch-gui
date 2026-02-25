const guiColors = {
    'motion-primary': 'oklab(0.70 -0.10 0.08)',
    'motion-primary-transparent': 'oklab(0.70 -0.10 0.08 / 0.75)',
    'motion-tertiary': 'oklab(0.75 -0.08 0.06)',

    'looks-secondary': 'oklab(0.70 -0.10 0.08)',
    'looks-tertiary': 'hsla(215, 100%, 55%, 1)',
    'looks-transparent': 'oklab(0.70 -0.10 0.08 / 0.35)',
    'looks-light-transparent': 'oklab(0.70 -0.10 0.08 / 0.15)',
    'looks-secondary-dark': 'oklab(0.60 -0.12 0.10)',

    'extensions-primary': 'oklab(0.75 -0.08 0.06)',
    'extensions-tertiary': 'oklab(0.65 -0.06 -0.08)',
    'extensions-transparent': 'oklab(0.75 -0.08 0.06 / 0.35)',
    'extensions-light': 'oklab(0.80 -0.04 0.04)',
    
    'drop-highlight': 'oklab(0.70 -0.10 0.08)',

    'menu-bar-background-image':
        'linear-gradient(90deg, ' +
        'oklab(0.65 -0.12 0.10 / 0.8) 0%, ' + // emerald green
        'oklab(0.70 -0.10 0.05 / 0.8) 20%, ' + // green-teal
        'oklab(0.65 -0.08 -0.05 / 0.8) 40%, ' + // teal-blue
        'oklab(0.60 -0.06 -0.10 / 0.8) 60%, ' + // blue
        'oklab(0.55 0.02 -0.12 / 0.8) 80%, ' + // purple-blue
        'oklab(0.60 0.08 -0.08 / 0.8) 100%)' // purple
};

const blockColors = {
    checkboxActiveBackground: 'oklab(0.70 -0.10 0.08)',
    checkboxActiveBorder: 'oklab(0.75 -0.08 0.06)'
};

export {
    guiColors,
    blockColors
};
