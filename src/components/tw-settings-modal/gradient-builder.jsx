import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import {FormattedMessage, injectIntl, intlShape} from 'react-intl';
import {ArrowUp, Plus, X} from 'lucide-react';

import {GradientUtils} from '../../lib/themes/custom-themes.js';
import messages from './custom-themes-messages.js';

import styles from './custom-themes.css';

const MAX_STOPS = 8;
const MIN_STOPS = 2;
const DIRECTIONS = [0, 45, 90, 135, 180, 225, 270, 315];
const PRESET_MESSAGES = {
    'Sunset': messages.presetSunset,
    'Ocean': messages.presetOcean,
    'Forest': messages.presetForest,
    'Purple Rain': messages.presetPurpleRain,
    'Fire': messages.presetFire,
    'Aurora': messages.presetAurora,
    'Space': messages.presetSpace,
    'Cherry': messages.presetCherry
};
const gradientPresets = () => GradientUtils.getGradientPresets();

let nextStopId = 1;
const withIds = stops => stops.map(stop => ({
    id: stop.id || `stop-${nextStopId++}`,
    color: stop.color,
    position: stop.position
}));

const sortStops = stops => stops.slice().sort((a, b) => a.position - b.position);

const presetStops = preset => preset.colors.map((color, index) => ({
    color,
    position: (index / (preset.colors.length - 1)) * 100
}));

const presetMatches = (preset, value, sorted) => value.direction === preset.direction &&
    sorted.length === preset.colors.length &&
    sorted.every((stop, index) => stop.color.toLowerCase() === preset.colors[index].toLowerCase() &&
        Math.round(stop.position) === Math.round((index / (preset.colors.length - 1)) * 100));

const clampPosition = position => Math.max(0, Math.min(100, position));

const createGradientValue = ({stops, direction, primaryColor} = {}) => {
    const fallback = gradientPresets()[0];
    const initialStops = stops && stops.length >= MIN_STOPS ? sortStops(stops) : presetStops(fallback);
    return {
        stops: withIds(initialStops),
        direction: typeof direction === 'number' ? direction : fallback.direction,
        primaryColor: primaryColor || initialStops[0].color
    };
};

const gradientSignature = value => JSON.stringify({
    stops: sortStops(value.stops).map(stop => [stop.color.toLowerCase(), Math.round(stop.position * 10) / 10]),
    direction: value.direction,
    primaryColor: value.primaryColor.toLowerCase()
});

class GradientControls extends React.Component {
    constructor (props) {
        super(props);
        this.trackRef = React.createRef();
        this.state = {dragging: null};
    }

    update (patch) {
        this.props.onChange({...this.props.value, ...patch});
    }

    setStops (stops) {
        this.update({stops});
    }

    positionFromPointer (clientX) {
        const track = this.trackRef.current;
        if (!track) return null;
        const rect = track.getBoundingClientRect();
        if (!rect.width) return null;
        return clampPosition(((clientX - rect.left) / rect.width) * 100);
    }

    moveStop (id, position) {
        this.setStops(this.props.value.stops.map(stop => (
            stop.id === id ? {...stop, position: Math.round(position * 10) / 10} : stop
        )));
    }

    handlePointerDown = e => {
        const id = e.currentTarget.dataset.id;
        e.preventDefault();
        e.currentTarget.focus();
        if (e.currentTarget.setPointerCapture) e.currentTarget.setPointerCapture(e.pointerId);
        this.setState({dragging: id});
    };

    handlePointerMove = e => {
        const id = e.currentTarget.dataset.id;
        if (this.state.dragging !== id) return;
        if (e.buttons === 0) {
            this.setState({dragging: null});
            return;
        }
        const position = this.positionFromPointer(e.clientX);
        if (position !== null) this.moveStop(id, position);
    };

    handlePointerUp = e => {
        if (e.currentTarget.releasePointerCapture && e.currentTarget.hasPointerCapture &&
            e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId);
        }
        this.setState({dragging: null});
    };

    handleLostPointerCapture = () => {
        if (this.state.dragging !== null) this.setState({dragging: null});
    };

    handleHandleKeyDown = e => {
        const id = e.currentTarget.dataset.id;
        const stop = this.props.value.stops.find(item => item.id === id);
        if (!stop) return;
        const step = e.shiftKey ? 10 : 1;
        let position = null;
        if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') position = stop.position - step;
        else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') position = stop.position + step;
        else if (e.key === 'Home') position = 0;
        else if (e.key === 'End') position = 100;
        if (position === null) return;
        e.preventDefault();
        this.moveStop(id, clampPosition(position));
    };

    handleColorChange = e => {
        const id = e.currentTarget.dataset.id;
        const color = e.currentTarget.value;
        const {stops, primaryColor} = this.props.value;
        const first = sortStops(stops)[0];
        const patch = {
            stops: stops.map(stop => (stop.id === id ? {...stop, color} : stop))
        };
        if (first && first.id === id && first.color.toLowerCase() === primaryColor.toLowerCase()) {
            patch.primaryColor = color;
        }
        this.update(patch);
    };

    handleRemoveStop = e => {
        const id = e.currentTarget.dataset.id;
        const {stops} = this.props.value;
        if (stops.length <= MIN_STOPS) return;
        this.setStops(stops.filter(stop => stop.id !== id));
    };

    handleAddStop = () => {
        const stops = sortStops(this.props.value.stops);
        if (stops.length >= MAX_STOPS) return;
        let gapStart = stops[0];
        let gapEnd = stops[1];
        for (let i = 0; i < stops.length - 1; i++) {
            if (stops[i + 1].position - stops[i].position > gapEnd.position - gapStart.position) {
                gapStart = stops[i];
                gapEnd = stops[i + 1];
            }
        }
        const position = Math.round((gapStart.position + gapEnd.position) / 2);
        this.setStops([...stops, ...withIds([{color: gapEnd.color, position}])]);
    };

    handleDirectionClick = e => {
        this.update({direction: Number(e.currentTarget.dataset.direction)});
    };

    handleDirectionSlider = e => {
        this.update({direction: parseInt(e.currentTarget.value, 10)});
    };

    handlePresetClick = e => {
        const preset = gradientPresets()[Number(e.currentTarget.dataset.index)];
        if (!preset) return;
        this.update({
            stops: withIds(presetStops(preset)),
            direction: preset.direction,
            primaryColor: preset.colors[0]
        });
    };

    handlePrimaryColorChange = e => {
        this.update({primaryColor: e.currentTarget.value});
    };

    render () {
        const {intl, value} = this.props;
        const {stops, direction, primaryColor} = value;
        const sorted = sortStops(stops);
        const order = new Map(sorted.map((stop, index) => [stop.id, index + 1]));
        const gradient = GradientUtils.createLinearGradient(sorted, 90);

        return (
            <div className={styles.gradientControls}>
                <div className={styles.field}>
                    <span className={styles.fieldLabel}>
                        <FormattedMessage {...messages.colors} />
                    </span>
                    <div
                        className={styles.gradientTrack}
                        ref={this.trackRef}
                    >
                        <div
                            className={styles.gradientTrackFill}
                            style={{background: gradient}}
                        />
                        {stops.map(stop => (
                            <button
                                key={stop.id}
                                type="button"
                                role="slider"
                                aria-label={intl.formatMessage(messages.colorStop, {number: order.get(stop.id)})}
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-valuenow={Math.round(stop.position)}
                                aria-valuetext={`${Math.round(stop.position)}%`}
                                data-id={stop.id}
                                className={classNames(styles.gradientHandle, {
                                    [styles.gradientHandleDragging]: this.state.dragging === stop.id
                                })}
                                style={{left: `${stop.position}%`, background: stop.color}}
                                onPointerDown={this.handlePointerDown}
                                onPointerMove={this.handlePointerMove}
                                onPointerUp={this.handlePointerUp}
                                onPointerCancel={this.handlePointerUp}
                                onLostPointerCapture={this.handleLostPointerCapture}
                                onKeyDown={this.handleHandleKeyDown}
                            />
                        ))}
                    </div>
                    <ul className={styles.stopList}>
                        {sorted.map((stop, index) => (
                            <li
                                key={stop.id}
                                className={styles.stopChip}
                            >
                                <input
                                    type="color"
                                    className={styles.colorInput}
                                    value={stop.color}
                                    data-id={stop.id}
                                    aria-label={intl.formatMessage(messages.colorValue, {number: index + 1})}
                                    onChange={this.handleColorChange}
                                />
                                <span className={styles.stopPosition}>{`${Math.round(stop.position)}%`}</span>
                                {stops.length > MIN_STOPS ? (
                                    <button
                                        type="button"
                                        className={styles.stopRemove}
                                        data-id={stop.id}
                                        aria-label={intl.formatMessage(messages.removeColor, {number: index + 1})}
                                        title={intl.formatMessage(messages.removeColor, {number: index + 1})}
                                        onClick={this.handleRemoveStop}
                                    >
                                        <X size={12} />
                                    </button>
                                ) : null}
                            </li>
                        ))}
                        {stops.length < MAX_STOPS ? (
                            <li>
                                <button
                                    type="button"
                                    className={styles.addStop}
                                    onClick={this.handleAddStop}
                                >
                                    <Plus size={14} />
                                    <FormattedMessage {...messages.addColor} />
                                </button>
                            </li>
                        ) : null}
                    </ul>
                </div>

                <div className={styles.field}>
                    <span className={styles.fieldLabel}>
                        <FormattedMessage {...messages.presets} />
                    </span>
                    <div className={styles.presetRow}>
                        {gradientPresets().map((preset, index) => {
                            const selected = presetMatches(preset, value, sorted);
                            const presetName = PRESET_MESSAGES[preset.name] ?
                                intl.formatMessage(PRESET_MESSAGES[preset.name]) : preset.name;
                            return (
                                <button
                                    key={preset.name}
                                    type="button"
                                    data-index={index}
                                    aria-pressed={selected}
                                    aria-label={presetName}
                                    title={presetName}
                                    className={classNames(styles.preset, {
                                        [styles.presetSelected]: selected
                                    })}
                                    style={{
                                        background: GradientUtils.createLinearGradient(
                                            presetStops(preset),
                                            preset.direction
                                        )
                                    }}
                                    onClick={this.handlePresetClick}
                                />
                            );
                        })}
                    </div>
                </div>

                <div className={styles.field}>
                    <span className={styles.fieldLabel}>
                        <FormattedMessage {...messages.direction} />
                    </span>
                    <div className={styles.directionRow}>
                        <div className={styles.directionButtons}>
                            {DIRECTIONS.map(degrees => (
                                <button
                                    key={degrees}
                                    type="button"
                                    data-direction={degrees}
                                    aria-pressed={direction === degrees}
                                    aria-label={intl.formatMessage(messages.directionValue, {degrees})}
                                    title={`${degrees}°`}
                                    className={classNames(styles.directionButton, {
                                        [styles.directionButtonSelected]: direction === degrees
                                    })}
                                    onClick={this.handleDirectionClick}
                                >
                                    <ArrowUp
                                        size={14}
                                        style={{transform: `rotate(${degrees}deg)`}}
                                    />
                                </button>
                            ))}
                        </div>
                        <div className={styles.directionFine}>
                            <input
                                type="range"
                                min="0"
                                max="359"
                                value={direction}
                                className={styles.directionSlider}
                                aria-label={intl.formatMessage(messages.direction)}
                                onChange={this.handleDirectionSlider}
                            />
                            <span className={styles.directionValue}>{`${direction}°`}</span>
                        </div>
                    </div>
                </div>

                <div className={styles.field}>
                    <span className={styles.fieldLabel}>
                        <FormattedMessage {...messages.accentColor} />
                    </span>
                    <label className={styles.accentRow}>
                        <input
                            type="color"
                            className={styles.colorInput}
                            value={primaryColor}
                            onChange={this.handlePrimaryColorChange}
                        />
                        <span className={styles.accentText}>
                            <span className={styles.accentHex}>{primaryColor}</span>
                            <span className={styles.fieldHint}>
                                <FormattedMessage {...messages.accentHint} />
                            </span>
                        </span>
                    </label>
                </div>
            </div>
        );
    }
}

GradientControls.propTypes = {
    intl: intlShape.isRequired,
    value: PropTypes.shape({
        stops: PropTypes.arrayOf(PropTypes.shape({
            id: PropTypes.string,
            color: PropTypes.string,
            position: PropTypes.number
        })),
        direction: PropTypes.number,
        primaryColor: PropTypes.string
    }).isRequired,
    onChange: PropTypes.func.isRequired
};

export {createGradientValue, gradientSignature, sortStops};
export default injectIntl(GradientControls);
