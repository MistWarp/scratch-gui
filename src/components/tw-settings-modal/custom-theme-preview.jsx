import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

import styles from './custom-themes.css';

const FALLBACK_ACCENT = '#855cd6';
const BLOCK_CATEGORIES = ['motion', 'looks', 'sounds', 'control'];
const SCRIPT_BLOCKS = [
    {category: 'event', width: '48%'},
    {category: 'motion', width: '70%'},
    {category: 'looks', width: '58%'},
    {category: 'control', width: '40%'}
];

const resolveColor = (colors, value, depth = 0) => {
    if (typeof value !== 'string') return null;
    const match = value.match(/^var\(--([\w-]+)\)$/);
    if (!match) return value;
    if (depth > 4) return null;
    return resolveColor(colors, colors[match[1]], depth + 1);
};

const safeWallpaperUrl = wallpaper => {
    const url = wallpaper && typeof wallpaper.url === 'string' ? wallpaper.url.trim() : '';
    if (!/^(https?:|data:image\/)/i.test(url)) return '';
    return url.replace(/["\\\n\r]/g, encodeURIComponent);
};

const previewColors = theme => {
    let gui = {};
    let blocks = {};
    try {
        gui = theme.getGuiColors() || {};
    } catch (_) {
        gui = {};
    }
    try {
        blocks = theme.getBlockColors() || {};
    } catch (_) {
        blocks = {};
    }
    const color = key => resolveColor(gui, gui[key]);
    const accent = color('looks-secondary') || FALLBACK_ACCENT;
    const image = gui['menu-bar-background-image'];
    const blockColor = category => (blocks[category] && blocks[category].primary) || accent;
    return {
        accent,
        menuBar: image && image !== 'none' ? `${image}, ${accent}` : accent,
        menuText: color('menu-bar-foreground') || '#ffffff',
        frame: color('ui-primary') || '#e5f0ff',
        palette: color('ui-secondary') || '#e9f1fc',
        workspace: color('ui-white') || '#ffffff',
        line: color('ui-tertiary') || '#d9e3f2',
        text: color('text-primary') || '#575e75',
        blockColor
    };
};

const CustomThemePreview = ({className, theme}) => {
    const colors = previewColors(theme);
    const wallpaperUrl = safeWallpaperUrl(theme.wallpaper);
    const wallpaperOpacity = theme.wallpaper && typeof theme.wallpaper.opacity === 'number' ?
        theme.wallpaper.opacity : 0.3;
    return (
        <div
            className={classNames(styles.preview, className)}
            style={{background: colors.frame, color: colors.text}}
            aria-hidden="true"
        >
            <div
                className={styles.previewMenu}
                style={{background: colors.menuBar}}
            >
                <span
                    className={styles.previewLogo}
                    style={{background: colors.menuText}}
                />
                <span
                    className={styles.previewMenuItem}
                    style={{background: colors.menuText}}
                />
                <span
                    className={styles.previewMenuItem}
                    style={{background: colors.menuText}}
                />
            </div>
            <div className={styles.previewBody}>
                <div
                    className={styles.previewCategories}
                    style={{background: colors.palette}}
                >
                    {BLOCK_CATEGORIES.map(category => (
                        <span
                            key={category}
                            className={styles.previewCategory}
                            style={{background: colors.blockColor(category)}}
                        />
                    ))}
                </div>
                <div
                    className={styles.previewWorkspace}
                    style={{background: colors.workspace}}
                >
                    {wallpaperUrl ? (
                        <span
                            className={styles.previewWallpaper}
                            style={{backgroundImage: `url("${wallpaperUrl}")`, opacity: wallpaperOpacity}}
                        />
                    ) : null}
                    <div className={styles.previewScript}>
                        {SCRIPT_BLOCKS.map(block => (
                            <span
                                key={block.category}
                                className={styles.previewBlock}
                                style={{background: colors.blockColor(block.category), width: block.width}}
                            />
                        ))}
                    </div>
                </div>
                <div className={styles.previewSide}>
                    <span
                        className={styles.previewStage}
                        style={{background: colors.workspace, borderColor: colors.line}}
                    />
                    <span
                        className={styles.previewButton}
                        style={{background: colors.accent}}
                    />
                </div>
            </div>
        </div>
    );
};

CustomThemePreview.propTypes = {
    className: PropTypes.string,
    theme: PropTypes.shape({
        getGuiColors: PropTypes.func,
        getBlockColors: PropTypes.func,
        wallpaper: PropTypes.shape({
            url: PropTypes.string,
            opacity: PropTypes.number
        })
    }).isRequired
};

export default CustomThemePreview;
