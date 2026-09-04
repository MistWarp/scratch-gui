import PropTypes from 'prop-types';
import React from 'react';
import bindAll from 'lodash.bindall';
import VM from 'scratch-vm';

import {getSetting, onSettingChanged} from '../../lib/mw-stage-controls/settings.js';
import styles from './stage-controls.module.css';

// Patches the VM mouse device once so position updates flow into React state.
const patchedVMs = new WeakSet();
const patchMouseDevice = (vm, onMove) => {
    if (patchedVMs.has(vm)) {
        return;
    }
    patchedVMs.add(vm);
    const mouse = vm.runtime.ioDevices.mouse;
    mouse.__mwScratchX = mouse._scratchX;
    mouse.__mwScratchY = mouse._scratchY;
    Object.defineProperty(mouse, '_scratchX', {
        configurable: true,
        get: function () {
            return this.__mwScratchX;
        },
        set: function (value) {
            this.__mwScratchX = value;
            onMove();
        }
    });
    Object.defineProperty(mouse, '_scratchY', {
        configurable: true,
        get: function () {
            return this.__mwScratchY;
        },
        set: function (value) {
            this.__mwScratchY = value;
            onMove();
        }
    });
};

class MousePos extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleMouseMove',
            'handleSettingChanged'
        ]);
        this.state = {
            visible: getSetting('mouse_position'),
            x: Math.round(props.vm.runtime.ioDevices.mouse._scratchX || 0),
            y: Math.round(props.vm.runtime.ioDevices.mouse._scratchY || 0)
        };
    }
    componentDidMount () {
        const {vm} = this.props;
        patchMouseDevice(vm, this.handleMouseMove);
        this.removeSettingListener = onSettingChanged(this.handleSettingChanged);
    }
    componentWillUnmount () {
        if (this.removeSettingListener) {
            this.removeSettingListener();
        }
    }
    handleMouseMove () {
        const {vm} = this.props;
        this.setState({
            x: Math.round(vm.runtime.ioDevices.mouse.__mwScratchX || 0),
            y: Math.round(vm.runtime.ioDevices.mouse.__mwScratchY || 0)
        });
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
