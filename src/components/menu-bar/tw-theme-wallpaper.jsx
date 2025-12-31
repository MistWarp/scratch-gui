import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import {FormattedMessage} from 'react-intl';
import {connect} from 'react-redux';

import ChevronDown from './ChevronDown.jsx';
import {MenuItem, Submenu} from '../menu/menu.jsx';
import {Theme} from '../../lib/themes/index.js';
import {openWallpaperMenu, wallpaperMenuOpen, closeSettingsMenu} from '../../reducers/menus.js';
import {setTheme} from '../../reducers/theme.js';
import {applyTheme} from '../../lib/themes/themePersistance.js';
import styles from './settings-menu.css';

import {Check, Wallpaper, Trash} from 'lucide-react';

const WallpaperMenuItem = ({url, isSelected, onClick, onRemove}) => (
    <MenuItem onClick={onClick}>
        <div className={styles.option}>
            <Check
                className={classNames(styles.check, {[styles.selected]: isSelected})}
                size={15}
            />
            <div className={styles.wallpaperPreview}>
                {url ? (
                    <img
                        src={url}
                        alt=""
                        className={styles.wallpaperThumbnail}
                        onError={e => {
                            e.target.style.display = 'none';
                        }}
                    />
                ) : (
                    <div className={styles.noWallpaper}>
                        <FormattedMessage
                            defaultMessage="None"
                            description="Label for no wallpaper option"
                            id="tw.wallpaper.none"
                        />
                    </div>
                )}
            </div>
            <span className={styles.wallpaperUrl}>
                {url ? url.substring(0, 50) + (url.length > 50 ? '...' : '') : (
                    <FormattedMessage
                        defaultMessage="No wallpaper"
                        description="Label for no wallpaper selected"
                        id="tw.wallpaper.noWallpaper"
                    />
                )}
            </span>
            {onRemove ? (
                <button
                    type="button"
                    className={styles.removeWallpaperButton}
                    title="Remove wallpaper"
                    aria-label="Remove wallpaper"
                    onClick={e => {
                        e.stopPropagation();
                        onRemove(url);
                    }}
                >
                    <Trash size={14} className={styles.removeWallpaperIcon} style={{margin: '0'}} size={20} />
                </button>
            ) : null}
        </div>
    </MenuItem>
);

WallpaperMenuItem.propTypes = {
    url: PropTypes.string,
    isSelected: PropTypes.bool,
    onClick: PropTypes.func,
    onRemove: PropTypes.func
};

const WallpaperInputForm = ({onSubmit, onOpacityChange, onDarknessChange, onGridVisibilityChange, currentOpacity, currentDarkness, currentGridVisible}) => {
    const [url, setUrl] = React.useState('');
    const [opacity, setOpacity] = React.useState(currentOpacity);
    const [darkness, setDarkness] = React.useState(currentDarkness);

    React.useEffect(() => {
        setOpacity(currentOpacity);
    }, [currentOpacity]);

    React.useEffect(() => {
        setDarkness(currentDarkness);
    }, [currentDarkness]);

    const handleSubmit = e => {
        e.preventDefault();
        if (url.trim()) {
            onSubmit(url.trim(), opacity, darkness);
            setUrl('');
        }
    };

    const handleOpacityChange = e => {
        const newOpacity = parseFloat(e.target.value);
        setOpacity(newOpacity);
        onOpacityChange(newOpacity);
    };

    const handleDarknessChange = e => {
        const newDarkness = parseFloat(e.target.value);
        setDarkness(newDarkness);
        onDarknessChange(newDarkness);
    };

    return (
        <div className={styles.wallpaperForm} onClick={e => e.stopPropagation()}>
            <form onSubmit={handleSubmit} onClick={e => e.stopPropagation()}>
                <input
                    type="url"
                    placeholder="Enter image URL..."
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    onClick={e => e.stopPropagation()}
                    className={styles.wallpaperInput}
                />
                <div className={styles.wallpaperButtons}>
                    <button
                        type="submit"
                        className={styles.wallpaperButton}
                        disabled={!url.trim()}
                        onClick={e => e.stopPropagation()}
                    >
                        <FormattedMessage
                            defaultMessage="Add"
                            description="Button to add wallpaper"
                            id="tw.wallpaper.add"
                        />
                    </button>
                </div>
            </form>
            <div className={styles.opacityControl} onClick={e => e.stopPropagation()}>
                <label htmlFor="wallpaper-opacity" onClick={e => e.stopPropagation()}>
                    <FormattedMessage
                        defaultMessage="Opacity:"
                        description="Label for wallpaper opacity slider"
                        id="tw.wallpaper.opacity"
                    />
                </label>
                <input
                    id="wallpaper-opacity"
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.1"
                    value={opacity}
                    onChange={handleOpacityChange}
                    onClick={e => e.stopPropagation()}
                    onPointerDown={e => {
                        const target = e.currentTarget || e.target;
                        if (target && e.pointerId && target.setPointerCapture) {
                            try {
                                target.setPointerCapture(e.pointerId);
                            } catch (err) {}
                        }
                        e.stopPropagation();
                    }}
                    onPointerMove={e => e.stopPropagation()}
                    onPointerUp={e => {
                        const target = e.currentTarget || e.target;
                        if (target && e.pointerId && target.releasePointerCapture) {
                            try {
                                target.releasePointerCapture(e.pointerId);
                            } catch (err) {}
                        }
                        e.stopPropagation();
                    }}
                    onPointerCancel={e => e.stopPropagation()}
                    className={styles.opacitySlider}
                />
                <span className={styles.opacityValue} onClick={e => e.stopPropagation()}>{Math.round(opacity * 100)}%</span>
            </div>
            <div className={styles.opacityControl} onClick={e => e.stopPropagation()}>
                <label htmlFor="wallpaper-darkness" onClick={e => e.stopPropagation()}>
                    <FormattedMessage
                        defaultMessage="Darkness:"
                        description="Label for wallpaper darkness slider"
                        id="tw.wallpaper.darkness"
                    />
                </label>
                <input
                    id="wallpaper-darkness"
                    type="range"
                    min="0"
                    max="0.8"
                    step="0.1"
                    value={darkness}
                    onChange={handleDarknessChange}
                    onClick={e => e.stopPropagation()}
                    onPointerDown={e => {
                        const target = e.currentTarget || e.target;
                        if (target && e.pointerId && target.setPointerCapture) {
                            try {
                                target.setPointerCapture(e.pointerId);
                            } catch (err) {}
                        }
                        e.stopPropagation();
                    }}
                    onPointerMove={e => e.stopPropagation()}
                    onPointerUp={e => {
                        const target = e.currentTarget || e.target;
                        if (target && e.pointerId && target.releasePointerCapture) {
                            try {
                                target.releasePointerCapture(e.pointerId);
                            } catch (err) {}
                        }
                        e.stopPropagation();
                    }}
                    onPointerCancel={e => e.stopPropagation()}
                    className={styles.opacitySlider}
                />
                <span className={styles.opacityValue} onClick={e => e.stopPropagation()}>{Math.round(darkness * 100)}%</span>
            </div>
            <div className={styles.opacityControl} onClick={e => e.stopPropagation()}>
                <label htmlFor="wallpaper-grid-visible" onClick={e => e.stopPropagation()}>
                    <FormattedMessage
                        defaultMessage="Show Grid:"
                        description="Label for wallpaper grid visibility toggle"
                        id="tw.wallpaper.showGrid"
                    />
                </label>
                <input
                    id="wallpaper-grid-visible"
                    type="checkbox"
                    checked={currentGridVisible}
                    onChange={e => onGridVisibilityChange(e.target.checked)}
                    onClick={e => e.stopPropagation()}
                    className={styles.gridToggle}
                />
            </div>
        </div>
    );
};

WallpaperInputForm.propTypes = {
    onSubmit: PropTypes.func,
    onOpacityChange: PropTypes.func,
    onDarknessChange: PropTypes.func,
    onGridVisibilityChange: PropTypes.func,
    currentOpacity: PropTypes.number,
    currentDarkness: PropTypes.number,
    currentGridVisible: PropTypes.bool
};

const WallpaperMenu = ({
    isOpen,
    isRtl,
    onChangeTheme,
    onOpen,
    onPreviewTheme,
    theme
}) => {
    const prevIsOpen = React.useRef(isOpen);
    React.useEffect(() => {
        if (prevIsOpen.current && !isOpen) {
            onChangeTheme(theme);
        }
        prevIsOpen.current = isOpen;
    }, [isOpen, theme, onChangeTheme]);
    const handleWallpaperAdd = (url, opacity, darkness) => {
        const history = [...(theme.wallpaper.history || [])];
        if (!history.includes(url)) {
            history.unshift(url);
            if (history.length > 10) { // Keep last 10 wallpapers
                history.pop();
            }
        }

        const newWallpaper = {
            ...theme.wallpaper,
            history
        };

        onPreviewTheme(theme.set('wallpaper', newWallpaper));
    };

    

    const handleRemoveWallpaper = urlToRemove => {
        const history = (theme.wallpaper.history || []).filter(u => u !== urlToRemove);
        const newWallpaper = {
            ...theme.wallpaper,
            history
        };
        onPreviewTheme(theme.set('wallpaper', newWallpaper));
    };

    const handleOpacityChange = opacity => {
        const newWallpaper = {
            ...theme.wallpaper,
            opacity
        };
        onPreviewTheme(theme.set('wallpaper', newWallpaper));
    };

    const handleDarknessChange = darkness => {
        const newWallpaper = {
            ...theme.wallpaper,
            darkness
        };
        onPreviewTheme(theme.set('wallpaper', newWallpaper));
    };

    const handleGridVisibilityChange = gridVisible => {
        const newWallpaper = {
            ...theme.wallpaper,
            gridVisible
        };
        onPreviewTheme(theme.set('wallpaper', newWallpaper));
    };

    const handleWallpaperSelect = url => {
        const newWallpaper = {
            ...theme.wallpaper,
            url
        };
        onPreviewTheme(theme.set('wallpaper', newWallpaper));
    };

    return (
        <MenuItem expanded={isOpen}>
            <div
                className={styles.option}
                onClick={onOpen}
            >
                <Wallpaper className={styles.icon} />
                <span className={styles.submenuLabel}>
                    <FormattedMessage
                        defaultMessage="Wallpaper"
                        description="Label for wallpaper menu"
                        id="tw.menuBar.wallpaper"
                    />
                </span>
                <ChevronDown className={styles.expandCaret} />
            </div>
            <Submenu
                place={isRtl ? 'left' : 'right'}
                className={styles.submenu}
            >
                <WallpaperInputForm
                    onSubmit={handleWallpaperAdd}
                    onOpacityChange={handleOpacityChange}
                    onDarknessChange={handleDarknessChange}
                    onGridVisibilityChange={handleGridVisibilityChange}
                    currentOpacity={theme.wallpaper.opacity}
                    currentDarkness={theme.wallpaper.darkness || 0}
                    currentGridVisible={theme.wallpaper.gridVisible !== false}
                />
                <div className={styles.menuSeparator} />
                <WallpaperMenuItem
                    url=""
                    isSelected={!theme.wallpaper.url}
                    onClick={() => handleWallpaperSelect('')}
                />
                {theme.wallpaper.history.map(url => (
                    <WallpaperMenuItem
                        key={url}
                        url={url}
                        isSelected={theme.wallpaper.url === url}
                        onClick={() => handleWallpaperSelect(url)}
                        onRemove={handleRemoveWallpaper}
                    />
                ))}
            </Submenu>
        </MenuItem>
    );
};

WallpaperMenu.propTypes = {
    isOpen: PropTypes.bool,
    isRtl: PropTypes.bool,
    onChangeTheme: PropTypes.func,
    onPreviewTheme: PropTypes.func,
    onOpen: PropTypes.func,
    theme: PropTypes.instanceOf(Theme)
};

const mapStateToProps = state => ({
    isOpen: wallpaperMenuOpen(state),
    isRtl: state.locales.isRtl,
    theme: state.scratchGui.theme.theme
});

const mapDispatchToProps = dispatch => ({
    onChangeTheme: theme => {
        dispatch(setTheme(theme));
        dispatch(closeSettingsMenu());
        applyTheme(theme);
    },
    onPreviewTheme: theme => {
        dispatch(setTheme(theme));
        applyTheme(theme);
    },
    onOpen: () => dispatch(openWallpaperMenu())
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(WallpaperMenu);