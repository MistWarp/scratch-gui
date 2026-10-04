import {useEffect, useState} from 'react';
import {preloadContent} from '../../../lib/community/cached-fetch.js';
import projectRealtime from '../../project-realtime.js';
import {track} from '../../analytics';
import {analyzeBlocks, getCustomExtensions} from './embed-helpers.js';

// What the player frame reports about the running project: its stage size, block count
// and custom extensions, plus whether the project file could be fetched at all and
// whether the viewer chose to run it outside the sandbox.
const useStageContent = (id, project, stageFrame) => {
    const [stageHeightRatio, setStageHeightRatio] = useState(3 / 4);
    const [blockStats, setBlockStats] = useState(null);
    const [customExtensions, setCustomExtensions] = useState([]);
    const [contentError, setContentError] = useState(false);
    const [unsandboxed, setUnsandboxed] = useState(false);
    const [confirmUnsandboxed, setConfirmUnsandboxed] = useState(false);

    useEffect(() => {
        const onMessage = event => {
            const frame = stageFrame.current;
            if (!frame || event.source !== frame.contentWindow) return;
            if (!event.data) return;
            if (event.data.type === 'mw:stage-size') {
                const width = Number(event.data.width);
                const height = Number(event.data.height);
                if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) {
                    setStageHeightRatio(height / width);
                }
                return;
            }
            if (event.data.type === 'mw:diagnostic') {
                projectRealtime.diagnostic(id, event.data.diagnostic);
                if (event.data.diagnostic && event.data.diagnostic.type === 'playtime_start') {
                    track('project_play_start', {project: id});
                }
            }
        };
        window.addEventListener('message', onMessage);
        return () => window.removeEventListener('message', onMessage);
    }, [id]);

    const projectJsonUrl = project && project.projectJsonUrl;
    useEffect(() => {
        setBlockStats(null);
        setCustomExtensions([]);
        setContentError(false);
        setUnsandboxed(false);
        setConfirmUnsandboxed(false);
        let active = true;
        if (projectJsonUrl) {
            preloadContent(projectJsonUrl).catch(() => {
                if (active) setContentError(true);
            });
        }
        return () => {
            active = false;
        };
    }, [projectJsonUrl]);

    useEffect(() => {
        let cancelled = false;
        const onMessage = event => {
            const frame = stageFrame.current;
            if (!frame || event.source !== frame.contentWindow) return;
            const data = event.data;
            if (!data || data.type !== 'mw:project-metadata') return;
            setBlockStats(analyzeBlocks(data.blockStats));
            getCustomExtensions(data.customExtensions, (project && project.trustedExtensions) || [])
                .then(urls => {
                    if (!cancelled) setCustomExtensions(urls);
                })
                .catch(() => {
                    if (!cancelled) setCustomExtensions([]);
                });
        };
        window.addEventListener('message', onMessage);
        return () => {
            cancelled = true;
            window.removeEventListener('message', onMessage);
        };
    }, [projectJsonUrl, project && project.trustedExtensions]);

    const runUnsandboxed = () => {
        setConfirmUnsandboxed(true);
    };
    const confirmRunUnsandboxed = () => {
        setConfirmUnsandboxed(false);
        setUnsandboxed(true);
    };

    return {
        stageHeightRatio,
        setStageHeightRatio,
        blockStats,
        customExtensions,
        contentError,
        unsandboxed,
        setUnsandboxed,
        confirmUnsandboxed,
        setConfirmUnsandboxed,
        runUnsandboxed,
        confirmRunUnsandboxed
    };
};

export default useStageContent;
