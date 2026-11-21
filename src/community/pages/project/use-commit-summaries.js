import {useEffect, useRef, useState} from 'react';
import api from '../../api';
import {chunk, pendingSummaryShas} from '../../commit-summary.js';

const useCommitSummaries = (projectId, shas) => {
    const [summaries, setSummaries] = useState({});
    const requested = useRef({projectId: '', shas: new Set()});
    const mounted = useRef(true);
    useEffect(() => () => {
        mounted.current = false;
    }, []);
    const key = shas.join(',');
    useEffect(() => {
        if (requested.current.projectId !== projectId) {
            requested.current = {projectId, shas: new Set()};
            setSummaries({});
        }
        if (!projectId) return;
        const state = requested.current;
        const pending = pendingSummaryShas(shas, state.shas);
        if (!pending.length) return;
        pending.forEach(sha => state.shas.add(sha));
        const current = () => mounted.current && requested.current === state;
        (async () => {
            const batches = chunk(pending);
            for (let index = 0; index < batches.length; index++) {
                if (!current()) return;
                try {
                    const data = await api.commitSummaries(projectId, batches[index]);
                    const found = data && typeof data.summaries === 'object' ? data.summaries : null;
                    if (found && current()) setSummaries(known => ({...known, ...found}));
                } catch {
                    batches.slice(index).flat()
                        .forEach(sha => state.shas.delete(sha));
                    return;
                }
            }
        })();
    }, [projectId, key]);
    return summaries;
};

export default useCommitSummaries;
