import PropTypes from 'prop-types';
import React from 'react';
import {FormattedMessage} from 'react-intl';

import styles from './custom-procedures.css';

const SCRATCH_COLORS = [
    {name: 'Red', color: '#FF4D4D'},
    {name: 'Motion', color: '#4C97FF'},
    {name: 'Looks', color: '#9966FF'},
    {name: 'Sound', color: '#CF63CF'},
    {name: 'Events', color: '#FFBF00'},
    {name: 'Control', color: '#FFAB19'},
    {name: 'Sensing', color: '#5CB1D6'},
    {name: 'Operators', color: '#59C059'},
    {name: 'Variables', color: '#FF8C1A'},
    {name: 'Lists', color: '#FF661A'},
    {name: 'My Blocks', color: '#FF6680'},
    {name: 'Pen', color: '#0fBD8C'}
];

const ColorPicker = props => {
    const handlePresetColorClick = presetColor => {
        const syntheticEvent = {target: {value: presetColor}};
        props.onColorChange(syntheticEvent);
    };

    return (
        <div className={styles.colorPickerRow}>
            <div className={styles.colorPickerLabel}>
                <FormattedMessage
                    defaultMessage="Block color"
                    description="Label for block color picker in custom procedures"
                    id="gui.customProcedures.blockColor"
                />
            </div>
            <div className={styles.colorGrid}>
                {SCRATCH_COLORS.map((colorInfo, index) => (
                    <div
                        key={index}
                        className={`${styles.colorGridItem} ${props.color === colorInfo.color ? styles.colorGridItemSelected : ''}`}
                        style={{backgroundColor: colorInfo.color}}
                        onClick={() => handlePresetColorClick(colorInfo.color)}
                        title={colorInfo.name}
                        role="button"
                        tabIndex="0"
                        onKeyDown={e => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handlePresetColorClick(colorInfo.color);
                            }
                        }}
                    />
                ))}
            </div>
            <div className={styles.colorPickerContainer}>
                <input
                    className={styles.colorPickerInput}
                    type="color"
                    value={props.color}
                    onChange={props.onColorChange}
                />
                <div
                    className={styles.colorPreview}
                    style={{backgroundColor: props.color}}
                />
                <span className={styles.colorValue}>{props.color}</span>
            </div>
        </div>
    );
};

ColorPicker.propTypes = {
    color: PropTypes.string.isRequired,
    onColorChange: PropTypes.func.isRequired
};

export default ColorPicker;
