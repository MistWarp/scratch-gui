import {useCallback, useMemo} from 'react';
import {themeCustomFor} from '../../api';
import {getUsernameOverride} from '../../../lib/rotur/cloud-sync.js';
import {useEmbedFetchBridge, useEmbedStorageBridge} from './use-embed-bridges.js';
import useGamesBridge from './use-games-bridge.js';
import useRoturBridge from './use-rotur-bridge.js';

// Everything the sandboxed player frame can ask this page for: project files, MistWarp
// Games saves and purchases, Rotur calls, storage, and who is signed in.
const usePlayerBridge = ({id, project, user, userLoading, stageFrame}) => {
    useEmbedFetchBridge(project, stageFrame);

    const userMessage = useMemo(() => ({
        type: 'mw:rotur-user',
        user: {
            loggedIn: Boolean(user && user.username),
            username: (user && user.username) || '',
            id: (user && user.id) || ''
        },
        displayName: user && user.username ? getUsernameOverride() || `@${user.username}` : '',
        projectId: (project && project.id) || id || '',
        projectName: (project && (project.title || project.name)) || '',
        projectImage: (project && project.thumbUrl) || ''
    }), [user, project, id]);

    const gamesUserMessage = useMemo(() => ({
        type: 'mw:games-user',
        user: userMessage.user
    }), [userMessage.user.loggedIn, userMessage.user.username, userMessage.user.id]);

    const gamesProjectId = String((project && project.id) || id || '');

    const {gameMarketplace, setGameMarketplace} = useGamesBridge(
        gamesProjectId, userLoading, gamesUserMessage, stageFrame
    );

    const roturModal = useRoturBridge({id, project, user, userLoading, userMessage, gamesProjectId, stageFrame});

    const sendThemeToStage = useCallback(() => {
        try {
            const frame = stageFrame.current;
            if (!frame || !frame.contentWindow) return;
            const theme = localStorage.getItem('tw:theme');
            frame.contentWindow.postMessage({
                type: 'mw:apply-theme',
                theme,
                customThemes: theme ? themeCustomFor(theme) : ''
            }, '*');
            if (!userLoading) {
                frame.contentWindow.postMessage(userMessage, '*');
            }
        } catch (e) {
            // ignore
        }
    }, [userLoading, userMessage]);

    useEmbedStorageBridge(project, stageFrame);

    return {roturModal, gameMarketplace, setGameMarketplace, sendThemeToStage};
};

export default usePlayerBridge;
