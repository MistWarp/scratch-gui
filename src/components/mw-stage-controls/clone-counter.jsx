import PropTypes from 'prop-types';
import React from 'react';
import bindAll from 'lodash.bindall';
import VM from 'scratch-vm';

import {getSetting, onSettingChanged} from '../../lib/mw-stage-controls/settings.js';
import catIcon from './icons/cat.svg';
import fullIcon from './icons/300cats.svg';
import styles from './stage-controls.css';

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
                title={isFull ? `${count} / ${maxClones} clones` : `${count} clones`}
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
    vm: PropTypes.instanceOf(VM).isRequired
};

export default CloneCounter;
