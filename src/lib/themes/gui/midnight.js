import icon from '!!raw-loader!../icons/midnight.svg';

const name = 'Midnight';

const guiColors = {
    'color-scheme': 'dark',

    'ui-primary': '#000000',
    'ui-secondary': '#0a0a0a',
    'ui-tertiary': '#151515',

    'ui-modal-overlay': '#222222aa',
    'ui-modal-background': '#000000',
    'ui-modal-foreground': '#eeeeee',
    'ui-modal-header-background': '#222222',
    'ui-modal-header-foreground': '#ffffff',

    'ui-white': '#000000',

    'ui-black-transparent': '#ffffff26',

    'text-primary': '#eeeeee',

    'menu-bar-background': '#222222',

    'assets-background': '#000000',

    'input-background': '#0a0a0a',

    'popover-background': '#0a0a0a',

    'badge-background': '#101820',
    'badge-border': '#152638',

    'fullscreen-background': '#000000',
    'fullscreen-accent': '#000000',

    'page-background': '#000000',
    'page-foreground': '#eeeeee',

    'project-title-inactive': 'var(--ui-secondary)',
    'project-title-hover': '#ffffff3f',

    'link-color': '#44aaff',

    'filter-icon-black': 'invert(100%)',
    'filter-icon-gray': 'grayscale(100%) brightness(1.7)',
    'filter-icon-white': 'brightness(0) invert(100%)',

    'paint-filter-icon-gray': 'brightness(1.7)'
};

const blockColors = {
    insertionMarker: '#cccccc',
    workspace: '#0a0a0a',
    toolboxSelected: '#0a0a0a',
    toolboxText: '#cccccc',
    toolbox: '#000000',
    flyout: '#000000',
    scrollbar: '#555555',
    valueReportBackground: '#0a0a0a',
    valueReportBorder: '#222222',
    valueReportForeground: '#eeeeee',
    contextMenuBackground: '#000000',
    contextMenuBorder: '#ffffff26',
    contextMenuForeground: '#eeeeee',
    contextMenuActiveBackground: '#1a1a1a',
    contextMenuDisabledForeground: '#666666',
    flyoutLabelColor: '#cccccc',
    checkboxInactiveBackground: '#111111',
    checkboxInactiveBorder: '#c8c8c8',
    buttonBorder: '#c6c6c6',
    buttonActiveBackground: '#111111',
    buttonForeground: '#cccccc',
    zoomIconFilter: 'invert(100%)',
    gridColor: '#383838'
};

export {
    name,
    icon,
    guiColors,
    blockColors
};
