import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import React, {useCallback, useRef, useState} from 'react';
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
    const savingRef = useRef(false);
    const [saving, setSaving] = useState(false);
    const platformState = communityEnabled && roturReady ? getRememberedPlatformProjectState() : null;
    const mistwarpAction = communityEnabled && roturReady ?
        getMistWarpAction(platformState, projectChanged) :
        null;
    const onSaveClick = useCallback(async () => {
        if (savingRef.current) return false;
        savingRef.current = true;
        setSaving(true);
        try {
            return await smartSave({
                vm,
                title: projectTitle,
                onSaved: onProjectUnchanged
            });
        } finally {
            // This ref is the lock for this invocation, not state derived before the await.
            // eslint-disable-next-line require-atomic-updates
            savingRef.current = false;
            setSaving(false);
        }
    }, [vm, projectTitle, onProjectUnchanged]);
    if (filterInlineAlerts(alertsList).length > 0) {
        return <InlineMessages />;
    }
    if (!projectChanged) {
        return null;
    }
    if (!platformState || !mistwarpAction) return null;
    const mistwarpLabel = mistwarpAction === 'remix' ? 'Remix to MistWarp' : 'Save to MistWarp';
    return (
        <button
            type="button"
            className={styles.saveNow}
            aria-busy={saving || null}
            aria-label={saving ? 'Saving to MistWarp' : mistwarpLabel}
            disabled={saving}
            onClick={onSaveClick}
            title={saving ? 'Saving…' : mistwarpLabel}
        >
            <Save
                className={styles.saveIconAlways}
                size={18}
            />
        </button>
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

export {TWSaveStatus};
