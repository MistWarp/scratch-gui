import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import {FormattedMessage} from 'react-intl';
import {connect} from 'react-redux';

import Box from '../box/box.jsx';
import Input from '../forms/input.jsx';
import FancyCheckbox from '../tw-fancy-checkbox/checkbox.jsx';
import {Theme} from '../../lib/themes/index.js';
import {PageHeader} from './theme-accent-panel.jsx';
import {themeStateToProps, themeDispatchToProps} from './theme-connect.js';

import styles from './settings-modal.css';

import {Trash} from 'lucide-react';

export class UnconnectedWallpaperPage extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            url: ''
        };
    }
    setWallpaper (patch) {
        const {theme, onChangeTheme} = this.props;
        onChangeTheme(theme.set('wallpaper', {...theme.wallpaper, ...patch}));
    }
    handleAdd = e => {
        e.preventDefault();
        const url = this.state.url.trim();
        if (!url) return;
        const history = [url, ...(this.props.theme.wallpaper.history || []).filter(u => u !== url)].slice(0, 10);
        this.setWallpaper({url, history});
        this.setState({url: ''});
    };
    handleRemove = url => {
        const wallpaper = this.props.theme.wallpaper;
        this.setWallpaper({
            history: (wallpaper.history || []).filter(u => u !== url),
            ...(wallpaper.url === url ? {url: ''} : null)
        });
    };
    handleSelectWallpaper = e => {
        this.setWallpaper({url: e.currentTarget.value});
    };
    handleRemoveWallpaper = e => {
        this.handleRemove(e.currentTarget.value);
    };
    handleUrlChange = e => {
        this.setState({url: e.target.value});
    };
    handleOpacityChange = e => {
        this.setWallpaper({opacity: parseFloat(e.target.value)});
    };
    handleDarknessChange = e => {
        this.setWallpaper({darkness: parseFloat(e.target.value)});
    };
    handleGridVisibleChange = e => {
        this.setWallpaper({gridVisible: e.target.checked});
    };
    handleThumbError = e => {
        e.target.style.display = 'none';
    };
    render () {
        const {theme} = this.props;
        const wallpaper = theme.wallpaper;

        return (
            <Box className={styles.body}>
                <PageHeader>
                    <FormattedMessage
                        defaultMessage="Wallpaper"
                        description="Label for wallpaper menu"
                        id="tw.menuBar.wallpaper"
                    />
                </PageHeader>
                <form
                    className={styles.setting}
                    onSubmit={this.handleAdd}
                >
                    <div className={styles.textSettingLabel}>
                        <FormattedMessage
                            defaultMessage="Image URL"
                            id="mw.settings.wallpaperUrl"
                        />
                    </div>
                    <div className={styles.wallpaperInputRow}>
                        <Input
                            type="url"
                            className={styles.textInput}
                            placeholder="Enter image URL..."
                            value={this.state.url}
                            onChange={this.handleUrlChange}
                        />
                        <button
                            type="submit"
                            className={styles.button}
                            disabled={!this.state.url.trim()}
                        >
                            <FormattedMessage
                                defaultMessage="Add"
                                description="Button to add wallpaper"
                                id="tw.wallpaper.add"
                            />
                        </button>
                    </div>
                </form>

                <div className={styles.setting}>
                    <label className={styles.sliderRow}>
                        <span className={styles.sliderLabel}>
                            <FormattedMessage
                                defaultMessage="Opacity:"
                                description="Label for wallpaper opacity slider"
                                id="tw.wallpaper.opacity"
                            />
                        </span>
                        <input
                            type="range"
                            className={styles.gcSlider}
                            min="0.1"
                            max="1"
                            step="0.1"
                            value={wallpaper.opacity}
                            onChange={this.handleOpacityChange}
                        />
                        <span className={styles.sliderValue}>{`${Math.round(wallpaper.opacity * 100)}%`}</span>
                    </label>
                    <label className={styles.sliderRow}>
                        <span className={styles.sliderLabel}>
                            <FormattedMessage
                                defaultMessage="Darkness:"
                                description="Label for wallpaper darkness slider"
                                id="tw.wallpaper.darkness"
                            />
                        </span>
                        <input
                            type="range"
                            className={styles.gcSlider}
                            min="0"
                            max="0.8"
                            step="0.1"
                            value={wallpaper.darkness || 0}
                            onChange={this.handleDarknessChange}
                        />
                        <span className={styles.sliderValue}>{`${Math.round((wallpaper.darkness || 0) * 100)}%`}</span>
                    </label>
                    <label className={styles.sliderRow}>
                        <span className={styles.sliderLabel}>
                            <FormattedMessage
                                defaultMessage="Show Grid:"
                                description="Label for wallpaper grid visibility toggle"
                                id="tw.wallpaper.showGrid"
                            />
                        </span>
                        <FancyCheckbox
                            className={styles.checkbox}
                            checked={wallpaper.gridVisible !== false}
                            onChange={this.handleGridVisibleChange}
                        />
                    </label>
                </div>

                <div className={styles.wallpaperList}>
                    <div
                        className={classNames(styles.wallpaperItem, {
                            [styles.wallpaperItemSelected]: !wallpaper.url
                        })}
                    >
                        <button
                            type="button"
                            className={styles.wallpaperChoice}
                            aria-pressed={!wallpaper.url}
                            value=""
                            onClick={this.handleSelectWallpaper}
                        >
                            <div className={styles.wallpaperThumb}>
                                <FormattedMessage
                                    defaultMessage="None"
                                    description="Label for no wallpaper option"
                                    id="tw.wallpaper.none"
                                />
                            </div>
                            <span className={styles.wallpaperItemUrl}>
                                <FormattedMessage
                                    defaultMessage="No wallpaper"
                                    description="Label for no wallpaper selected"
                                    id="tw.wallpaper.noWallpaper"
                                />
                            </span>
                        </button>
                    </div>
                    {(wallpaper.history || []).map(url => (
                        <div
                            key={url}
                            className={classNames(styles.wallpaperItem, {
                                [styles.wallpaperItemSelected]: wallpaper.url === url
                            })}
                        >
                            <button
                                type="button"
                                className={styles.wallpaperChoice}
                                aria-pressed={wallpaper.url === url}
                                value={url}
                                onClick={this.handleSelectWallpaper}
                            >
                                <div className={styles.wallpaperThumb}>
                                    <img
                                        src={url}
                                        alt=""
                                        onError={this.handleThumbError}
                                    />
                                </div>
                                <span
                                    className={styles.wallpaperItemUrl}
                                    title={url}
                                >
                                    {url}
                                </span>
                            </button>
                            <button
                                type="button"
                                className={styles.iconButton}
                                title="Remove wallpaper"
                                aria-label="Remove wallpaper"
                                value={url}
                                onClick={this.handleRemoveWallpaper}
                            >
                                <Trash size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            </Box>
        );
    }
}
UnconnectedWallpaperPage.propTypes = {
    theme: PropTypes.instanceOf(Theme),
    onChangeTheme: PropTypes.func
};
export const WallpaperPage = connect(themeStateToProps, themeDispatchToProps)(UnconnectedWallpaperPage);
