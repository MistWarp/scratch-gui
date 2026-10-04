import {useEffect, useRef, useState} from 'react';
import {
    hasFullGrant, commitGrant, callRotur, grantedScopesFor,
    activityAllowed, rememberActivityDecision
} from '../../../lib/rotur/extension-bridge.js';
import {
    authorizeProjectCall, grantsSilently, validateProjectScopes
} from '../../../lib/rotur/project-methods.js';
import {getRoturSettings, setRoturSetting} from '../../../lib/rotur/settings.js';
import ProjectActivityScope from '../../../lib/rotur/project-activity-scope.js';
import {blockProjectPrompts, isProjectPromptBlocked} from '../../../lib/project-prompt-blocking.js';

const useRoturBridge = ({id, project, user, userLoading, userMessage, gamesProjectId, stageFrame}) => {
    const roturActivityScope = useRef(null);
    const [roturModal, setRoturModal] = useState(null);


    useEffect(() => {
        const scope = new ProjectActivityScope(callRotur);
        roturActivityScope.current = scope;
        return () => {
            if (roturActivityScope.current === scope) roturActivityScope.current = null;
            scope.clear();
        };
    }, [id]);

    // Rotur bridge for the embedded player. The project iframe cannot hold the
    // token or render trusted UI, so its Rotur blocks post requests up here; this
    // page holds the token (via lib/rotur/client) and renders consent/confirm UI
    // that the sandboxed project cannot read or approve on its own.
    useEffect(() => {
        const identity = userMessage.user;
        const onMessage = async event => {
            const frame = stageFrame.current;
            if (!frame || event.source !== frame.contentWindow) return;
            const data = event.data;
            if (!data || data.type !== 'mw:rotur') return;
            const source = event.source;
            const reply = payload => {
                try {
                    source.postMessage({type: 'mw:rotur-result', ...payload}, '*');
                } catch (e) {
                    // ignore
                }
            };

            if (data.kind === 'hello') {
                // While identity is still restoring, stay silent: answering now
                // would settle the embed's cache as logged-out. The proactive
                // push below runs once loading finishes and answers instead.
                if (userLoading) return;
                try {
                    source.postMessage(userMessage, '*');
                } catch (e) {
                    // ignore
                }
                return;
            }

            // The grant key, the project name and whether to ask all come from
            // this page. Anything the frame sends besides the scopes and the
            // method is ignored, because custom extensions can post here too.
            const meta = {
                projectId: gamesProjectId,
                name: (project && (project.title || project.name)) || ''
            };

            if (data.kind === 'consent') {
                const scopes = validateProjectScopes(data.scopes);
                if (!scopes) {
                    reply({id: data.id, ok: false, error: 'Projects cannot ask for that Rotur permission'});
                    return;
                }
                if (!identity.loggedIn) {
                    reply({id: data.id, ok: true, result: false});
                    return;
                }
                if (hasFullGrant(meta, scopes)) {
                    reply({id: data.id, ok: true, result: true});
                    return;
                }
                if (grantsSilently(scopes)) {
                    try {
                        await commitGrant(meta, scopes);
                        reply({id: data.id, ok: true, result: true});
                    } catch (e) {
                        reply({id: data.id, ok: false, error: String((e && e.message) || e)});
                    }
                    return;
                }
                if (isProjectPromptBlocked({id: gamesProjectId})) {
                    reply({id: data.id, ok: true, result: false});
                    return;
                }
                setRoturModal({
                    type: 'consent',
                    data: {scopes, username: identity.username, name: meta.name},
                    onAllow: async () => {
                        setRoturModal(null);
                        try {
                            await commitGrant(meta, scopes);
                            reply({id: data.id, ok: true, result: true});
                        } catch (e) {
                            reply({id: data.id, ok: false, error: String((e && e.message) || e)});
                        }
                    },
                    onDeny: () => {
                        setRoturModal(null);
                        reply({id: data.id, ok: true, result: false});
                    },
                    onBlock: () => {
                        blockProjectPrompts({id: gamesProjectId});
                        setRoturModal(null);
                        reply({id: data.id, ok: true, result: false});
                    }
                });
                return;
            }

            if (data.kind === 'call') {
                const method = data.method;
                let call;
                try {
                    if (!identity.loggedIn) throw new Error('Log in to Rotur to use this block');
                    call = authorizeProjectCall(method, data.args, grantedScopesFor(meta), gamesProjectId);
                } catch (e) {
                    reply({id: data.id, ok: false, error: String((e && e.message) || e)});
                    return;
                }
                const args = call.args;
                const perform = async () => {
                    try {
                        const scope = roturActivityScope.current;
                        const result = scope ? await scope.call(method, args) : await callRotur(method, args);
                        reply({id: data.id, ok: true, result});
                    } catch (e) {
                        reply({id: data.id, ok: false, error: String((e && e.message) || e)});
                    }
                };
                if (call.spec.activity) {
                    const key = (project && project.id) || id || `name:${(project && project.title) || ''}`;
                    const decision = activityAllowed(getRoturSettings().activitySharing, key);
                    if (decision === true) {
                        perform();
                        return;
                    }
                    if (decision === false) {
                        reply({id: data.id, ok: true, result: ''});
                        return;
                    }
                    if (isProjectPromptBlocked({id: gamesProjectId})) {
                        reply({id: data.id, ok: true, result: ''});
                        return;
                    }
                    setRoturModal({
                        type: 'share',
                        data: {username: identity.username, name: (project && project.title) || ''},
                        onShareThis: () => {
                            setRoturModal(null);
                            rememberActivityDecision(key, true);
                            perform();
                        },
                        onShareAll: () => {
                            setRoturModal(null);
                            setRoturSetting('activitySharing', 'all');
                            perform();
                        },
                        onShareNo: () => {
                            setRoturModal(null);
                            rememberActivityDecision(key, false);
                            reply({id: data.id, ok: true, result: ''});
                        },
                        onBlock: () => {
                            blockProjectPrompts({id: gamesProjectId});
                            setRoturModal(null);
                            rememberActivityDecision(key, false);
                            reply({id: data.id, ok: true, result: ''});
                        }
                    });
                    return;
                }
                if (call.confirm) {
                    if (isProjectPromptBlocked({id: gamesProjectId})) {
                        reply({id: data.id, ok: false, error: 'You blocked prompts from this project'});
                        return;
                    }
                    setRoturModal({
                        type: 'confirm',
                        data: {
                            label: call.confirm.label,
                            confirmation: call.confirm.confirmation || null,
                            username: identity.username
                        },
                        onAllow: () => {
                            setRoturModal(null);
                            perform();
                        },
                        onDeny: () => {
                            setRoturModal(null);
                            reply({id: data.id, ok: false, error: 'You cancelled this Rotur action'});
                        },
                        onBlock: () => {
                            blockProjectPrompts({id: gamesProjectId});
                            setRoturModal(null);
                            reply({id: data.id, ok: false, error: 'You blocked prompts from this project'});
                        }
                    });
                } else {
                    perform();
                }
            }
        };
        window.addEventListener('message', onMessage);
        // Push identity proactively so a login (or logout) after the embed has
        // loaded refreshes its cache, instead of waiting for a hello that only
        // fires once.
        try {
            const frame = stageFrame.current;
            if (!userLoading && frame && frame.contentWindow) {
                frame.contentWindow.postMessage(userMessage, '*');
            }
        } catch (e) {
            // ignore
        }
        return () => window.removeEventListener('message', onMessage);
    }, [user, userLoading, project, id, userMessage]);

    return roturModal;
};

export default useRoturBridge;
