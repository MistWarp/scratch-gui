import PropTypes from 'prop-types';
import React from 'react';
import bindAll from 'lodash.bindall';
import {connect} from 'react-redux';
import VM from 'scratch-vm';

import Debugger from '../components/tw-debugger/debugger.jsx';
import initDebugger from '../lib/debugger/controller.js';
import setupThreadGlow from '../lib/debugger/thread-glow.js';
import {openDebuggerModal, closeDebuggerModal} from '../reducers/modals';

class TWDebugger extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleClose',
            'handleShowRequest',
            'handleToggle'
        ]);
        this.controller = null;
    }

    componentDidMount () {
        this.controller = initDebugger(this.props.vm);
        setupThreadGlow(this.controller);
        this.controller.events.addEventListener('show', this.handleShowRequest);
        window.__mistwarpDebuggerToggle = this.handleToggle;
    }

    componentWillUnmount () {
        if (this.controller) {
            this.controller.events.removeEventListener('show', this.handleShowRequest);
        }
        if (window.__mistwarpDebuggerToggle === this.handleToggle) {
            window.__mistwarpDebuggerToggle = null;
        }
    }

    handleShowRequest () {
        if (!this.props.visible) {
            this.props.onOpen();
        }
    }

    handleToggle () {
        if (this.props.visible) {
            this.props.onClose();
        } else {
            this.props.onOpen();
        }
    }

    handleClose () {
        this.props.onClose();
    }

    render () {
        if (!this.props.visible || !this.controller) {
            return null;
        }
        return (
            <Debugger
                controller={this.controller}
                onClose={this.handleClose}
            />
        );
    }
}

TWDebugger.propTypes = {
    vm: PropTypes.instanceOf(VM).isRequired,
    visible: PropTypes.bool,
    onOpen: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired
};

const mapStateToProps = state => ({
    vm: state.scratchGui.vm,
    visible: state.scratchGui.modals.debuggerModal
});

const mapDispatchToProps = dispatch => ({
    onOpen: () => dispatch(openDebuggerModal()),
    onClose: () => dispatch(closeDebuggerModal())
});

export default connect(mapStateToProps, mapDispatchToProps)(TWDebugger);
