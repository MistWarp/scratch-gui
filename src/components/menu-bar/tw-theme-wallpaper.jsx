import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import {FormattedMessage} from 'react-intl';
import {connect} from 'react-redux';

import check from './check.svg';
import dropdownCaret from './dropdown-caret.svg';
import wallpaperIcon from './tw-wallpaper.svg';
import {MenuItem, Submenu} from '../menu/menu.jsx';
import {Theme} from '../../lib/themes/index.js';
import {openWallpaperMenu, wallpaperMenuOpen, closeSettingsMenu} from '../../reducers/menus.js';
import {setTheme} from '../../reducers/theme.js';
import {persistTheme} from '../../lib/themes/themePersistance.js';
import styles from './settings-menu.css';

const WallpaperMenuItem = ({url, isSelected, onClick}) => (
    <MenuItem onClick={onClick}>
        <div className={styles.option}>
            <img
                className={classNames(styles.check, {[styles.selected]: isSelected})}
                width={15}
                height={12}
                src={check}
                draggable={false}
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
        </div>
    </MenuItem>
);

WallpaperMenuItem.propTypes = {
    url: PropTypes.string,
    isSelected: PropTypes.bool,
    onClick: PropTypes.func
};

const WallpaperInputForm = ({onSubmit, onOpacityChange, currentOpacity}) => {
    const [url, setUrl] = React.useState('');
    const [opacity, setOpacity] = React.useState(currentOpacity);

    // Sync local opacity state with currentOpacity prop
    React.useEffect(() => {
        setOpacity(currentOpacity);
    }, [currentOpacity]);

    const handleSubmit = e => {
        e.preventDefault();
        if (url.trim()) {
            onSubmit(url.trim(), opacity);
            setUrl('');
        }
    };

    const handleOpacityChange = e => {
        const newOpacity = parseFloat(e.target.value);
        console.log('🎚️ Slider Debug - handleOpacityChange:', {
            rawValue: e.target.value,
            parsedOpacity: newOpacity,
            currentLocalOpacity: opacity,
            currentPropOpacity: currentOpacity
        });
        setOpacity(newOpacity);
        onOpacityChange(newOpacity);
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
                    onMouseDown={e => e.stopPropagation()}
                    onMouseUp={e => e.stopPropagation()}
                    onMouseMove={e => e.stopPropagation()}
                    onTouchStart={e => e.stopPropagation()}
                    onTouchMove={e => e.stopPropagation()}
                    onTouchEnd={e => e.stopPropagation()}
                    className={styles.opacitySlider}
                />
                <span className={styles.opacityValue} onClick={e => e.stopPropagation()}>{Math.round(opacity * 100)}%</span>
            </div>
        </div>
    );
};

WallpaperInputForm.propTypes = {
    onSubmit: PropTypes.func,
    onOpacityChange: PropTypes.func,
    currentOpacity: PropTypes.number
};

const WallpaperMenu = ({
    isOpen,
    isRtl,
    onChangeTheme,
    onOpen,
    theme
}) => {
    const handleWallpaperSubmit = (url, opacity) => {
        const history = [...theme.wallpaper.history];
        if (!history.includes(url)) {
            history.unshift(url);
            if (history.length > 10) { // Keep last 10 wallpapers
                history.pop();
            }
        }
        
        const newWallpaper = {
            url,
            opacity,
            history
        };
        
        onChangeTheme(theme.set('wallpaper', newWallpaper));
    };

    const handleOpacityChange = opacity => {
        console.log('🔄 WallpaperMenu Debug - handleOpacityChange:', {
            newOpacity: opacity,
            currentWallpaperOpacity: theme.wallpaper.opacity,
            fullWallpaperObject: theme.wallpaper
        });
        const newWallpaper = {
            ...theme.wallpaper,
            opacity
        };
        console.log('🔄 Created new wallpaper object:', newWallpaper);
        onChangeTheme(theme.set('wallpaper', newWallpaper));
    };

    const handleWallpaperSelect = url => {
        const newWallpaper = {
            ...theme.wallpaper,
            url
        };
        onChangeTheme(theme.set('wallpaper', newWallpaper));
    };

    return (
        <MenuItem expanded={isOpen}>
            <div
                className={styles.option}
                onClick={onOpen}
            >
                <img
                    className={styles.accentIconOuter}
                    src={wallpaperIcon}
                    draggable={false}
                    width={24}
                    height={24}
                    alt=""
                />
                <span className={styles.submenuLabel}>
                    <FormattedMessage
                        defaultMessage="Wallpaper"
                        description="Label for wallpaper menu"
                        id="tw.menuBar.wallpaper"
                    />
                </span>
                <img
                    className={styles.expandCaret}
                    src={dropdownCaret}
                    draggable={false}
                />
            </div>
            <Submenu
                place={isRtl ? 'left' : 'right'}
                className={styles.submenu}
            >
                <WallpaperInputForm
                    onSubmit={handleWallpaperSubmit}
                    onOpacityChange={handleOpacityChange}
                    currentOpacity={theme.wallpaper.opacity}
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
        console.log('🚀 Redux Debug - dispatching setTheme:', {
            newTheme: theme,
            wallpaperOpacity: theme.wallpaper.opacity,
            themeId: theme.id
        });
        dispatch(setTheme(theme));
        dispatch(closeSettingsMenu());
        persistTheme(theme);
    },
    onOpen: () => dispatch(openWallpaperMenu())
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(WallpaperMenu);
