import PropTypes from 'prop-types';
import React from 'react';
import bindAll from 'lodash.bindall';
import VM from 'scratch-vm';
import {defineMessages, injectIntl, intlShape} from 'react-intl';

import {getSetting, onSettingChanged} from '../../lib/mw-stage-controls/settings.js';
import catIcon from './icons/cat.svg';
import fullIcon from './icons/300cats.svg';
import styles from './stage-controls.css';

const messages = defineMessages({
    clones: {
        id: 'mw.stageControls.cloneCount',
        defaultMessage: '{count, plural, one {# clone} other {# clones}}',
        description: 'Tooltip of the stage clone counter. {count} is the number of clones.'
    },
    clonesOfMax: {
        id: 'mw.stageControls.cloneCountFull',
        defaultMessage: '{count} of {max} clones. The clone limit has been reached.',
        description: 'Tooltip of the stage clone counter when the clone limit is reached'
    }
});

class CloneCounter extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleFrame',
            'handleSettingChanged'
        ]);
        this.frame = null;
        this.state = {
            visible: getSetting('clone_counter'),
            count: props.vm.runtime._cloneCounter || 0
        };
    }
    componentDidMount () {
        this.removeSettingListener = onSettingChanged(this.handleSettingChanged);
        this.updatePolling();
    }
    componentDidUpdate () {
        this.updatePolling();
    }
    componentWillUnmount () {
        if (this.removeSettingListener) {
            this.removeSettingListener();
        }
        this.stopPolling();
    }
    updatePolling () {
        if (this.state.visible && this.frame === null) {
            this.frame = requestAnimationFrame(this.handleFrame);
        } else if (!this.state.visible) {
            this.stopPolling();
        }
    }
    stopPolling () {
        if (this.frame !== null) {
            cancelAnimationFrame(this.frame);
            this.frame = null;
        }
    }
    handleFrame () {
        this.frame = requestAnimationFrame(this.handleFrame);
        const count = this.props.vm.runtime._cloneCounter || 0;
        if (count !== this.state.count) {
            this.setState({count});
        }
    }
    handleSettingChanged () {
        this.setState({visible: getSetting('clone_counter')});
    }
    render () {
        const {visible, count} = this.state;
        if (!visible || count === 0) {
            return null;
        }
        const maxClones = this.props.vm.runtime.runtimeOptions.maxClones;
        const isFull = count >= maxClones;
        return (
            <div
                className={styles.cloneCounter}
                data-count={isFull ? 'full' : ''}
                title={isFull ?
                    this.props.intl.formatMessage(messages.clonesOfMax, {count, max: maxClones}) :
                    this.props.intl.formatMessage(messages.clones, {count})}
            >
                <span
                    className={styles.cloneIcon}
                    style={{backgroundImage: `url(${isFull ? fullIcon : catIcon})`}}
                />
                <span>{count}</span>
            </div>
        );
    }
}

CloneCounter.propTypes = {
    intl: intlShape.isRequired,
    vm: PropTypes.instanceOf(VM).isRequired
};

export default injectIntl(CloneCounter);
