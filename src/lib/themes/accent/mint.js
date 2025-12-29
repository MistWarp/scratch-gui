const guiColors = {
    'motion-primary': 'oklab(0.78 -0.12 0.08)',
    'motion-primary-transparent': 'oklab(0.78 -0.12 0.08 / 0.75)',
    'motion-tertiary': 'oklab(0.80 -0.10 0.06)',

    'looks-secondary': 'oklab(0.78 -0.12 0.08)',
    'looks-transparent': 'oklab(0.78 -0.12 0.08 / 0.35)',
    'looks-light-transparent': 'oklab(0.78 -0.12 0.08 / 0.15)',
    'looks-secondary-dark': 'oklab(0.68 -0.14 0.10)',

    'extensions-primary': 'oklab(0.80 -0.10 0.06)',
    'extensions-tertiary': 'oklab(0.75 -0.08 -0.02)',
    'extensions-transparent': 'oklab(0.80 -0.10 0.06 / 0.35)',
    'extensions-light': 'oklab(0.85 -0.06 0.04)',
    
    'drop-highlight': 'oklab(0.78 -0.12 0.08)',

    'menu-bar-background-image':
        'linear-gradient(90deg, ' +
        'oklab(0.75 -0.14 0.10 / 0.8) 0%, ' + // fresh mint
        'oklab(0.78 -0.12 0.08 / 0.8) 20%, ' + // mint green
        'oklab(0.80 -0.10 0.04 / 0.8) 40%, ' + // light mint
        'oklab(0.82 -0.08 0.00 / 0.8) 60%, ' + // mint white
        'oklab(0.80 -0.06 -0.04 / 0.8) 80%, ' + // mint cyan
        'oklab(0.75 -0.04 -0.08 / 0.8) 100%)' // soft cyan
};

const blockColors = {
    checkboxActiveBackground: 'oklab(0.78 -0.12 0.08)',
    checkboxActiveBorder: 'oklab(0.80 -0.10 0.06)'
};

export {
    guiColors,
    blockColors
};
