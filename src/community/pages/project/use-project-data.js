import {useCallback, useState} from 'react';
import api from '../../api';
import {canViewProjectSource} from '../../project-source-access';
import useLatest from '../../use-latest.js';

// The project record and its version history, with the loaders that fetch them. Each
// load is tagged with the id it was made for, so a slow response for an earlier
// project cannot replace the one on screen.
const useProjectData = id => {
    const [project, setProject] = useState(null);
    const [projectLoadContext, setProjectLoadContext] = useState('');
    const [versionHistory, setVersionHistory] = useState(null);
    const [error, setError] = useState(null);
    const [errorLoadContext, setErrorLoadContext] = useState('');

    const beginLoad = useLatest();
    const beginHistoryLoad = useLatest();

    const load = useCallback(() => {
        if (!id) return Promise.resolve();
        const fresh = beginLoad();
        setError(null);
        setErrorLoadContext('');
        return api.getProject(id)
            .then(fresh(data => {
                if (!data || !data.project) throw new Error('Project response was incomplete.');
                setProject(data.project);
                setProjectLoadContext(id);
                setError(null);
            }))
            .catch(fresh(e => {
                setErrorLoadContext(id);
                setError(e && e.status === 404 ? 'Project not found.' : 'Could not load this project.');
            }));
    }, [id, beginLoad]);

    const loadHistory = useCallback(() => {
        if (!id || !canViewProjectSource(project)) return Promise.resolve();
        const fresh = beginHistoryLoad();
        return api.commits(id)
            .then(fresh(setVersionHistory))
            .catch(fresh(() => setVersionHistory({commits: [], error: true})));
    }, [beginHistoryLoad, id, project]);

    const refreshProjectAndHistory = useCallback(() => Promise.all([load(), loadHistory()]), [load, loadHistory]);

    return {
        project,
        setProject,
        projectLoadContext,
        setProjectLoadContext,
        versionHistory,
        setVersionHistory,
        error,
        setError,
        errorLoadContext,
        beginHistoryLoad,
        load,
        loadHistory,
        refreshProjectAndHistory
    };
};

export default useProjectData;
