import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import bindAll from 'lodash.bindall';
import VM from 'scratch-vm';

import initDebugger from '../../lib/debugger/controller.js';
import {getSetting, onSettingChanged} from '../../lib/debugger/settings.js';
import pauseIcon from './stage-icons/pause.svg';
import playIcon from './stage-icons/play.svg';
import stepIcon from './stage-icons/step.svg';
import styles from './stage-controls.css';

class DebuggerStageControls extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handlePauseChanged',
            'handleTogglePause',
            'handleStep',
            'handleKeyDown',
            'handleSettingChanged'
        ]);
        this.controller = initDebugger(props.vm);
        this.state = {
            paused: this.controller.engine.isPaused(),
            showPauseButton: getSetting('stage_pause_button'),
            showStepButton: getSetting('stage_step_button')
        };
    }

    componentDidMount () {
        this.controller.events.addEventListener('pause', this.handlePauseChanged);
        document.addEventListener('keydown', this.handleKeyDown, {capture: true});
        this.removeSettingListener = onSettingChanged(this.handleSettingChanged);
    }

    componentWillUnmount () {
        if (this.controller) {
            this.controller.events.removeEventListener('pause', this.handlePauseChanged);
        }
        document.removeEventListener('keydown', this.handleKeyDown, {capture: true});
        if (this.removeSettingListener) {
            this.removeSettingListener();
        }
    }

    handlePauseChanged (event) {
        this.setState({paused: event.paused});
    }

    handleSettingChanged () {
        this.setState({
            showPauseButton: getSetting('stage_pause_button'),
            showStepButton: getSetting('stage_step_button')
        });
    }

    handleTogglePause () {
        const engine = this.controller.engine;
        engine.setPaused(!engine.isPaused());
    }

    handleKeyDown (e) {
        const target = e.target;
        const tagName = target && target.tagName;
        const editing = tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT' ||
            (target && target.isContentEditable);
        if (!this.state.showPauseButton || e.repeat || editing) {
            return;
        }
        const key = typeof e.key === 'string' ? e.key.toLowerCase() : '';
        if (e.altKey && (key === 'x' || e.keyCode === 88)) {
            e.preventDefault();
            e.stopImmediatePropagation();
            this.handleTogglePause();
        }
    }

    handleStep () {
        const engine = this.controller.engine;
        if (!engine.isPaused()) {
            return;
        }
        const runtime = this.props.vm && this.props.vm.runtime;
        if (!runtime) {
            return;
        }
        engine.setPaused(false);
        try {
            runtime._step();
        } finally {
            engine.setPaused(true);
        }
    }

    render () {
        const {paused, showPauseButton, showStepButton} = this.state;
        return (
            <React.Fragment>
                {showPauseButton && (
                    <button
                        type="button"
                        aria-label={paused ? 'Play' : 'Pause'}
                        className={styles.debuggerBtn}
                        title={paused ? 'Play' : 'Pause'}
                        onClick={this.handleTogglePause}
                    >
                        <img
                            draggable={false}
                            src={paused ? playIcon : pauseIcon}
                            alt=""
                        />
                    </button>
                )}
                {paused && showStepButton && (
                    <button
                        type="button"
                        aria-label="Step one frame"
                        className={classNames(styles.debuggerBtn, styles.stepBtn)}
                        title="Step one frame"
                        onClick={this.handleStep}
                    >
                        <img
                            draggable={false}
                            src={stepIcon}
                            alt=""
                        />
                    </button>
                )}
            </React.Fragment>
        );
    }
}

DebuggerStageControls.propTypes = {
    vm: PropTypes.instanceOf(VM).isRequired
};

export {
    DebuggerStageControls
};

export default DebuggerStageControls;
