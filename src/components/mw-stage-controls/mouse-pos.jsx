import PropTypes from 'prop-types';
import React from 'react';
import bindAll from 'lodash.bindall';
import VM from 'scratch-vm';

import {getSetting, onSettingChanged} from '../../lib/mw-stage-controls/settings.js';
import styles from './stage-controls.css';

class MousePos extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleFrame',
            'handleSettingChanged'
        ]);
        this.frame = null;
        this.state = {
            visible: getSetting('mouse_position'),
            x: Math.round(props.vm.runtime.ioDevices.mouse._scratchX || 0),
            y: Math.round(props.vm.runtime.ioDevices.mouse._scratchY || 0)
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
        const mouse = this.props.vm.runtime.ioDevices.mouse;
        const x = Math.round(mouse._scratchX || 0);
        const y = Math.round(mouse._scratchY || 0);
        if (x !== this.state.x || y !== this.state.y) {
            this.setState({x, y});
        }
    }
    handleSettingChanged () {
        this.setState({visible: getSetting('mouse_position')});
    }
    render () {
        if (!this.state.visible) {
            return null;
        }
        return (
            <div className={styles.mousePos}>
                {`${this.state.x}, ${this.state.y}`}
            </div>
        );
    }
}

MousePos.propTypes = {
    vm: PropTypes.instanceOf(VM).isRequired
};

export default MousePos;
