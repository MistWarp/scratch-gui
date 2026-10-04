import {useEffect} from 'react';
import {cachedFetchBuffer, preloadContent} from '../../../lib/community/cached-fetch.js';
import {clearProjectStorage, EMBED_STORAGE_PREFIX, isBlockedProjectStorageKey} from './embed-helpers.js';

// Serves the project file and its assets to the player frame from this page's cache.
export const useEmbedFetchBridge = (project, stageFrame) => {
    useEffect(() => {
        if (!project || !project.projectJsonUrl) return;
        preloadContent(project.projectJsonUrl).catch(() => null);
        const assetsBase = project.assetsBase ? `${project.assetsBase.replace(/\/+$/, '')}/` : null;
        const allowed = url => typeof url === 'string' &&
            (url === project.projectJsonUrl || (assetsBase && url.startsWith(assetsBase)));
        const onMessage = event => {
            const frame = stageFrame.current;
            if (!frame || event.source !== frame.contentWindow) return;
            const data = event.data;
            if (!data) return;
            if (data.type === 'mw:embed-ready') {
                cachedFetchBuffer(project.projectJsonUrl)
                    .then(buffer => {
                        try {
                            const copy = buffer.slice(0);
                            event.source.postMessage({
                                type: 'mw:preload-resource',
                                url: project.projectJsonUrl,
                                buffer: copy
                            }, '*', [copy]);
                        } catch (e) {
                            // ignore
                        }
                    })
                    .catch(() => null);
                return;
            }
            if (data.type !== 'mw:fetch' || !allowed(data.url)) return;
            const reply = (message, transfer) => {
                try {
                    event.source.postMessage(message, '*', transfer);
                } catch (e) {
                    // ignore
                }
            };
            cachedFetchBuffer(data.url)
                .then(buffer => reply({type: 'mw:fetch-result', id: data.id, buffer}, [buffer]))
                .catch(() => reply({type: 'mw:fetch-result', id: data.id}));
        };
        window.addEventListener('message', onMessage);
        return () => window.removeEventListener('message', onMessage);
    }, [project]);
};

// Keeps the sandboxed player's saved data in this page's storage, under a prefix for the project.
export const useEmbedStorageBridge = (project, stageFrame) => {
    useEffect(() => {
        if (!project || !project.id) return;
        const projectId = String(project.id);
        const onMessage = event => {
            const frame = stageFrame.current;
            if (!frame || event.source !== frame.contentWindow) return;
            const data = event.data;
            if (!data || typeof data.type !== 'string') return;
            if (data.storageProject && String(data.storageProject) !== projectId) return;
            if (data.type === 'mw:storage-clear') {
                clearProjectStorage(projectId);
                return;
            }
            if (data.type !== 'mw:storage-set' && data.type !== 'mw:storage-remove') return;
            const key = typeof data.key === 'string' ? data.key : '';
            if (!key) return;
            if (isBlockedProjectStorageKey(key)) return;
            const storageKey = `${EMBED_STORAGE_PREFIX}${projectId}:${key}`;
            try {
                if (data.type === 'mw:storage-set') {
                    if (!Object.prototype.hasOwnProperty.call(data, 'value')) return;
                    localStorage.setItem(storageKey, String(data.value));
                    return;
                }
                localStorage.removeItem(storageKey);
            } catch (e) {
                // ignore
            }
        };
        window.addEventListener('message', onMessage);
        return () => window.removeEventListener('message', onMessage);
    }, [project && project.id]);
};
