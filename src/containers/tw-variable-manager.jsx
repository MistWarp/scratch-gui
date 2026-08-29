import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';
import VM from 'scratch-vm';

import VariableManager from '../components/variable-manager/variable-manager.jsx';
import {closeVariableManagerModal, openVariableManagerModal} from '../reducers/modals.js';

class TWVariableManager extends React.Component {
    componentDidMount () {
        window.__mistwarpVariableManagerToggle = this.handleToggle;
        document.addEventListener('keydown', this.handleKeyDown);
    }

    componentWillUnmount () {
        document.removeEventListener('keydown', this.handleKeyDown);
        if (window.__mistwarpVariableManagerToggle === this.handleToggle) {
            window.__mistwarpVariableManagerToggle = null;
        }
    }

    handleToggle = () => {
        if (this.props.visible) this.props.onClose();
        else this.props.onOpen();
    };

    handleKeyDown = event => {
        const target = event.target;
        const editingText = target && (
            target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable
        );
        if (editingText || event.repeat) return;
        if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLocaleLowerCase() === 'v') {
            event.preventDefault();
            this.handleToggle();
        }
    };

    render () {
        if (!this.props.visible) return null;
        return (
            <VariableManager
                isRtl={this.props.isRtl}
                visible={this.props.visible}
                vm={this.props.vm}
                onRequestClose={this.props.onClose}
            />
        );
    }
}

TWVariableManager.propTypes = {
    isRtl: PropTypes.bool,
    onClose: PropTypes.func.isRequired,
    onOpen: PropTypes.func.isRequired,
    visible: PropTypes.bool,
    vm: PropTypes.instanceOf(VM).isRequired
};

const mapStateToProps = state => ({
    isRtl: state.locales.isRtl,
    visible: state.scratchGui.modals.variableManagerModal,
    vm: state.scratchGui.vm
});

const mapDispatchToProps = dispatch => ({
    onOpen: () => dispatch(openVariableManagerModal()),
    onClose: () => dispatch(closeVariableManagerModal())
});

export {TWVariableManager};
export default connect(mapStateToProps, mapDispatchToProps)(TWVariableManager);
