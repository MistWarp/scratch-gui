import {useCallback, useRef, useState} from 'react';
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

    const canViewSource = canViewProjectSource(project);
    const loadHistory = useCallback(() => {
        if (!id || !canViewSource) return Promise.resolve();
        const fresh = beginHistoryLoad();
        return api.commits(id)
            .then(fresh(setVersionHistory))
            .catch(fresh(() => setVersionHistory({commits: [], error: true})));
    }, [beginHistoryLoad, canViewSource, id]);

    const refreshProjectAndHistory = useCallback(() => Promise.all([load(), loadHistory()]), [load, loadHistory]);

    const remixRefreshRef = useRef({id: '', task: null});
    const refreshRemixState = useCallback(() => {
        if (!id || !canViewSource) return Promise.resolve();
        if (remixRefreshRef.current.id === id && remixRefreshRef.current.task) return remixRefreshRef.current.task;
        const freshProject = beginLoad();
        const freshHistory = beginHistoryLoad();
        const task = Promise.allSettled([api.getProject(id), api.commits(id)])
            .then(([projectOutcome, historyOutcome]) => {
                const projectData = projectOutcome.status === 'fulfilled' ? projectOutcome.value : null;
                const historyData = historyOutcome.status === 'fulfilled' ? historyOutcome.value : null;
                if (projectData && projectData.project) {
                    freshProject(() => {
                        setProject(projectData.project);
                        setProjectLoadContext(id);
                    })();
                }
                if (historyData) {
                    freshHistory(() => setVersionHistory(historyData))();
                }
            })
            .then(() => {
                if (remixRefreshRef.current.task === task) remixRefreshRef.current = {id: '', task: null};
            });
        remixRefreshRef.current = {id, task};
        return task;
    }, [beginHistoryLoad, beginLoad, canViewSource, id]);

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
        refreshProjectAndHistory,
        refreshRemixState
    };
};

export default useProjectData;
