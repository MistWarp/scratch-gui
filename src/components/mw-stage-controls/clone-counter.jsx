import PropTypes from 'prop-types';
import React from 'react';
import bindAll from 'lodash.bindall';
import VM from 'scratch-vm';

import {getSetting, onSettingChanged} from '../../lib/mw-stage-controls/settings.js';
import catIcon from './icons/cat.svg';
import fullIcon from './icons/300cats.svg';
import styles from './stage-controls.css';

// Wraps runtime._step once per VM so the counter updates after each step.
const wrappedVMs = new WeakSet();
const wrapStep = (vm, onStep) => {
    if (wrappedVMs.has(vm)) {
        return;
    }
    wrappedVMs.add(vm);
    const oldStep = vm.runtime._step;
    vm.runtime._step = function (...args) {
        const result = oldStep.call(this, ...args);
        onStep();
        return result;
    };
};

class CloneCounter extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleStep',
            'handleSettingChanged'
        ]);
        this.state = {
            visible: getSetting('clone_counter'),
            count: props.vm.runtime._cloneCounter || 0
        };
    }
    componentDidMount () {
        wrapStep(this.props.vm, this.handleStep);
        this.removeSettingListener = onSettingChanged(this.handleSettingChanged);
    }
    componentWillUnmount () {
        if (this.removeSettingListener) {
            this.removeSettingListener();
        }
    }
    handleStep () {
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
