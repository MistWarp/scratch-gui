import {useEffect, useRef} from 'react';
import {sameUser} from '../../format';
import projectRealtime from '../../project-realtime.js';

// Live heart, broken heart and save counts for the open project. The viewer's own
// reaction and saved state follow too, when the event says they made the change.
const useProjectRealtime = (id, viewerName, setProject) => {
    const realtimeViewer = useRef(viewerName);
    realtimeViewer.current = viewerName;

    useEffect(() => {
        if (!id) return () => {};
        const accessKey = new URLSearchParams(window.location.search).get('k') || '';
        return projectRealtime.subscribe(id, event => {
            if (event.type !== 'project_stats') return;
            setProject(current => {
                if (!current || String(current.id) !== String(event.projectId)) return current;
                const next = {
                    ...current,
                    loveCount: Number(event.hearts) || 0,
                    brokenHeartCount: Number(event.brokenHearts) || 0,
                    saveCount: Number(event.saves) || 0
                };
                if (sameUser(event.actor, realtimeViewer.current)) {
                    if (Object.prototype.hasOwnProperty.call(event, 'reaction')) {
                        next.myReaction = event.reaction || '';
                    }
                    if (Object.prototype.hasOwnProperty.call(event, 'saved')) {
                        next.saved = Boolean(event.saved);
                    }
                }
                return next;
            });
        }, accessKey);
    }, [id]);

    useEffect(() => {
        projectRealtime.refreshAuth();
    }, [viewerName]);
};

export default useProjectRealtime;
