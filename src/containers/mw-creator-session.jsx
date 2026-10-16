import {useEffect} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {getIsShowingProject} from '../reducers/project-state';
import {getRememberedPlatformProjectState} from '../lib/community/publish';
import {rememberEditedProject} from '../lib/mw/recent-projects';

export const CreatorSession = ({vm, ready, changed, username}) => {
    useEffect(() => {
        if (!ready || !changed) return;
        const platform = getRememberedPlatformProjectState();
        if (platform && platform.isOwner === true) rememberEditedProject(username, platform.id);
    }, [ready, changed, username, vm]);
    return null;
};

CreatorSession.propTypes = {
    vm: PropTypes.object.isRequired,
    ready: PropTypes.bool,
    changed: PropTypes.bool,
    username: PropTypes.string
};

export default connect(state => ({
    vm: state.scratchGui.vm,
    ready: getIsShowingProject(state.scratchGui.projectState.loadingState) &&
        !state.scratchGui.mode.isPlayerOnly && !state.scratchGui.mode.isEmbedded,
    changed: state.scratchGui.projectChanged,
    username: state.scratchGui.rotur && state.scratchGui.rotur.username
}))(CreatorSession);
