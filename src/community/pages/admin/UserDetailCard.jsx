/* eslint-disable max-len */
import React, {useEffect, useRef, useState} from 'react';
import {Link} from 'react-router-dom';
import {useCommunityIntl as useCommunityText} from '../../i18n.jsx';
import {ArrowLeft, FolderOpen} from 'lucide-react';
import api, {projectUrl} from '../../api';
import Avatar from '../../components/Avatar.jsx';
import Button from '../../components/ui/Button.jsx';
import Notice from '../../components/ui/Notice.jsx';
import StatusMessage from '../../components/ui/StatusMessage.jsx';
import {formatBytes} from '../../format';
import styles from '../Admin.module.css';
import AdminActionDialog from './AdminActionDialog.jsx';

const STANDING_LEVELS = ['good', 'warning', 'suspended', 'banned'];

const UserDetailCard = ({username, onBack}) => {
    const {text: communityText} = useCommunityText();
    const [data, setData] = useState(null);
    const [error, setError] = useState('');
    const [note, setNote] = useState('');
    const [level, setLevel] = useState('good');
    const [reasonText, setReasonText] = useState('');
    const [message, setMessage] = useState('');
    const [dialog, setDialog] = useState(null);
    const [dialogBusy, setDialogBusy] = useState(false);
    const [dialogError, setDialogError] = useState('');
    const deleteInFlight = useRef(false);
    const currentUsername = useRef(username);
    currentUsername.current = username;

    useEffect(() => {
        if (!username) return;
        let active = true;
        setData(null);
        setError('');
        setNote('');
        setDialog(null);
        setDialogError('');
        setDialogBusy(false);
        api.admin.getUser(username)
            .then(result => {
                if (!active) return;
                setData(result);
                setLevel((result.standing && result.standing.level) || 'good');
                setReasonText('');
                setMessage('');
            })
            .catch(e => {
                if (!active) return;
                setData(null);
                setError(e.message || 'Could not load that user.');
            });
        return () => {
            active = false;
        };
    }, [username]);

    const refresh = () => {
        if (!data) return;
        const actionUsername = data.username;
        api.admin.getUser(actionUsername)
            .then(result => {
                if (currentUsername.current === actionUsername) setData(result);
            })
            .catch(() => {});
    };

    const applyStanding = async () => {
        if (!data) return;
        setError('');
        setNote('');
        try {
            await api.admin.setStanding(data.username, level, reasonText.trim());
            setNote(communityText('Standing updated.'));
            refresh();
        } catch (e) {
            setError(e.message || 'Action failed.');
        }
    };

    const sendMessage = async () => {
        if (!data || !message.trim()) return;
        setError('');
        setNote('');
        try {
            await api.admin.messageUser(data.username, message.trim());
            setNote(communityText('Message sent.'));
            setMessage('');
        } catch (e) {
            setError(e.message || 'Action failed.');
        }
    };

    const toggleComments = async () => {
        if (!data) return;
        setError('');
        setNote('');
        try {
            await api.admin.updateUserProfile(data.username, {commentsOff: !data.commentsOff});
            refresh();
        } catch (e) {
            setError(e.message || 'Action failed.');
        }
    };

    const unshareProject = async pid => {
        try {
            await api.unpublish(pid);
            setNote(communityText('Project unshared.'));
            refresh();
        } catch (e) {
            setError(e.message || 'Could not unshare.');
        }
    };

    const deleteProject = pid => {
        if (deleteInFlight.current) return;
        const project = (data.projects || []).find(item => item.id === pid);
        setDialogError('');
        setDialog({
            id: pid,
            title: communityText('Delete project?'),
            description: communityText('Delete {value1} permanently?', {value1: project ? project.title : communityText('this project')}),
            action: communityText('Delete project'),
            danger: true,
            icon: FolderOpen
        });
    };

    const confirmDeleteProject = async () => {
        if (!dialog || deleteInFlight.current) return;
        const releaseDelete = () => {
            deleteInFlight.current = false;
        };
        deleteInFlight.current = true;
        setDialogBusy(true);
        try {
            setDialogError('');
            await api.deleteProject(dialog.id);
            setDialog(null);
            setNote(communityText('Project deleted.'));
            refresh();
        } catch (e) {
            setDialogError(e.message || 'Could not delete.');
        } finally {
            releaseDelete();
            setDialogBusy(false);
        }
    };

    if (error) {
        return (
            <div>
                <Notice variant="error" className={styles.notice}>{error}</Notice>
                <Button onClick={onBack}>
                    <ArrowLeft size={15} />
                    {communityText('Back to list')}
                </Button>
            </div>
        );
    }
    if (!data) return <StatusMessage>{communityText('Loading user details…')}</StatusMessage>;

    return (
        <div>
            <AdminActionDialog
                dialog={dialog}
                busy={dialogBusy}
                error={dialogError}
                onChange={() => {}}
                onCancel={() => {
                    if (!deleteInFlight.current) setDialog(null);
                }}
                onConfirm={confirmDeleteProject}
            />
            <Button className={styles.backButton} onClick={onBack}>
                <ArrowLeft size={15} />
                {communityText('Back to list')}
            </Button>
            <div className={styles.userCard}>
                <div className={styles.userHead}>
                    <Avatar username={data.username} size={44} />
                    <div className={styles.rowInfo}>
                        <span className={styles.rowTitle}>
                            <Link to={`/users/${data.username}`}>{`@${data.username}`}</Link>
                            {data.admin ? <span className={styles.badge}>{communityText('admin')}</span> : null}
                            <span className={styles.badge}>{(data.standing && data.standing.level) || communityText('good')}</span>
                        </span>
                        <span className={styles.rowMeta}>
                            {communityText('{value1} followers · {value2} following', {value1: data.followerCount || 0, value2: data.followingCount || 0})}
                        </span>
                    </div>
                </div>

                <label className={styles.fieldLabel}>{communityText('Account standing')}</label>
                <div className={styles.field}>
                    <select className={styles.select} value={level} onChange={e => setLevel(e.target.value)}>
                        {STANDING_LEVELS.map(l => (
                            <option key={l} value={l}>{l}</option>
                        ))}
                    </select>
                    <input
                        className={styles.input}
                        placeholder={communityText('Reason (shown to the user)')}
                        value={reasonText}
                        onChange={e => setReasonText(e.target.value)}
                    />
                    <Button onClick={applyStanding}>{communityText('Apply')}</Button>
                </div>

                <label className={styles.fieldLabel}>{communityText('Send a message to their notifications')}</label>
                <div className={styles.field}>
                    <input
                        className={styles.input}
                        placeholder={communityText('Message')}
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                    />
                    <Button disabled={!message.trim()} onClick={sendMessage}>{communityText('Send')}</Button>
                </div>

                <Button className={styles.inlineAction} onClick={toggleComments}>
                    {data.commentsOff ? communityText('Enable profile comments') : communityText('Disable profile comments')}
                </Button>

                {data.quota ? (
                    <div className={styles.quota}>
                        <span className={styles.fieldLabel}>{communityText('Storage')}</span>
                        <span className={styles.quotaBar}>
                            <span className={styles.quotaFillBg}>
                                <span
                                    className={styles.quotaFill}
                                    style={{width: `${Math.min(100, (data.quota.used / data.quota.limit) * 100)}%`}}
                                />
                            </span>
                            <span className={styles.quotaText}>
                                {communityText('{value1} of {value2}', {value1: formatBytes(data.quota.used), value2: formatBytes(data.quota.limit)})}
                            </span>
                        </span>
                    </div>
                ) : null}

                {(data.projects || []).length ? (
                    <div className={styles.list}>
                        {data.projects.map(project => (
                            <div key={project.id} className={styles.row}>
                                <div className={styles.rowInfo}>
                                    <span className={styles.rowTitle}>
                                        <Link to={projectUrl(project)}>{project.title || project.id}</Link>
                                    </span>
                                    <span className={styles.rowMeta}>
                                        {project.shared ? communityText('Shared') : communityText('Not shared')}
                                    </span>
                                </div>
                                <div className={styles.rowActions}>
                                    {project.shared ? (
                                        <Button onClick={() => unshareProject(project.id)}>{communityText('Unshare')}</Button>
                                    ) : null}
                                    <Button variant="danger" onClick={() => deleteProject(project.id)}>{communityText('Delete')}</Button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : null}

                {note ? <Notice variant="success">{note}</Notice> : null}
            </div>
        </div>
    );
};

export default UserDetailCard;
