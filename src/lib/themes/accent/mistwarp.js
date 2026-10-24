// Fills use a warm orchid, #b660be, with white text. That's 3.88:1, so text
// on it is kept semibold or bold and at least 14px. Hover and pressed go
// deeper, never lighter. Accent text and indicators use the logo pink,
// #d399e5, wherever it reads at 4.5:1, which means dark backgrounds.
const guiColors = {
    'motion-primary': '#b660be',
    'motion-primary-transparent': '#b660bee6',
    'motion-tertiary': '#a855b0',

    'looks-secondary': '#b660be',
    'looks-transparent': '#b660be59',
    'looks-light-transparent': '#b660be26',
    'looks-secondary-dark': '#a855b0',

    'extensions-primary': '#c47acb',
    'extensions-tertiary': '#a855b0',
    'extensions-transparent': '#b660be59',
    'extensions-light': '#ecd3f4',

    'drop-highlight': '#d399e5',

    'menu-bar-hover': '#a855b0',
    'menu-bar-pressed': '#9c4aa4',

    'accent-text': '#d399e5'
};

const blockColors = {
    checkboxActiveBackground: '#b660be',
    checkboxActiveBorder: '#a855b0'
};

export {
    guiColors,
    blockColors
};
