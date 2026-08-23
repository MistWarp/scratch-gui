import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';
import {defineMessages, injectIntl, intlShape} from 'react-intl';
import VM from 'scratch-vm';
import {openSimpleDialog} from '../reducers/modals';
import {normalizeCustomFramerate} from '../lib/utils/framerate';

const messages = defineMessages({
    newFramerate: {
        defaultMessage: 'New framerate:',
        description: 'Prompt shown to choose a new framerate',
        id: 'tw.menuBar.newFramerate'
    }
});

class FramerateChanger extends React.Component {
    constructor (props) {
        super(props);
        this.promptOpen = false;
        bindAll(this, [
            'changeFramerate'
        ]);
    }
    async changeFramerate (e) {
        if (e && (e.ctrlKey || e.shiftKey)) {
            if (this.promptOpen) return;
            this.promptOpen = true;
            const message = this.props.intl.formatMessage(messages.newFramerate);
            const newFPS = await new Promise(resolve => {
                this.props.openSimpleDialog({
                    type: 'prompt',
                    title: message,
                    message,
                    defaultValue: `${this.props.framerate}`,
                    onOk: resolve,
                    onCancel: () => resolve(null)
                });
            });
            this.promptOpen = false;
            const fps = normalizeCustomFramerate(newFPS);
            if (fps !== null) this.props.vm.setFramerate(fps);
        } else if (this.props.framerate === 60) {
            this.props.vm.setFramerate(30);
        } else {
            this.props.vm.setFramerate(60);
        }
    }
    render () {
        const {
            /* eslint-disable no-unused-vars */
            intl,
            children,
            vm,
            /* eslint-enable no-unused-vars */
            ...props
        } = this.props;
        return this.props.children(this.changeFramerate, props);
    }
}

FramerateChanger.propTypes = {
    intl: intlShape,
    children: PropTypes.func,
    framerate: PropTypes.number,
    openSimpleDialog: PropTypes.func.isRequired,
    vm: PropTypes.instanceOf(VM)
};

const mapStateToProps = state => ({
    framerate: state.scratchGui.tw.framerate,
    vm: state.scratchGui.vm
});

export default injectIntl(connect(
    mapStateToProps,
    dispatch => ({
        openSimpleDialog: config => dispatch(openSimpleDialog(config))
    })
)(FramerateChanger));

export {FramerateChanger};
