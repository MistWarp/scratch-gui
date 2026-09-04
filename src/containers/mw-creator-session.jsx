import {useEffect} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {getIsShowingProject} from '../reducers/project-state';
import {getRememberedPlatformProjectState} from '../lib/community/publish';
import {rememberEditedProject} from '../lib/mw/recent-projects';
import {trackDaily} from '../community/analytics';
import {getStarter} from '../lib/starter-projects';

export const CreatorSession = ({vm, ready, changed, username}) => {
    useEffect(() => {
        if (!ready || !changed) return;
        trackDaily('project_edited', {source: 'editor'});
        const platform = getRememberedPlatformProjectState();
        if (platform && platform.isOwner === true) rememberEditedProject(username, platform.id);
    }, [ready, changed, username, vm]);
    useEffect(() => {
        if (!ready) return () => {};
        const params = new URLSearchParams(window.location.search);
        const starter = getStarter(params.get('starter'));
        if (starter) trackDaily('starter_opened', {kind: starter.id});
        if (params.has('restore')) trackDaily('backup_restored', {source: 'home'});
        const platform = getRememberedPlatformProjectState();
        if (platform && platform.isOwner === true) trackDaily('project_resumed', {source: 'editor'});
        const run = () => trackDaily('project_run', {source: 'editor'});
        vm.on('PROJECT_RUN_START', run);
        return () => vm.off('PROJECT_RUN_START', run);
    }, [ready, vm]);
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
