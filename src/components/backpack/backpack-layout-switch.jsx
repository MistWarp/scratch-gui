import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {defineMessages, injectIntl, intlShape} from 'react-intl';

import {LAYOUTS} from '../../lib/backpack/layout.js';
import styles from './backpack-controls.css';

const layoutMessages = defineMessages({
    drawer: {
        id: 'mw.backpack.layoutDrawer',
        defaultMessage: 'Side drawer',
        description: 'Option in the temporary backpack layout switch'
    },
    strip: {
        id: 'mw.backpack.layoutStrip',
        defaultMessage: 'Bottom strip',
        description: 'Option in the temporary backpack layout switch'
    },
    label: {
        id: 'mw.backpack.layoutSwitch',
        defaultMessage: 'Prototype layout',
        description: 'Label of the temporary switch between backpack layouts'
    }
});

class BackpackLayoutSwitchComponent extends React.Component {
    constructor (props) {
        super(props);
        this.handleChange = this.handleChange.bind(this);
    }
    handleChange (e) {
        this.props.onLayoutChange(e.target.value);
    }
    render () {
        const {className, intl, layout} = this.props;
        return (
            <label className={classNames(styles.layoutSwitch, className)}>
                <span className={styles.layoutSwitchLabel}>{intl.formatMessage(layoutMessages.label)}</span>
                <select
                    className={styles.layoutSelect}
                    value={layout}
                    onChange={this.handleChange}
                >
                    {LAYOUTS.map(value => (
                        <option
                            key={value}
                            value={value}
                        >
                            {intl.formatMessage(layoutMessages[value])}
                        </option>
                    ))}
                </select>
            </label>
        );
    }
}

BackpackLayoutSwitchComponent.propTypes = {
    className: PropTypes.string,
    intl: intlShape,
    layout: PropTypes.oneOf(LAYOUTS).isRequired,
    onLayoutChange: PropTypes.func.isRequired
};

export default injectIntl(BackpackLayoutSwitchComponent);
