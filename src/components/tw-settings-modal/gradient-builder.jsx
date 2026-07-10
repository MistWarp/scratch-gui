import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import {FormattedMessage} from 'react-intl';

import {GradientUtils} from '../../lib/themes/custom-themes.js';
import showAlert from '../../addons/window-system/alert';

import styles from '../menu-bar/settings-menu.css';

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

const GradientBuilder = props => {
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

GradientBuilder.propTypes = {
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

export default GradientBuilder;
