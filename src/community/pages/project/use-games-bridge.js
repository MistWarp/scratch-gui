import {useEffect, useState} from 'react';
import api from '../../api';
import {MULTIPLAYER_ENABLED} from '../../../lib/mistwarp-games/config.js';
import {
    loadProjectSave,
    saveProjectData,
    loadProjectInventory,
    grantProjectItem
} from '../../../lib/mistwarp-games/data-client.js';
import {isProjectPromptBlocked} from '../../../lib/project-prompt-blocking.js';

const useGamesBridge = (gamesProjectId, userLoading, gamesUserMessage, stageFrame) => {
    const [gameMarketplace, setGameMarketplace] = useState(null);

    // MistWarp Games bridge for the sandboxed project player. Authentication
    // and short-lived save capabilities remain on this trusted project page;
    // project code only receives the result of the narrow operation it asked
    // for. Production saves are therefore separate from editor test saves.
    useEffect(() => {
        const projectId = gamesProjectId;
        if (!projectId) return;
        const reply = (source, payload) => {
            try {
                source.postMessage({type: 'mw:games-result', ...payload}, '*');
            } catch (e) {
                // ignore a player frame which navigated away during a request
            }
        };
        const onMessage = async event => {
            const frame = stageFrame.current;
            if (!frame || event.source !== frame.contentWindow) return;
            const data = event.data;
            if (!data || data.type !== 'mw:games') return;
            if (data.kind === 'hello') {
                if (!userLoading) {
                    try {
                        event.source.postMessage(gamesUserMessage, '*');
                    } catch (e) {
                        // ignore
                    }
                }
                return;
            }
            if (data.kind !== 'call') return;
            if (data.method === 'marketplace.open' || data.method === 'marketplace.purchase') {
                if (isProjectPromptBlocked({id: projectId})) {
                    reply(event.source, {id: data.id, ok: true, result: {status: 'blocked'}});
                    return;
                }
                setGameMarketplace({
                    projectId,
                    productId: data.method === 'marketplace.purchase' ? String((data.args && data.args[0]) || '') : '',
                    onResult: result => reply(event.source, {id: data.id, ok: true, result})
                });
                return;
            }
            try {
                let result;
                if (data.method === 'data.load') {
                    result = await loadProjectSave(projectId, 'play');
                } else if (data.method === 'data.save') {
                    result = await saveProjectData(projectId, 'play', data.args && data.args[0]);
                } else if (data.method === 'inventory.load') {
                    result = await loadProjectInventory(projectId, 'play');
                } else if (data.method === 'inventory.grant') {
                    const request = (data.args && data.args[0]) || {};
                    result = await grantProjectItem(projectId, 'play', request.item, request.requestId);
                } else if (data.method === 'multiplayer.connect') {
                    result = {
                        connected: false,
                        self: '',
                        players: [],
                        status: MULTIPLAYER_ENABLED ? 'multiplayer unavailable' : 'multiplayer disabled'
                    };
                } else if (data.method === 'multiplayer.disconnect') {
                    result = {connected: false};
                } else if (data.method === 'multiplayer.players') {
                    result = [];
                } else if (data.method === 'multiplayer.setState') {
                    result = false;
                } else if (data.method === 'multiplayer.sendEvent') {
                    result = false;
                } else if (data.method === 'marketplace.owns') {
                    const owned = await api.ownsGameProduct(projectId, String((data.args && data.args[0]) || ''));
                    result = owned.owned;
                } else {
                    throw new Error(`MistWarp Games method is not available: ${data.method}`);
                }
                reply(event.source, {id: data.id, ok: true, result});
            } catch (e) {
                reply(event.source, {
                    id: data.id,
                    ok: false,
                    error: String((e && e.message) || e)
                });
            }
        };
        window.addEventListener('message', onMessage);
        try {
            const frame = stageFrame.current;
            if (!userLoading && frame && frame.contentWindow) {
                frame.contentWindow.postMessage(gamesUserMessage, '*');
            }
        } catch (e) {
            // ignore
        }
        return () => {
            window.removeEventListener('message', onMessage);
        };
    }, [gamesProjectId, userLoading, gamesUserMessage]);

    return {gameMarketplace, setGameMarketplace};
};

export default useGamesBridge;
