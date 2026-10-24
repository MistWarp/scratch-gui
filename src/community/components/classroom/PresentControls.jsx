import {useCommunityIntl as useCommunityText} from '../../i18n.jsx';
/* eslint-disable max-len */
import PropTypes from 'prop-types';
import React, {useEffect, useState} from 'react';
import {MonitorPlay, Pencil, Square} from 'lucide-react';
import api, {editorUrl} from '../../api';
import {useUser} from '../../UserContext.jsx';
import Button from '../ui/Button.jsx';
import Modal from '../ui/Modal.jsx';
import Notice from '../ui/Notice.jsx';
import SelectMenu from '../ui/SelectMenu.jsx';
import StatusMessage from '../ui/StatusMessage.jsx';
import styles from '../../pages/Classroom.module.css';

const MINE = 'mine';

const PresentModal = ({classInfo, onClose, onStarted, students}) => {
    const {text: communityText} = useCommunityText();
    const {user} = useUser();
    const [source, setSource] = useState(MINE);
    const [projects, setProjects] = useState(null);
    const [projectId, setProjectId] = useState('');
    const [loadError, setLoadError] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const username = (user && user.username) || '';

    useEffect(() => {
        let active = true;
        setProjects(null);
        setProjectId('');
        setLoadError(false);
        const load = source === MINE ?
            api.myProjectPage(username, {offset: 0, limit: 100}).then(data => data.projects || []) :
            api.classroom.student(classInfo.id, source).then(data => data.projects || []);
        load.then(list => {
            if (!active) return;
            setProjects(list);
            if (list.length) setProjectId(list[0].id);
        }).catch(() => {
            if (active) {
                setProjects([]);
                setLoadError(true);
            }
        });
        return () => {
            active = false;
        };
    }, [source, username, classInfo.id]);

    const start = async () => {
        if (!projectId || busy) return;
        setBusy(true);
        setError('');
        try {
            const data = await api.classroom.present(classInfo.id, projectId);
            onStarted(data.presentation);
        } catch (e) {
            setError(e.message || communityText('Could not start presenting.'));
            setBusy(false);
        }
    };

    return (
        <Modal
            title={communityText('Present to the class')}
            icon={MonitorPlay}
            onClose={onClose}
            dismissDisabled={busy}
            actions={(
                <React.Fragment>
                    <Button onClick={onClose} disabled={busy}>{communityText('Cancel')}</Button>
                    <Button variant="primary" onClick={start} disabled={!projectId} busy={busy} busyLabel={communityText('Starting…')}>
                        <MonitorPlay size={16} aria-hidden="true" />
                        {communityText('Start presenting')}
                    </Button>
                </React.Fragment>
            )}
        >
            <p className={styles.hint}>{communityText('Students see a Join card on their class page and follow your view in the editor. They can look but not change anything.')}</p>
            <div className={styles.field}>
                <span>{communityText('Whose project')}</span>
                <SelectMenu
                    ariaLabel={communityText('Whose project')}
                    value={source}
                    onChange={setSource}
                    options={[
                        {value: MINE, label: communityText('One of my projects')},
                        ...students.map(student => ({value: student.id, label: student.displayName}))
                    ]}
                />
            </div>
            <div className={styles.field}>
                <span>{communityText('Project')}</span>
                {projects === null ? <StatusMessage compact /> : null}
                {projects && projects.length ? (
                    <SelectMenu
                        ariaLabel={communityText('Project')}
                        value={projectId}
                        onChange={setProjectId}
                        options={projects.map(project => ({value: project.id, label: project.title || project.id}))}
                    />
                ) : null}
                {projects && !projects.length ? (
                    <small className={styles.hint}>
                        {loadError ? communityText('The projects could not be loaded.') : communityText('There are no projects to choose from here.')}
                    </small>
                ) : null}
            </div>
            {error ? <Notice variant="error">{error}</Notice> : null}
        </Modal>
    );
};

PresentModal.propTypes = {
    classInfo: PropTypes.object.isRequired,
    onClose: PropTypes.func.isRequired,
    onStarted: PropTypes.func.isRequired,
    students: PropTypes.array.isRequired
};

const PresentationBanner = ({classId, onStopped, presentation}) => {
    const {text: communityText} = useCommunityText();
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const stop = async () => {
        if (busy) return;
        setBusy(true);
        setError('');
        try {
            await api.classroom.stopPresenting(classId);
            onStopped();
        } catch (e) {
            setError(e.message || communityText('Could not stop presenting.'));
            setBusy(false);
        }
    };
    return (
        <Notice
            icon={MonitorPlay}
            className={styles.noticeBefore}
            title={communityText('Presenting {value1}', {value1: presentation.title})}
            action={(
                <React.Fragment>
                    <Button as="a" href={editorUrl({platformProject: presentation.projectId})}>
                        <Pencil size={15} aria-hidden="true" />
                        {communityText('Open')}
                    </Button>
                    <Button variant="danger" onClick={stop} busy={busy} busyLabel={communityText('Stopping…')}>
                        <Square size={15} aria-hidden="true" />
                        {communityText('Stop')}
                    </Button>
                </React.Fragment>
            )}
        >
            {presentation.presenterName ? communityText('{value1} is presenting. Students follow along in their editor.', {value1: presentation.presenterName}) : null}
            {error ? <p>{error}</p> : null}
        </Notice>
    );
};

PresentationBanner.propTypes = {
    classId: PropTypes.string.isRequired,
    onStopped: PropTypes.func.isRequired,
    presentation: PropTypes.shape({
        presenterName: PropTypes.string,
        projectId: PropTypes.string.isRequired,
        title: PropTypes.string
    }).isRequired
};

export {PresentModal, PresentationBanner};
