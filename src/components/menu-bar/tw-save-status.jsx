import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import React, {useCallback} from 'react';
import InlineMessages from '../../containers/inline-messages.jsx';
import {filterInlineAlerts} from '../../reducers/alerts';
import {setProjectUnchanged} from '../../reducers/project-changed';
import smartSave from '../../lib/mw/smart-save.js';
import {getMistWarpAction, getRememberedPlatformProjectState} from '../../lib/community/publish.js';
import communityEnabled from '../../lib/community/enabled.js';

import {Save} from 'lucide-react';

import styles from './save-status.css';

const TWSaveStatus = ({
    alertsList,
    projectChanged,
    projectTitle,
    roturReady,
    onProjectUnchanged,
    vm
}) => {
    const platformState = communityEnabled && roturReady ? getRememberedPlatformProjectState() : null;
    const mistwarpAction = communityEnabled && roturReady ?
        getMistWarpAction(platformState, projectChanged) :
        null;
    const onSaveClick = useCallback(() => smartSave({
        vm,
        title: projectTitle,
        onSaved: onProjectUnchanged
    }), [vm, projectTitle, onProjectUnchanged]);
    if (filterInlineAlerts(alertsList).length > 0) {
        return <InlineMessages />;
    }
    if (!projectChanged) {
        return null;
    }
    if (!platformState || !mistwarpAction) return null;
    const mistwarpLabel = mistwarpAction === 'remix' ? 'Remix to MistWarp' : 'Save to MistWarp';
    return (
        <div
            className={styles.saveNow}
            onClick={onSaveClick}
            title={mistwarpLabel}
        >
            <Save
                className={styles.saveIconAlways}
                size={18}
            />
        </div>
    );
};

TWSaveStatus.propTypes = {
    alertsList: PropTypes.arrayOf(PropTypes.object),
    projectChanged: PropTypes.bool,
    projectTitle: PropTypes.string,
    roturReady: PropTypes.bool,
    onProjectUnchanged: PropTypes.func,
    vm: PropTypes.shape({
        saveProjectSb3: PropTypes.func,
        renderer: PropTypes.object
    })
};

const mapStateToProps = state => ({
    alertsList: state.scratchGui.alerts.alertsList,
    fileHandle: state.scratchGui.tw.fileHandle,
    projectChanged: state.scratchGui.projectChanged,
    projectTitle: state.scratchGui.projectTitle,
    roturReady: state.scratchGui.rotur && state.scratchGui.rotur.status === 'ready',
    vm: state.scratchGui.vm
});

const mapDispatchToProps = dispatch => ({
    onProjectUnchanged: () => dispatch(setProjectUnchanged())
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(TWSaveStatus);
