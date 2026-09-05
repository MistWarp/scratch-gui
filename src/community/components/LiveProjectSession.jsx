import React, {useEffect, useState} from 'react';
import PropTypes from 'prop-types';
import api, {editorUrl} from '../api';
import styles from '../pages/Project.module.css';

const LiveProjectSession = ({project}) => {
    const [session, setSession] = useState(null);
    const [editors, setEditors] = useState([]);
    const [unavailable, setUnavailable] = useState(false);
    useEffect(() => {
        let disposed = false;
        let timer;
        setSession(null);
        setEditors([]);
        setUnavailable(false);
        if (!project.myRole) return () => {};
        const refresh = async () => {
            try {
                const result = await api.request(`/projects/${encodeURIComponent(project.id)}/live`, {
                    method: 'POST', body: {action: 'list', allBranches: true}, cache: false
                });
                if (!disposed) {
                    setUnavailable(false);
                    setSession(result.session.id ? result.session : null);
                    setEditors(result.editors || []);
                }
            } catch (e) {
                if (!disposed) {
                    setUnavailable(true);
                    setSession(null);
                    setEditors([]);
                }
            } finally {
                if (!disposed) timer = setTimeout(refresh, 10000);
            }
        };
        refresh();
        return () => {
            disposed = true;
            clearTimeout(timer);
        };
    }, [project.id, project.myRole]);
    if (unavailable) {
        return (<div className={styles.visibilityNotice} role="status">
            {'Could not check who is online. Retrying…'}
        </div>);
    }
    if (!session && !editors.length) return null;
    const otherBranches = editors.filter(editor => editor.branch !== (session?.branch || project.gitBranch || 'main'));
    const names = editors.map(editor => `${editor.username} on ${editor.branch}`).join(', ');
    return (
        <div className={styles.visibilityNotice}>
            <span>{session?.public ? `${session.host} has opened a live session on ${session.branch}.` :
                `${names || session.host} working on this project.`}</span>
            <a href={editorUrl({platformProject: project.id}).replace('#', '?collaborate=1#')}>
                {session?.public ? 'View live session' : 'Open collaboration options'}
            </a>
            {otherBranches.length > 0 && <a
                href={editorUrl({platformProject: project.id}).replace('#', '?branches=1#')}
            >{'Open branches…'}</a>}
        </div>
    );
};

LiveProjectSession.propTypes = {project: PropTypes.object.isRequired};
export default LiveProjectSession;
