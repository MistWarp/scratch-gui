/* eslint-disable max-len */
import PropTypes from 'prop-types';
import React, {useEffect, useRef, useState} from 'react';
import {Eye, EyeOff, Ghost} from 'lucide-react';
import {useCommunityIntl as useCommunityText} from '../../i18n.jsx';
import api from '../../api';
import AdminActionDialog from './AdminActionDialog.jsx';

const dialogFor = (kind, title, communityText) => {
    if (kind === 'hide') {
        return {
            title: communityText('Hide {value1}?', {value1: title}),
            description: communityText('The project becomes private and its creator can\'t share it again until an admin restores it. They get a notification with your reason.'),
            action: communityText('Hide project'),
            danger: true,
            icon: EyeOff,
            fields: [{key: 'reason', label: communityText('Reason for the creator'), value: '', multiline: true, maxLength: 1000}]
        };
    }
    if (kind === 'restore') {
        return {
            title: communityText('Restore {value1}?', {value1: title}),
            description: communityText('The project goes back to how it was shared before it was hidden, and its creator gets a notification.'),
            action: communityText('Restore project'),
            icon: Eye
        };
    }
    if (kind === 'shadow') {
        return {
            title: communityText('Shadow ban {value1}?', {value1: title}),
            description: communityText('The project leaves explore, search, profiles and every other list, but its link keeps working. Its creator is not told and still sees it everywhere.'),
            action: communityText('Shadow ban'),
            danger: true,
            icon: Ghost,
            fields: [{key: 'reason', label: communityText('Private note for admins'), value: '', multiline: true, maxLength: 1000}]
        };
    }
    return {
        title: communityText('Lift the shadow ban on {value1}?', {value1: title}),
        description: communityText('The project shows up in lists again.'),
        action: communityText('Lift shadow ban'),
        icon: Ghost
    };
};

const runAction = (kind, id, reason) => {
    if (kind === 'hide') return api.admin.hideProject(id, reason);
    if (kind === 'restore') return api.admin.restoreProject(id);
    if (kind === 'shadow') return api.admin.shadowBanProject(id, reason);
    return api.admin.liftProjectShadowBan(id);
};

const ProjectModerationDialog = ({kind, project, onClose, onDone}) => {
    const {text: communityText} = useCommunityText();
    const [dialog, setDialog] = useState(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const inFlight = useRef(false);

    useEffect(() => {
        setError('');
        setDialog(kind && project ? dialogFor(kind, project.title || project.id, communityText) : null);
    }, [kind, project && project.id]);

    if (!dialog) return null;

    const updateField = (key, value) => {
        setError('');
        setDialog(current => ({
            ...current,
            fields: current.fields.map(field => (field.key === key ? {...field, value} : field))
        }));
    };

    const confirm = async () => {
        if (inFlight.current) return;
        const reason = ((dialog.fields || []).find(field => field.key === 'reason') || {value: ''}).value.trim();
        if (kind === 'hide' && !reason) {
            setError(communityText('Tell the creator why their project is hidden.'));
            return;
        }
        const release = () => {
            inFlight.current = false;
        };
        inFlight.current = true;
        setBusy(true);
        try {
            const result = await runAction(kind, project.id, reason);
            onDone(kind, result && result.project);
        } catch (e) {
            setError(e.message || communityText('Could not update this project.'));
        } finally {
            release();
            setBusy(false);
        }
    };

    return (
        <AdminActionDialog
            dialog={dialog}
            busy={busy}
            error={error}
            onChange={updateField}
            onCancel={() => {
                if (!inFlight.current) onClose();
            }}
            onConfirm={confirm}
        />
    );
};

ProjectModerationDialog.propTypes = {
    kind: PropTypes.oneOf(['hide', 'restore', 'shadow', 'unshadow']),
    project: PropTypes.shape({
        id: PropTypes.string,
        title: PropTypes.string
    }),
    onClose: PropTypes.func.isRequired,
    onDone: PropTypes.func.isRequired
};

export default ProjectModerationDialog;
