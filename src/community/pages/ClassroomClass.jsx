import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
/* eslint-disable max-len */
import React, {useCallback, useEffect, useState} from 'react';
import {useNavigate, useParams, useSearchParams} from 'react-router-dom';
import {Archive, MonitorPlay, School, Users} from 'lucide-react';
import api from '../api';
import {useUser} from '../UserContext.jsx';
import UnderlineTabs from '../components/UnderlineTabs.jsx';
import {SignInPrompt} from '../components/ui/EmptyState.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import StatusMessage from '../components/ui/StatusMessage.jsx';
import ClassStudents from '../components/classroom/ClassStudents.jsx';
import ClassAssignments from '../components/classroom/ClassAssignments.jsx';
import ClassSettings from '../components/classroom/ClassSettings.jsx';
import ClassGroups from '../components/classroom/ClassGroups.jsx';
import {PresentModal, PresentationBanner} from '../components/classroom/PresentControls.jsx';
import Button from '../components/ui/Button.jsx';
import styles from './Classroom.module.css';

const TABS = ['students', 'assignments', 'groups', 'settings'];

const normalizeTab = value => (TABS.includes(value) ? value : 'students');

const ClassroomClass = () => {
    const {text: communityText} = useCommunityText();
    const {id} = useParams();
    const {user, loading, login} = useUser();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const tab = normalizeTab(searchParams.get('tab'));
    const [detail, setDetail] = useState(null);
    const [overview, setOverview] = useState(null);
    const [error, setError] = useState(null);
    const [attempt, setAttempt] = useState(0);
    const [presenting, setPresenting] = useState(false);
    const reload = useCallback(() => setAttempt(n => n + 1), []);
    const username = (user && user.username) || '';

    useEffect(() => {
        if (!username) return () => {};
        let active = true;
        setError(null);
        Promise.all([api.classroom.class(id), api.classroom.overview()])
            .then(([classData, overviewData]) => {
                if (!active) return;
                setDetail(classData);
                setOverview(overviewData);
            })
            .catch(e => {
                if (active) setError(e);
            });
        return () => {
            active = false;
        };
    }, [id, username, attempt]);

    const setTab = next => {
        const params = new URLSearchParams(searchParams);
        if (next === 'students') params.delete('tab');
        else params.set('tab', next);
        setSearchParams(params, {replace: true});
    };

    if (!user) {
        if (loading) return <main className={styles.page}><StatusMessage /></main>;
        return (
            <main className={styles.page}>
                <SignInPrompt title={communityText('Teachers sign in with Rotur to manage their classes.')} onSignIn={login} />
            </main>
        );
    }
    if (error) {
        return (
            <main className={styles.page}>
                <PageHeader backTo="/classroom" backLabel={communityText('Classroom')} title={communityText('Class')} />
                <StatusMessage error onRetry={reload}>
                    {error.status === 404 ? communityText('This class does not exist or you are not one of its teachers.') : communityText('Could not load this class.')}
                </StatusMessage>
            </main>
        );
    }
    if (!detail) return <main className={styles.page}><StatusMessage /></main>;

    const classInfo = detail.class;
    const students = detail.students || [];
    const assignments = detail.assignments || [];
    const presentation = detail.presentation && detail.presentation.projectId ? detail.presentation : null;
    const tabs = [
        {key: 'students', label: <React.Fragment>{communityText('Students')} <b>{students.length}</b></React.Fragment>},
        {key: 'assignments', label: <React.Fragment>{communityText('Assignments')} <b>{assignments.length}</b></React.Fragment>},
        {key: 'groups', label: communityText('Groups')},
        {key: 'settings', label: communityText('Settings')}
    ];
    return (
        <main className={styles.page}>
            <PageHeader
                backTo="/classroom"
                backLabel={communityText('Classroom')}
                icon={School}
                title={classInfo.name}
                lead={classInfo.loginMode === 'picture' ?
                    communityText('{value1, plural, one {# student signs} other {# students sign}} in with pictures.', {value1: students.length}) :
                    communityText('{value1, plural, one {# student signs} other {# students sign}} in with a password.', {value1: students.length})}
                actions={(
                    <React.Fragment>
                        <span className={styles.headerChips}>
                            {classInfo.isOwner ? null : <span className={styles.chip}><Users size={12} aria-hidden="true" />{communityText('Co-teacher')}</span>}
                            {classInfo.archived ? <span className={styles.chip}><Archive size={12} aria-hidden="true" />{communityText('Archived')}</span> : null}
                        </span>
                        {presentation || classInfo.archived ? null : (
                            <Button onClick={() => setPresenting(true)}>
                                <MonitorPlay size={16} aria-hidden="true" />
                                {communityText('Present')}
                            </Button>
                        )}
                    </React.Fragment>
                )}
            >
                <UnderlineTabs items={tabs} value={tab} onChange={setTab} ariaLabel={communityText('Class sections')} />
            </PageHeader>
            {presentation ? <PresentationBanner classId={classInfo.id} presentation={presentation} onStopped={reload} /> : null}
            {tab === 'students' ? (
                <ClassStudents
                    classInfo={classInfo}
                    students={students}
                    plan={detail.plan || (overview && overview.plan) || {}}
                    usage={(overview && overview.usage) || {}}
                    classes={(overview && overview.classes) || []}
                    onReload={reload}
                />
            ) : null}
            {tab === 'assignments' ? (
                <ClassAssignments classInfo={classInfo} assignments={assignments} students={students} onReload={reload} />
            ) : null}
            {tab === 'groups' ? (
                <ClassGroups classInfo={classInfo} students={students} assignments={assignments} />
            ) : null}
            {presenting ? (
                <PresentModal
                    classInfo={classInfo}
                    students={students}
                    onClose={() => setPresenting(false)}
                    onStarted={() => {
                        setPresenting(false);
                        reload();
                    }}
                />
            ) : null}
            {tab === 'settings' ? (
                <ClassSettings
                    classInfo={classInfo}
                    students={students}
                    assignments={assignments}
                    viewer={user}
                    onReload={reload}
                    onDeleted={() => navigate('/classroom')}
                />
            ) : null}
        </main>
    );
};

export {normalizeTab};
export default ClassroomClass;
