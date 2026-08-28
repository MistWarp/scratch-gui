const themeGradientStyle = theme => {
    const data = theme && (theme.theme || theme);
    const colors = data?.accent?.colors;
    if (!Array.isArray(colors) || colors.length === 0) return {};
    const stops = [...colors]
        .sort((a, b) => Number(a.position) - Number(b.position))
        .map(stop => `${stop.color} ${stop.position}%`)
        .join(', ');
    return {background: `linear-gradient(${data.accent.direction || 135}deg, ${stops})`};
};

const exportCurrentTheme = theme => {
    const colors = theme && typeof theme.getGuiColors === 'function' ? theme.getGuiColors() : {};
    const exported = theme && typeof theme.export === 'function' ? theme.export() : null;
    if (exported && exported.accent && Array.isArray(exported.accent.colors)) return exported;
    return {
        ...exported,
        name: exported?.name || theme?.name || 'My MistWarp Theme',
        description: exported?.description || '',
        accent: {
            colors: [
                {color: colors['looks-secondary'] || '#4c97ff', position: 0},
                {color: colors['looks-tertiary'] || '#9966ff', position: 100}
            ],
            direction: 135
        },
        gui: theme?.gui || 'light',
        blocks: theme?.blocks || 'three',
        menuBarAlign: theme?.menuBarAlign || 'center',
        wallpaper: theme?.wallpaper || {},
        fonts: theme?.fonts || {system: [], google: []}
    };
};

export {themeGradientStyle, exportCurrentTheme};
