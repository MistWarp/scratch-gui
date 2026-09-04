import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import React from 'react';
import VM from 'scratch-vm';

import {setProjectUnchanged} from '../reducers/project-changed';
import {getSettings, onSettingsChanged} from '../lib/mw/autosave-settings.js';
import {runAutosave} from '../lib/mw/autosave.js';

// Background MistWarp autosave. On a configurable timer it pushes the
// current worktree snapshot without creating a version, so edits stay as
// uncommitted changes. Renders nothing.
class MwAutosave extends React.Component {
    constructor (props) {
        super(props);
        this.timer = null;
        this.tick = this.tick.bind(this);
        this.reschedule = this.reschedule.bind(this);
    }
    componentDidMount () {
        this.mounted = true;
        this.unsubscribe = onSettingsChanged(this.reschedule);
        this.reschedule();
    }
    componentWillUnmount () {
        this.mounted = false;
        if (this.unsubscribe) this.unsubscribe();
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    }
    reschedule () {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
        if (!this.mounted) return;
        const settings = getSettings();
        if (!settings.enabled) return;
        this.timer = setTimeout(this.tick, settings.interval * 60 * 1000);
    }
    async tick () {
        try {
            await runAutosave({
                vm: this.props.vm,
                projectChanged: this.props.projectChanged,
                onSaved: this.props.onProjectUnchanged,
                showToast: this.props.showToast
            });
        } finally {
            this.reschedule();
        }
    }
    render () {
        return null;
    }
}

MwAutosave.propTypes = {
    projectChanged: PropTypes.bool,
    onProjectUnchanged: PropTypes.func.isRequired,
    showToast: PropTypes.func.isRequired,
    vm: PropTypes.instanceOf(VM)
};

const mapStateToProps = state => ({
    projectChanged: state.scratchGui.projectChanged,
    vm: state.scratchGui.vm
});

const mapDispatchToProps = dispatch => ({
    onProjectUnchanged: () => dispatch(setProjectUnchanged()),
    showToast: (message, type) => dispatch({
        type: 'scratch-gui/SHOW_TOAST',
        message,
        toastType: type
    })
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(MwAutosave);

export {MwAutosave};
