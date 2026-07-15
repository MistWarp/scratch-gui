import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';
import {FormattedMessage} from 'react-intl';

import styles from './custom-procedures.css';

const PRESET_COLORS = [
    {name: 'My Blocks', color: '#FF6680'},
    {name: 'Motion', color: '#4C97FF'},
    {name: 'Looks', color: '#9966FF'},
    {name: 'Sound', color: '#CF63CF'},
    {name: 'Events', color: '#FFBF00'},
    {name: 'Control', color: '#FFAB19'},
    {name: 'Sensing', color: '#5CB1D6'},
    {name: 'Operators', color: '#59C059'},
    {name: 'Variables', color: '#FF8C1A'},
    {name: 'Lists', color: '#FF661A'},
    {name: 'Pen', color: '#0FBD8C'},
    {name: 'Red', color: '#FF4D4D'}
];

class ColorPicker extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, ['handleSwatchClick']);
    }
    handleSwatchClick (event) {
        this.props.onColorChange({target: {value: event.currentTarget.dataset.color}});
    }
    render () {
        const selected = this.props.color.toUpperCase();
        return (
            <div className={styles.colorRow}>
                <span className={styles.colorLabel}>
                    <FormattedMessage
                        defaultMessage="Block color"
                        description="Label for block color picker in custom procedures"
                        id="gui.customProcedures.blockColor"
                    />
                </span>
                <div className={styles.colorSwatches}>
                    {PRESET_COLORS.map(preset => (
                        <button
                            key={preset.color}
                            type="button"
                            title={preset.name}
                            className={classNames(styles.colorSwatch, {
                                [styles.colorSwatchSelected]: selected === preset.color
                            })}
                            style={{backgroundColor: preset.color}}
                            data-color={preset.color}
                            onClick={this.handleSwatchClick}
                        />
                    ))}
                    <input
                        className={styles.colorInput}
                        type="color"
                        title="Custom color"
                        value={this.props.color}
                        onChange={this.props.onColorChange}
                    />
                </div>
            </div>
        );
    }
}

ColorPicker.propTypes = {
    color: PropTypes.string.isRequired,
    onColorChange: PropTypes.func.isRequired
};

export default ColorPicker;
