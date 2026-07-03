import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import {FormattedMessage, IntlProvider} from 'react-intl';
import {connect, Provider} from 'react-redux';

import {MenuItem, Submenu} from '../menu/menu.jsx';
import {Theme} from '../../lib/themes/index.js';
import {customThemeManager, CustomTheme, GradientUtils} from '../../lib/themes/custom-themes.js';
import {closeSettingsMenu, openCustomThemes, customThemesOpen} from '../../reducers/menus.js';
import {setTheme} from '../../reducers/theme.js';
import {applyTheme} from '../../lib/themes/themePersistance.js';

import ChevronDown from './ChevronDown.jsx';
import styles from './settings-menu.css';

import {Check, Palette, CirclePlus, Download, FolderInput, Edit, Trash} from 'lucide-react';
import WindowManager from '../../addons/window-system/window-manager';
import showAlert from '../../addons/window-system/alert';
import ReactDOM from 'react-dom';

const startDrag = (index, e, dragging, setGradientColors, previewRef) => {
    e.preventDefault();
    const rect = previewRef.current && previewRef.current.getBoundingClientRect();
    dragging.current = {index, rect};

    const move = ev => {
        const clientX = typeof ev.clientX === 'number' ?
            ev.clientX : (ev.touches && ev.touches[0] && ev.touches[0].clientX);
        if (!clientX || !dragging.current.rect) return;

        const val = ((clientX - dragging.current.rect.left) / dragging.current.rect.width);
        const pct = Math.max(0, Math.min(100, val * 100));
        setGradientColors(prev => {
            const next = prev.slice();
            next[dragging.current.index] = {...next[dragging.current.index], position: pct};
            return next;
        });
    };

    const up = () => {
        document.removeEventListener('mousemove', move);
        document.removeEventListener('mouseup', up);
        document.removeEventListener('touchmove', move);
        document.removeEventListener('touchend', up);
        setGradientColors(prev => prev.slice().sort((a, b) => a.position - b.position));
        dragging.current = {index: null, rect: null};
    };

    dragging.current.moveHandler = move;
    dragging.current.upHandler = up;

    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
    document.addEventListener('touchmove', move, {passive: false});
    document.addEventListener('touchend', up);
};

const GRADIENT_DIRECTIONS = [0, 45, 90, 135, 180, 225, 270, 315];
const DIRECTION_ARROWS = ['↑', '↗', '→', '↘', '↓', '↙', '←', '↖'];

const GradientBuilderApp = props => {
    const isEdit = props.mode === 'edit';
    const [name, setName] = React.useState(props.initialName || '');
    const [description, setDescription] = React.useState(props.initialDescription || '');
    const [gradientColors, setGradientColors] = React.useState(props.initialGradientColors || [
        {color: '#ff6b6b', position: 0},
        {color: '#4ecdc4', position: 100}
    ]);
    const [direction, setDirection] = React.useState(props.initialDirection || 90);
    const [primaryColor, setPrimaryColor] = React.useState(props.initialPrimaryColor || '#ff6b6b');
    const [selectedPreset, setSelectedPreset] = React.useState('');
    const [isDragging, setIsDragging] = React.useState(null);
    const [isPreviewActive, setIsPreviewActive] = React.useState(false);

    const previewRef = React.useRef(null);
    const dragging = React.useRef({index: null, rect: null});

    const handleSubmit = () => {
        if (props.onSubmit) props.onSubmit(name, description, gradientColors, primaryColor, direction);
    };

    const handlePreview = async () => {
        if (isPreviewActive) {
            setIsPreviewActive(false);
            if (props.onPreview) {
                props.onPreview('', [], '', 90);
            }
            return;
        }

        if (!name.trim()) {
            await showAlert('Please enter a theme name first');
            return;
        }

        if (props.onPreview) {
            props.onPreview(name, gradientColors, primaryColor, direction);
            setIsPreviewActive(true);
        }
    };

    const handleAddColorStop = () => {
        const next = [...gradientColors, {color: '#ffffff', position: 50}];
        next.sort((a, b) => a.position - b.position);
        setGradientColors(next);
    };

    const handleRemoveColorStop = index => {
        if (gradientColors.length <= 2) return;
        setGradientColors(gradientColors.filter((_, i) => i !== index));
    };

    const handleColorChange = (index, color) => {
        const next = gradientColors.slice();
        next[index] = {...next[index], color};
        setGradientColors(next);
        if (index === 0) setPrimaryColor(color);
    };

    const handlePresetSelect = presetName => {
        const preset = GradientUtils.getGradientPresets().find(pr => pr.name === presetName);
        if (preset) {
            const colorStops = preset.colors.map(
                (color, index) => ({color, position: (index / (preset.colors.length - 1)) * 100})
            );
            setGradientColors(colorStops);
            setDirection(preset.direction);
            setPrimaryColor(preset.colors[0]);
            setSelectedPreset(presetName);
        }
    };

    const handleKeyDown = e => {
        if (e.key === 'Escape' && props.onCancel) props.onCancel();
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit();
    };

    React.useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [name, description, gradientColors, primaryColor, direction]);

    React.useEffect(() => () => {
        if (dragging.current.moveHandler && dragging.current.upHandler) {
            document.removeEventListener('mousemove', dragging.current.moveHandler);
            document.removeEventListener('mouseup', dragging.current.upHandler);
        }
    }, []);

    return (
        <div className={styles.gcRoot}>
            <div className={styles.gcBody}>
                <div
                    ref={previewRef}
                    className={styles.gcPreview}
                >
                    <div
                        className={styles.gcPreviewFill}
                        style={{background: GradientUtils.createLinearGradient(gradientColors, direction)}}
                    />
                    {gradientColors.map((stop, index) => (
                        <button
                            key={index}
                            type="button"
                            className={classNames(
                                styles.gcStopHandle,
                                isDragging === index && styles.gcStopHandleActive
                            )}
                            style={{left: `${stop.position}%`, background: stop.color}}
                            title={`${stop.color} · ${Math.round(stop.position)}%`}
                            onMouseDown={e => {
                                setIsDragging(index);
                                startDrag(index, e, dragging, setGradientColors, previewRef);
                            }}
                            onTouchStart={e => {
                                setIsDragging(index);
                                startDrag(index, e, dragging, setGradientColors, previewRef);
                            }}
                            onMouseUp={() => setIsDragging(null)}
                            onTouchEnd={() => setIsDragging(null)}
                        />
                    ))}
                </div>

                <div className={styles.gcStops}>
                    {gradientColors.map((stop, index) => (
                        <div
                            key={index}
                            className={styles.gcStopChip}
                        >
                            <input
                                type="color"
                                value={stop.color}
                                onChange={e => handleColorChange(index, e.target.value)}
                                className={styles.gcStopColor}
                                title={stop.color}
                            />
                            <span className={styles.gcStopPos}>{`${Math.round(stop.position)}%`}</span>
                            {gradientColors.length > 2 && (
                                <button
                                    type="button"
                                    onClick={() => handleRemoveColorStop(index)}
                                    className={styles.gcStopRemove}
                                    title="Remove color"
                                >
                                    {'×'}
                                </button>
                            )}
                        </div>
                    ))}
                    {gradientColors.length < 8 && (
                        <button
                            type="button"
                            onClick={handleAddColorStop}
                            className={styles.gcAddStop}
                        >
                            <FormattedMessage
                                defaultMessage="+ Add"
                                id="tw.customThemes.gradientCreator.addColor"
                            />
                        </button>
                    )}
                </div>

                <div className={styles.gcField}>
                    <label className={styles.gcLabel}>
                        <FormattedMessage
                            defaultMessage="Direction"
                            id="tw.customThemes.gradientCreator.direction"
                        />
                    </label>
                    <div className={styles.gcDirectionRow}>
                        <input
                            type="range"
                            min="0"
                            max="360"
                            value={direction}
                            onChange={e => setDirection(parseInt(e.target.value, 10))}
                            className={styles.gcSlider}
                        />
                        <span className={styles.gcDegrees}>{`${direction}°`}</span>
                        <div className={styles.gcDirectionPresets}>
                            {GRADIENT_DIRECTIONS.map((dir, i) => (
                                <button
                                    key={dir}
                                    type="button"
                                    onClick={() => setDirection(dir)}
                                    className={classNames(
                                        styles.gcDirBtn,
                                        direction === dir && styles.gcDirBtnActive
                                    )}
                                    title={`${dir}°`}
                                >
                                    {DIRECTION_ARROWS[i]}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className={styles.gcField}>
                    <label className={styles.gcLabel}>
                        <FormattedMessage
                            defaultMessage="Quick Presets"
                            id="tw.customThemes.gradientCreator.quickPresets"
                        />
                    </label>
                    <div className={styles.gcPresets}>
                        {GradientUtils.getGradientPresets().map(preset => (
                            <button
                                key={preset.name}
                                type="button"
                                onClick={() => handlePresetSelect(preset.name)}
                                className={classNames(
                                    styles.gcPresetSwatch,
                                    selectedPreset === preset.name && styles.gcPresetSwatchActive
                                )}
                                style={{background: GradientUtils.createLinearGradient(preset.colors.map((c, i) => ({
                                    color: c,
                                    position: (i / (preset.colors.length - 1)) * 100
                                })), preset.direction)}}
                                title={preset.name}
                            />
                        ))}
                    </div>
                </div>

                <div className={styles.gcField}>
                    <label className={styles.gcLabel}>
                        <FormattedMessage
                            defaultMessage="Primary Color (for UI accents)"
                            id="tw.customThemes.gradientCreator.primaryColor"
                        />
                    </label>
                    <div className={styles.gcAccentRow}>
                        <input
                            type="color"
                            value={primaryColor}
                            onChange={e => setPrimaryColor(e.target.value)}
                            className={styles.gcStopColor}
                        />
                        <span className={styles.gcHex}>{primaryColor}</span>
                    </div>
                </div>

                <div className={styles.gcField}>
                    <label className={styles.gcLabel}>
                        <FormattedMessage
                            defaultMessage="Name"
                            id="tw.customThemes.gradientDialog.name"
                        />
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="My Gradient Theme"
                        className={styles.gcInput}
                        maxLength={50}
                    />
                </div>
                <div className={styles.gcField}>
                    <label className={styles.gcLabel}>
                        <FormattedMessage
                            defaultMessage="Description (optional)"
                            id="tw.customThemes.createDialog.description"
                        />
                    </label>
                    <textarea
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="Describe your gradient theme..."
                        className={styles.gcTextarea}
                        maxLength={200}
                        rows={2}
                    />
                </div>
            </div>

            <div className={styles.gcFooter}>
                {props.onPreview && (
                    <button
                        className={classNames(styles.gcBtn, isPreviewActive && styles.gcBtnActive)}
                        onClick={handlePreview}
                        disabled={!name.trim()}
                        title="Apply this theme to see how it looks"
                    >
                        {isPreviewActive ? (
                            <FormattedMessage
                                defaultMessage="Stop Preview"
                                id="tw.customThemes.gradientCreator.stopPreview"
                            />
                        ) : (
                            <FormattedMessage
                                defaultMessage="Preview"
                                id="tw.customThemes.gradientCreator.previewTheme"
                            />
                        )}
                    </button>
                )}
                <div className={styles.gcFooterSpacer} />
                <button
                    className={styles.gcBtn}
                    onClick={() => {
                        if (props.onCancel) props.onCancel();
                    }}
                >
                    <FormattedMessage
                        defaultMessage="Cancel"
                        id="tw.customThemes.createDialog.cancel"
                    />
                </button>
                <button
                    className={classNames(styles.gcBtn, styles.gcBtnPrimary)}
                    onClick={handleSubmit}
                    disabled={!name.trim()}
                >
                    {isEdit ? (
                        <FormattedMessage
                            defaultMessage="Save Changes"
                            id="tw.customThemes.gradientEditor.update"
                        />
                    ) : (
                        <FormattedMessage
                            defaultMessage="Create Theme"
                            id="tw.customThemes.createDialog.create"
                        />
                    )}
                </button>
            </div>
        </div>
    );
};

GradientBuilderApp.propTypes = {
    mode: PropTypes.oneOf(['create', 'edit']),
    initialName: PropTypes.string,
    initialDescription: PropTypes.string,
    initialGradientColors: PropTypes.arrayOf(PropTypes.shape({
        color: PropTypes.string,
        position: PropTypes.number
    })),
    initialDirection: PropTypes.number,
    initialPrimaryColor: PropTypes.string,
    onCancel: PropTypes.func,
    onSubmit: PropTypes.func,
    onPreview: PropTypes.func
};

const GradientCreatorApp = props => (
    <GradientBuilderApp
        {...props}
        mode="create"
        onSubmit={props.onCreate}
    />
);

GradientCreatorApp.propTypes = {
    onCreate: PropTypes.func
};

const GradientEditorApp = props => (
    <GradientBuilderApp
        {...props}
        mode="edit"
        onSubmit={props.onUpdate}
    />
);

GradientEditorApp.propTypes = {
    onUpdate: PropTypes.func
};

class CustomThemeMenu extends React.Component {
    static contextTypes = {
        store: PropTypes.object
    };

    constructor (props) {
        super(props);
        this._unsubscribeCustomThemes = null;

        this.state = {
            customThemes: customThemeManager.getAllThemes(),
            showCreateDialog: false,
            createName: '',
            createDescription: '',
            gradientColors: [
                {color: '#ff6b6b', position: 0},
                {color: '#4ecdc4', position: 100}
            ],
            primaryColor: '#ff6b6b',
            gradientDirection: 90,
            selectedPreset: '',
            showGradientCreator: false,
            showGradientEditor: false,
            editingThemeUuid: null,
            originalThemeBeforePreview: null
        };

        this.fileInputRef = React.createRef();
        this.createThemeWindow = null;
        this.gradientCreatorWindow = null;
        this.gradientEditorWindow = null;
        this.createThemeContainer = null;
        this.gradientCreatorContainer = null;
        this.gradientEditorContainer = null;

        this._isMounted = false;
        this._activeFileReader = null;
    }

    componentDidMount () {
        this._isMounted = true;
        // Listen for custom theme changes
        this._unsubscribeCustomThemes = customThemeManager.subscribe(() => {
            this.safeSetState({customThemes: customThemeManager.getAllThemes()});
        });
    }

    componentDidUpdate () {
        // Keep dialog contents in their windows in sync while this component
        // is mounted by re-rendering the independent React trees into their
        // containers whenever state/props change.
        try {
            if (this.createThemeContainer) {
                ReactDOM.render(
                    React.createElement(Provider, {store: this.context.store},
                        React.createElement(IntlProvider, {locale: this.props.locale || 'en', messages: this.props.messages || {}},
                            this.renderCreateContent()
                        )
                    ),
                    this.createThemeContainer
                );
            }
        } catch (e) {
            // Ignore render errors
        }
        try {
            if (this.gradientCreatorContainer) {
                ReactDOM.render(
                    React.createElement(Provider, {store: this.context.store},
                        React.createElement(IntlProvider, {locale: this.props.locale || 'en', messages: this.props.messages || {}},
                            React.createElement(GradientCreatorApp, {
                                initialName: this.state.createName,
                                initialDescription: this.state.createDescription,
                                initialGradientColors: this.state.gradientColors,
                                initialPrimaryColor: this.state.primaryColor,
                                initialDirection: this.state.gradientDirection,
                                onCreate: (name, description, colorStops, primary, dir) => {
                                    this.handleCreateGradientTheme(name, description, colorStops, primary, dir)
                                        .then(success => {
                                            if (this.gradientCreatorWindow && success) {
                                                this.gradientCreatorWindow.close();
                                            }
                                        });
                                },
                                onPreview: (name, gradientColors, primaryColor, direction) => {
                                    return this.handlePreviewTheme(
                                        name,
                                        this.state.createDescription,
                                        gradientColors,
                                        primaryColor,
                                        direction
                                    );
                                },
                                onCancel: () => {
                                    if (this.gradientCreatorWindow) this.gradientCreatorWindow.close();
                                }
                            })
                        )
                    ),
                    this.gradientCreatorContainer
                );
            }
        } catch (e) {
            // Ignore render errors
        }
        try {
            if (this.gradientEditorContainer) {
                ReactDOM.render(
                    React.createElement(Provider, {store: this.context.store},
                        React.createElement(IntlProvider, {locale: this.props.locale || 'en', messages: this.props.messages || {}},
                            React.createElement(GradientEditorApp, {
                                initialName: this.state.createName,
                                initialDescription: this.state.createDescription,
                                initialGradientColors: this.state.gradientColors,
                                initialPrimaryColor: this.state.primaryColor,
                                initialDirection: this.state.gradientDirection,
                                onUpdate: (name, description, colorStops, primary, dir) => {
                                    this.handleUpdateGradientTheme(name, description, colorStops, primary, dir)
                                        .then(success => {
                                            if (this.gradientEditorWindow && success) {
                                                this.gradientEditorWindow.close();
                                            }
                                        });
                                },
                                onCancel: () => {
                                    if (this.gradientEditorWindow) this.gradientEditorWindow.close();
                                }
                            })
                        )
                    ),
                    this.gradientEditorContainer
                );
            }
        } catch (e) {
            // Ignore render errors
        }
    }

    // TODO: Migrate to functional component with useEffect cleanup
    // componentWillUnmount is deprecated in React 16.3+
    componentWillUnmount () {
        this._isMounted = false;

        if (this._unsubscribeCustomThemes) {
            try {
                this._unsubscribeCustomThemes();
            } catch (e) {
                // Ignore unsubscribe errors
            }
            this._unsubscribeCustomThemes = null;
        }

        if (this._activeFileReader) {
            try {
                this._activeFileReader.abort();
            } catch (e) {
                // Ignore abort errors
            }
            this._activeFileReader = null;
        }

        // Restore preview if still active
        const {originalThemeBeforePreview} = this.state;
        if (originalThemeBeforePreview) {
            this.props.onChangeTheme(originalThemeBeforePreview);
        }
    }

    safeForceUpdate = () => {
        if (!this._isMounted) return;
        this.forceUpdate();
    };

    safeSetState = (state, callback) => {
        if (!this._isMounted) return;
        this.setState(state, callback);
    };

    openCreateThemeWindow = () => {
        if (this.createThemeWindow) {
            this.createThemeWindow.show().bringToFront();
            return;
        }

        this.createThemeContainer = document.createElement('div');

        this.createThemeWindow = WindowManager.createWindow({
            id: 'tw-create-theme-window',
            title: 'Create Custom Theme',
            width: 520,
            height: 360,
            minWidth: 420,
            minHeight: 240,
            className: 'tw-create-theme-window',
            onClose: () => {
                try {
                    if (this.createThemeContainer) {
                        try {
                            ReactDOM.unmountComponentAtNode(this.createThemeContainer);
                        } catch (e) {}
                        this.createThemeContainer = null;
                        this.safeForceUpdate();
                    }
                } catch (e) {}
                this.createThemeWindow = null;
                this.createThemeContainer = null;
            }
        });

        this.createThemeWindow.setContent(this.createThemeContainer);

        // Ensure the window content accepts pointer events (some global layers
        // may otherwise interfere). This makes inputs/buttons interactive.
        try {
            const contentEl = this.createThemeWindow.getContentElement();
            if (contentEl) contentEl.style.pointerEvents = 'auto';
        } catch (e) {
            // Ignore if unavailable
        }

        try {
            ReactDOM.render(
                React.createElement(Provider, {store: this.context.store},
                    React.createElement(IntlProvider, {locale: this.props.locale || 'en', messages: this.props.messages || {}},
                        this.renderCreateContent()
                    )
                ),
                this.createThemeContainer
            );
        } catch (e) {
            console.warn('Failed to render create theme content into container', e);
        }

        this.createThemeWindow.setContent(this.createThemeContainer);
        this.safeForceUpdate();
        this.createThemeWindow.show();
    };

    openGradientCreatorWindow = () => {
        if (this.gradientCreatorWindow) {
            this.gradientCreatorWindow.show().bringToFront();
            return;
        }

        this.gradientCreatorContainer = document.createElement('div');
        this.gradientCreatorContainer.style.cssText = 'display: flex; flex-direction: column; flex: 1 1 auto; min-height: 0;';

        this.gradientCreatorWindow = WindowManager.createWindow({
            id: 'tw-gradient-creator-window',
            title: 'Create Gradient Theme',
            width: 560,
            height: 720,
            minWidth: 480,
            minHeight: 560,
            className: 'tw-gradient-creator-window',
            onClose: () => {
                try {
                    const {originalThemeBeforePreview} = this.state;
                    if (originalThemeBeforePreview && this._isMounted) {
                        this.props.onChangeTheme(originalThemeBeforePreview);
                        this.safeSetState({originalThemeBeforePreview: null});
                    }

                    if (this.gradientCreatorContainer) {
                        try {
                            ReactDOM.unmountComponentAtNode(this.gradientCreatorContainer);
                        } catch (e) {}
                        this.gradientCreatorContainer = null;
                        this.safeForceUpdate();
                    }
                } catch (e) {}
                this.gradientCreatorWindow = null;
                this.gradientCreatorContainer = null;
            }
        });

        this.gradientCreatorWindow.setContent(this.gradientCreatorContainer);

        try {
            const contentEl = this.gradientCreatorWindow.getContentElement();
            if (contentEl) contentEl.style.pointerEvents = 'auto';
        } catch (e) {
            // Ignore if unavailable
        }

        try {
            ReactDOM.render(
                React.createElement(Provider, {store: this.context.store},
                    React.createElement(IntlProvider, {locale: this.props.locale || 'en', messages: this.props.messages || {}},
                        React.createElement(GradientCreatorApp, {
                            initialName: this.state.createName,
                            initialDescription: this.state.createDescription,
                            initialGradientColors: this.state.gradientColors,
                            initialPrimaryColor: this.state.primaryColor,
                            initialDirection: this.state.gradientDirection,
                            onCreate: (name, description, colorStops, primary, dir) => {
                                this.handleCreateGradientTheme(name, description, colorStops, primary, dir)
                                    .then(success => {
                                        if (this.gradientCreatorWindow && success) {
                                            this.gradientCreatorWindow.close();
                                        }
                                    });
                            },
                            onPreview: (name, gradientColors, primaryColor, direction) => {
                                return this.handlePreviewTheme(
                                    name,
                                    this.state.createDescription,
                                    gradientColors,
                                    primaryColor,
                                    direction
                                );
                            },
                            onCancel: () => {
                                const {originalThemeBeforePreview} = this.state;
                                if (originalThemeBeforePreview && this._isMounted) {
                                    this.props.onChangeTheme(originalThemeBeforePreview);
                                    this.safeSetState({originalThemeBeforePreview: null});
                                }
                                if (this.gradientCreatorWindow) this.gradientCreatorWindow.close();
                            }
                        })
                    )
                ),
                this.gradientCreatorContainer
            );
        } catch (e) {
            console.warn('Failed to render gradient creator content into container', e);
        }

        this.safeForceUpdate();
        this.gradientCreatorWindow.show();
    };

    openGradientEditorWindow = themeUuid => {
        if (this.gradientEditorWindow) {
            this.gradientEditorWindow.show().bringToFront();
            return;
        }

        this.gradientEditorContainer = document.createElement('div');
        this.gradientEditorContainer.style.cssText = 'display: flex; flex-direction: column; flex: 1 1 auto; min-height: 0;';

        this.gradientEditorWindow = WindowManager.createWindow({
            id: `tw-gradient-editor-${themeUuid}`,
            title: 'Edit Gradient Theme',
            width: 560,
            height: 720,
            minWidth: 480,
            minHeight: 560,
            className: 'tw-gradient-editor-window',
            onClose: () => {
                try {
                    const {originalThemeBeforePreview} = this.state;
                    if (originalThemeBeforePreview && this._isMounted) {
                        this.props.onChangeTheme(originalThemeBeforePreview);
                        this.safeSetState({originalThemeBeforePreview: null});
                    }

                    if (this.gradientEditorContainer) {
                        try {
                            ReactDOM.unmountComponentAtNode(this.gradientEditorContainer);
                        } catch (e) {}
                        this.gradientEditorContainer = null;
                        this.safeForceUpdate();
                    }
                } catch (e) {}
                this.gradientEditorWindow = null;
                this.gradientEditorContainer = null;
            }
        });

        this.gradientEditorWindow.setContent(this.gradientEditorContainer);

        try {
            const contentEl = this.gradientEditorWindow.getContentElement();
            if (contentEl) contentEl.style.pointerEvents = 'auto';
        } catch (e) {
            // Ignore if unavailable
        }

        try {
            ReactDOM.render(
                React.createElement(Provider, {store: this.context.store},
                    React.createElement(IntlProvider, {locale: this.props.locale || 'en', messages: this.props.messages || {}},
                        React.createElement(GradientEditorApp, {
                            initialName: this.state.createName,
                            initialDescription: this.state.createDescription,
                            initialGradientColors: this.state.gradientColors,
                            initialPrimaryColor: this.state.primaryColor,
                            initialDirection: this.state.gradientDirection,
                            onUpdate: (name, description, colorStops, primary, dir) => {
                                this.handleUpdateGradientTheme(name, description, colorStops, primary, dir)
                                    .then(success => {
                                        if (this.gradientEditorWindow && success) {
                                            this.gradientEditorWindow.close();
                                        }
                                    });
                            },
                            onPreview: (name, gradientColors, primaryColor, direction) => {
                                return this.handlePreviewTheme(
                                    name,
                                    this.state.createDescription,
                                    gradientColors,
                                    primaryColor,
                                    direction
                                );
                            },
                            onCancel: () => {
                                const {originalThemeBeforePreview} = this.state;
                                if (originalThemeBeforePreview && this._isMounted) {
                                    this.props.onChangeTheme(originalThemeBeforePreview);
                                    this.safeSetState({originalThemeBeforePreview: null});
                                }
                                if (this.gradientEditorWindow) this.gradientEditorWindow.close();
                            }
                        })
                    )
                ),
                this.gradientEditorContainer
            );
        } catch (e) {
            console.warn('Failed to render gradient editor content into container', e);
        }

        this.safeForceUpdate();
        this.gradientEditorWindow.show();
    };

    handleCreateTheme = async (passedName, passedDescription) => {
        const createName = typeof passedName === 'string' ? passedName : this.state.createName;
        
        const createDescription = typeof passedDescription === 'string' ?
            passedDescription : this.state.createDescription;

        const {theme} = this.props;
        
        if (!createName.trim()) {
            await showAlert('Theme name is required');
            return;
        }

        try {
            const customTheme = customThemeManager.createFromCurrentTheme(
                theme,
                createName.trim(),
                createDescription.trim()
            );
            
            this.safeSetState({
                customThemes: customThemeManager.getAllThemes(),
                showCreateDialog: false,
                createName: '',
                createDescription: ''
            });
            
            // Switch to the new theme
            this.props.onChangeTheme(customTheme);
            return true;
        } catch (error) {
            await showAlert(`Failed to create theme: ${error.message}`);
        }
    };

    handleCreateGradientTheme = async (name, description, colorStopsArg, primaryArg, dirArg) => {
        const createName = typeof name === 'string' ? name : (this.state.createName || '');
        const createDescription = typeof description === 'string' ? description : (this.state.createDescription || '');
        const theme = this.props.theme;

        if (!createName.trim()) {
            await showAlert('Theme name is required');
            return;
        }

        try {
            const stops = Array.isArray(colorStopsArg) ?
                colorStopsArg.map(stop => ({color: stop.color, position: stop.position})) :
                (this.state.gradientColors || []).map(stop => ({color: stop.color, position: stop.position}));

            const primary = typeof primaryArg === 'string' ? primaryArg : this.state.primaryColor;
            const direction = typeof dirArg === 'number' ? dirArg : this.state.gradientDirection;

            const customTheme = customThemeManager.createGradientTheme(
                createName.trim(),
                createDescription.trim(),
                stops,
                primary,
                {direction},
                theme
            );

            this.safeSetState({
                customThemes: customThemeManager.getAllThemes(),
                showGradientCreator: false,
                createName: '',
                createDescription: '',
                gradientColors: [
                    {color: '#ff6b6b', position: 0},
                    {color: '#4ecdc4', position: 100}
                ],
                primaryColor: '#ff6b6b',
                gradientDirection: 90
            });

            this.props.onChangeTheme(customTheme);
            return true;
        } catch (error) {
            await showAlert(`Failed to create gradient theme: ${error.message}`);
        }
    };

    handleAddColorStop = () => {
        const {gradientColors} = this.state;
        const newPosition = Math.round(
            gradientColors.reduce((sum, stop) => sum + stop.position, 0) / gradientColors.length
        );
        
        this.safeSetState({
            gradientColors: [...gradientColors, {
                color: '#ffffff',
                position: Math.max(0, Math.min(100, newPosition))
            }].sort((a, b) => a.position - b.position)
        });
    };

    handleRemoveColorStop = index => {
        const {gradientColors} = this.state;
        if (gradientColors.length <= 2) return; // Keep minimum 2 colors
        
        this.safeSetState({
            gradientColors: gradientColors.filter((_, i) => i !== index)
        });
    };

    handleColorChange = (index, color) => {
        const {gradientColors} = this.state;
        const newColors = [...gradientColors];
        newColors[index].color = color;
        
        this.safeSetState({
            gradientColors: newColors,
            primaryColor: index === 0 ? color : this.state.primaryColor
        });
    };

    handlePositionChange = (index, position) => {
        const {gradientColors} = this.state;
        const newColors = [...gradientColors];
        newColors[index].position = Math.max(0, Math.min(100, parseInt(position, 10) || 0));
        newColors.sort((a, b) => a.position - b.position);
        
        this.safeSetState({
            gradientColors: newColors
        });
    };

    handlePresetSelect = async presetName => {
        try {
            const preset = GradientUtils.getGradientPresets().find(p => p.name === presetName);
            if (preset) {
                const colorStops = preset.colors.map((color, index) => ({
                    color: color,
                    position: (index / (preset.colors.length - 1)) * 100
                }));
                
                this.safeSetState({
                    gradientColors: colorStops,
                    gradientDirection: preset.direction,
                    primaryColor: preset.colors[0],
                    selectedPreset: presetName
                });
            } else {
                await showAlert('Gradient preset not found');
            }
        } catch (error) {
            console.warn('Failed to load preset:', error);
        }
    };

    handleEditGradientTheme = async themeUuid => {
        try {
            const gradientInfo = customThemeManager.getThemeGradientInfo(themeUuid);
            const theme = customThemeManager.getTheme(themeUuid);
            
            if (!gradientInfo || !theme) {
                await showAlert('Could not load gradient information for this theme');
                return;
            }

            this.safeSetState({
                editingThemeUuid: themeUuid,
                createName: theme.name,
                createDescription: theme.description,
                gradientColors: gradientInfo.colorStops,
                gradientDirection: gradientInfo.direction,
                primaryColor: gradientInfo.primaryColor,
                selectedPreset: ''
            }, () => {
                if (this._isMounted) this.openGradientEditorWindow(themeUuid);
            });
        } catch (error) {
            await showAlert(`Failed to load gradient theme: ${error.message}`);
        }
    };

    handleUpdateGradientTheme = async (name, description, colorStops, primary, dir) => {
        const {editingThemeUuid} = this.state;
        const createName = typeof name === 'string' ? name : (this.state.createName || '');
        const createDescription = typeof description === 'string' ? description : (this.state.createDescription || '');

        if (!editingThemeUuid) {
            await showAlert('No theme selected for editing');
            return;
        }

        if (!createName.trim()) {
            await showAlert('Theme name is required');
            return;
        }

        try {
            const stops = (Array.isArray(colorStops) ? colorStops : (this.state.gradientColors || []))
                .map(stop => ({color: stop.color, position: stop.position}));

            const updatedTheme = customThemeManager.updateThemeGradient(
                editingThemeUuid, stops, primary || this.state.primaryColor,
                {direction: typeof dir === 'number' ? dir : this.state.gradientDirection}
            );

            // Update name and description if changed
            if (updatedTheme.name !== createName.trim() || updatedTheme.description !== createDescription.trim()) {
                // We need to create a new theme with updated metadata since
                // name/description aren't part of gradient update
                const newTheme = new CustomTheme(
                    createName.trim(),
                    createDescription.trim(),
                    updatedTheme.customAccent,
                    updatedTheme.gui,
                    updatedTheme.blocks,
                    updatedTheme.menuBarAlign,
                    updatedTheme.wallpaper,
                    updatedTheme.fonts,
                    updatedTheme.author
                );
                
                // Preserve UUID and creation date
                Object.defineProperty(newTheme, 'uuid', {value: editingThemeUuid, writable: false});
                Object.defineProperty(newTheme, 'createdAt', {value: updatedTheme.createdAt, writable: false});
                
                customThemeManager.themes.set(editingThemeUuid, newTheme);
                customThemeManager.saveCustomThemes();
            }
            
            this.safeSetState({
                customThemes: customThemeManager.getAllThemes(),
                showGradientEditor: false,
                editingThemeUuid: null,
                createName: '',
                createDescription: '',
                gradientColors: [
                    {color: '#ff6b6b', position: 0},
                    {color: '#4ecdc4', position: 100}
                ],
                primaryColor: '#ff6b6b',
                gradientDirection: 90
            });
            
            // Switch to the updated theme if it's currently active
            const {theme} = this.props;
            if (theme instanceof CustomTheme && theme.uuid === editingThemeUuid) {
                this.props.onChangeTheme(customThemeManager.getTheme(editingThemeUuid));
            }
        } catch (error) {
            await showAlert(`Failed to update gradient theme: ${error.message}`);
        }
    };

    handleDeleteTheme = async (themeUuid, themeName) => {
        if (confirm(`Are you sure you want to delete the theme "${themeName}"?`)) {
            try {
                customThemeManager.removeTheme(themeUuid);
                this.safeSetState({
                    customThemes: customThemeManager.getAllThemes()
                });
            } catch (error) {
                await showAlert(`Failed to delete theme: ${error.message}`);
            }
        }
    };

    handlePreviewTheme = (name, description, gradientColors, primaryColor, direction) => {
        const {originalThemeBeforePreview} = this.state;

        // Treat empty name as signal to stop preview (restore original theme)
        if (!name || originalThemeBeforePreview) {
            if (originalThemeBeforePreview) {
                this.props.onChangeTheme(originalThemeBeforePreview);
                this.safeSetState({originalThemeBeforePreview: null});
                return true;
            }
            return false;
        }

        const {theme: currentTheme} = this.props;

        const gradientAccent = GradientUtils.createGradientAccent(gradientColors, primaryColor, {direction});

        const previewTheme = new CustomTheme(
            name,
            description,
            gradientAccent,
            currentTheme.gui || 'light',
            currentTheme.blocks || 'three',
            currentTheme.menuBarAlign || 'left',
            currentTheme.wallpaper,
            currentTheme.fonts
        );

        this.safeSetState({originalThemeBeforePreview: currentTheme});

        this.props.onChangeTheme(previewTheme);
        return true;
    };

    handleExportThemes = async () => {
        try {
            const exportData = customThemeManager.exportAllThemes();
            const blob = new Blob([JSON.stringify(exportData, null, 2)], {
                type: 'application/json'
            });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `mistwarp-themes-${new Date().toISOString()
                .split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            await showAlert(`Failed to export themes: ${error.message}`);
        }
    };

    handleExportSingleTheme = async theme => {
        try {
            const exportData = {
                version: '2.0',
                timestamp: Date.now(),
                themes: [theme.export()],
                platform: 'MistWarp'
            };
            const blob = new Blob([JSON.stringify(exportData, null, 2)], {
                type: 'application/json'
            });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${theme.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-theme.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            await showAlert(`Failed to export theme: ${error.message}`);
        }
    };

    handleImportFile = event => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        this._activeFileReader = reader;
        reader.onload = async e => {
            try {
                const data = JSON.parse(e.target.result);
                const results = customThemeManager.importThemes(data, false);
                
                let message = `Import complete!\n`;
                message += `Imported: ${results.imported} themes\n`;
                if (results.skipped > 0) {
                    message += `Skipped: ${results.skipped} themes (already exist)\n`;
                }
                if (results.errors.length > 0) {
                    message += `Errors: ${results.errors.length}\n${results.errors.join('\n')}`;
                }
                
                await showAlert(message);
                this.safeSetState({
                    customThemes: customThemeManager.getAllThemes()
                });
            } catch (error) {
                await showAlert(`Failed to import themes: ${error.message}`);
            } finally {
                if (this._activeFileReader === reader) {
                    this._activeFileReader = null;
                }
            }
        };
        reader.onerror = () => {
            if (this._activeFileReader === reader) {
                this._activeFileReader = null;
            }
        };
        reader.readAsText(file);
        
        // Reset file input
        event.target.value = '';
    };

    renderCreateContent () {
        return (
            <div
                className={styles.customThemeDialogContent}
                style={{width: '100%', height: '100%', boxSizing: 'border-box', overflow: 'auto'}}
            >
                <div className={styles.customThemeDialogField}>
                    <label>
                        <FormattedMessage
                            defaultMessage="Name"
                            id="tw.customThemes.createDialog.name"
                        />
                    </label>
                    <input
                        name="createName"
                        type="text"
                        defaultValue={this.state.createName}
                        placeholder="My Custom Theme"
                        maxLength={50}
                    />
                </div>
                <div className={styles.customThemeDialogField}>
                    <label>
                        <FormattedMessage
                            defaultMessage="Description (optional)"
                            id="tw.customThemes.createDialog.description"
                        />
                    </label>
                    <textarea
                        name="createDescription"
                        defaultValue={this.state.createDescription}
                        placeholder="A custom theme based on current settings"
                        maxLength={200}
                        rows={3}
                    />
                </div>
                <div className={styles.customThemeDialogButtons}>
                    <button
                        className={styles.customThemeDialogButton}
                        onClick={() => {
                            if (this.createThemeWindow) this.createThemeWindow.close();
                        }}
                    >
                        <FormattedMessage
                            defaultMessage="Cancel"
                            id="tw.customThemes.createDialog.cancel"
                        />
                    </button>
                    <button
                        className={classNames(styles.customThemeDialogButton, styles.primary)}
                        onClick={() => {
                            const name = this.createThemeContainer?.querySelector('input[name="createName"]')?.value || '';
                            const desc = this.createThemeContainer?.querySelector('textarea[name="createDescription"]')?.value || '';
                            this.handleCreateTheme(name, desc);
                            if (this.createThemeWindow) this.createThemeWindow.close();
                        }}
                    >
                        <FormattedMessage
                            defaultMessage="Create"
                            id="tw.customThemes.createDialog.createButton"
                        />
                    </button>
                </div>
            </div>
        );
    }

    render () {
        const {isOpen, isRtl, theme, onOpen} = this.props;
        const {customThemes} = this.state;
        // Dialogs are rendered directly into their window containers with
        // `ReactDOM.render` so they stay open when this menu unmounts.

        return (
            <MenuItem expanded={isOpen}>
                <div
                    className={styles.option}
                    onClick={onOpen}
                >
                    <Palette className={styles.icon} />
                    <span className={styles.submenuLabel}>
                        <FormattedMessage
                            defaultMessage="Custom Themes"
                            description="Menu item for custom themes"
                            id="tw.menuBar.customThemes"
                        />
                    </span>
                    <ChevronDown className={styles.expandCaret} />
                </div>
                <Submenu
                    place={isRtl ? 'left' : 'right'}
                    className={styles.customThemeSubmenu}
                >
                    {/* Create new theme */}
                    <MenuItem
                        className={styles.customThemeAction}
                        onClick={this.openCreateThemeWindow}
                    >
                        <div className={styles.option}>
                            <CirclePlus className={styles.customThemeActionIcon} />
                            <FormattedMessage
                                defaultMessage="Create from Current"
                                description="Create new custom theme from current theme"
                                id="tw.customThemes.create"
                            />
                        </div>
                    </MenuItem>

                    {/* Create gradient theme */}
                    <MenuItem
                        className={styles.customThemeAction}
                        onClick={this.openGradientCreatorWindow}
                    >
                        <div className={styles.option}>
                            <CirclePlus className={styles.customThemeActionIcon} />
                            <FormattedMessage
                                defaultMessage="Create Gradient Theme"
                                description="Create gradient theme menu item"
                                id="tw.customThemes.createGradient"
                            />
                        </div>
                    </MenuItem>

                    {/* Export themes */}
                    <MenuItem
                        className={styles.customThemeAction}
                        onClick={this.handleExportThemes}
                    >
                        <div className={classNames(styles.option, {[styles.disabled]: customThemes.length === 0})}>
                            <Download className={styles.customThemeActionIcon} />
                            <FormattedMessage
                                defaultMessage="Export All"
                                description="Export all custom themes"
                                id="tw.customThemes.export"
                            />
                        </div>
                    </MenuItem>

                    {/* Import themes */}
                    <MenuItem
                        className={styles.customThemeAction}
                        onClick={() => this.fileInputRef.current?.click()}
                    >
                        <div className={styles.option}>
                            <FolderInput className={styles.customThemeActionIcon} />
                            <FormattedMessage
                                defaultMessage="Import"
                                description="Import custom themes"
                                id="tw.customThemes.import"
                            />
                        </div>
                    </MenuItem>

                    {customThemes.length > 0 && <div className={styles.menuSeparator} />}

                    {/* List custom themes */}
                    {customThemes.map(customTheme => (
                        <MenuItem
                            key={customTheme.uuid}
                            className={classNames(styles.customThemeItem, {
                                [styles.selected]: theme instanceof CustomTheme && theme.uuid === customTheme.uuid
                            })}
                            onClick={() => this.props.onChangeTheme(customTheme)}
                        >
                            <div className={styles.option}>
                                <Check
                                    className={
                                        classNames(styles.check, {
                                            [styles.selected]: theme instanceof CustomTheme &&
                                                               theme.uuid === customTheme.uuid
                                        })}
                                    size={15}
                                />
                                <div className={styles.customThemeItemInfo}>
                                    <div className={styles.customThemeItemName}>
                                        {customTheme.name}
                                    </div>
                                    {customTheme.description && (
                                        <div className={styles.customThemeItemDescription}>
                                            {customTheme.description}
                                        </div>
                                    )}
                                </div>
                                <div className={styles.customThemeActions}>
                                    {customThemeManager.hasCustomGradient(customTheme.uuid) && (
                                        <button
                                            className={styles.customThemeEditButton}
                                            onClick={e => {
                                                e.stopPropagation();
                                                this.handleEditGradientTheme(customTheme.uuid);
                                            }}
                                            title="Edit gradient"
                                        >
                                            <Edit className={styles.customThemeActionIcon} />
                                        </button>
                                    )}
                                    <button
                                        className={styles.customThemeActionButton}
                                        onClick={e => {
                                            e.stopPropagation();
                                            this.handleExportSingleTheme(customTheme);
                                        }}
                                        title="Export theme"
                                    >
                                        <Download className={styles.customThemeActionIcon} />
                                    </button>
                                    <button
                                        className={styles.customThemeDeleteButton}
                                        onClick={e => {
                                            e.stopPropagation();
                                            this.handleDeleteTheme(customTheme.uuid, customTheme.name);
                                        }}
                                        title="Delete theme"
                                    >
                                        <Trash className={styles.customThemeActionIcon} />
                                    </button>
                                </div>
                            </div>
                        </MenuItem>
                    ))}

                    {customThemes.length === 0 && (
                        <MenuItem className={styles.customThemeEmpty}>
                            <div className={styles.option}>
                                <FormattedMessage
                                    defaultMessage="No custom themes"
                                    description="Message when no custom themes exist"
                                    id="tw.customThemes.empty"
                                />
                            </div>
                        </MenuItem>
                    )}
                </Submenu>

                {/* Hidden file input for importing */}
                <input
                    ref={this.fileInputRef}
                    type="file"
                    accept=".json"
                    style={{display: 'none'}}
                    onChange={this.handleImportFile}
                />

                
            </MenuItem>
        );
    }
}

CustomThemeMenu.propTypes = {
    isRtl: PropTypes.bool,
    onChangeTheme: PropTypes.func,
    theme: PropTypes.instanceOf(Theme),
    onOpen: PropTypes.func,
    isOpen: PropTypes.bool
};

const mapStateToProps = state => ({
    isOpen: customThemesOpen(state),
    isRtl: state.locales.isRtl,
    theme: state.scratchGui.theme.theme,
    locale: state.locales.locale,
    messages: state.locales.messages
});

const mapDispatchToProps = dispatch => ({
    onChangeTheme: theme => {
        dispatch(setTheme(theme));
        dispatch(closeSettingsMenu());
        applyTheme(theme);
    },
    onOpen: () => {
        dispatch(openCustomThemes());
    }
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(CustomThemeMenu);
