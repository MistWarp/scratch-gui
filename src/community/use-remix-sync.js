import {useCallback, useEffect, useRef, useState} from 'react';
import {useCommunityIntl as useCommunityText} from './i18n.jsx';
import api from './api';
import {buildProjectArtifactsFromFileEntries} from '../lib/git/mwp.js';
import {
    materializeMerge, resolvedMergeFiles, unresolvedBinaryConflict, unresolvedTextConflict,
    withBinaryChoice, withTextResolution
} from './merge-session.js';
import {remixParentLabel} from './remix-origin.js';

const RESTART_CODES = ['head_changed', 'original_changed'];

const useRemixSync = ({projectId, remixFrom, onSynced}) => {
    const {text: communityText} = useCommunityText();
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [session, setSession] = useState(null);
    const currentProject = useRef(projectId);
    const mounted = useRef(true);
    const onSyncedRef = useRef(onSynced);
    onSyncedRef.current = onSynced;
    const original = remixParentLabel(remixFrom);

    useEffect(() => () => {
        mounted.current = false;
    }, []);

    useEffect(() => {
        currentProject.current = projectId;
        setBusy(false);
        setError('');
        setNotice('');
        setSession(null);
    }, [projectId]);

    const stillFor = startedFor => mounted.current && currentProject.current === startedFor;
    const refresh = async () => {
        if (onSyncedRef.current) await onSyncedRef.current();
    };

    const errorMessage = syncError => {
        if (syncError.code === 'uncommitted_changes') {
            return communityText('Commit your saved changes in the editor before syncing, so they are not replaced.');
        }
        if (syncError.code === 'head_changed') {
            return communityText('This remix changed while it was syncing. Sync again to include the new changes.');
        }
        if (syncError.code === 'original_changed') {
            return communityText(
                '{value1} changed while this remix was syncing. Sync again to get its latest changes.',
                {value1: original}
            );
        }
        if (syncError.code === 'sync_history_unavailable') {
            return communityText('Both projects need saved commits before this remix can be synced.');
        }
        if (syncError.code === 'sync_unavailable') {
            if (syncError.message && syncError.message.includes('do not share a common commit')) {
                return communityText(
                    'This remix no longer shares any commits with {value1}, so it cannot be synced.',
                    {value1: original}
                );
            }
            return communityText('Could not sync this remix.');
        }
        if (syncError.status === 404) {
            return communityText('The original project for this remix no longer exists, so it cannot be synced.');
        }
        if (syncError.status === 403) {
            return communityText(
                'Only maintainers of this remix can sync it, and only while they can see inside {value1}.',
                {value1: original}
            );
        }
        return syncError.message || communityText('Could not sync this remix.');
    };

    const fail = async (syncError, startedFor) => {
        if (!stillFor(startedFor)) return;
        setError(errorMessage(syncError));
        if (RESTART_CODES.includes(syncError.code) || syncError.status === 404) {
            setSession(null);
            await refresh();
        }
    };

    const upload = async (data, files, startedFor) => {
        const artifacts = await buildProjectArtifactsFromFileEntries(
            [...files].map(([path, fileData]) => ({path, data: fileData}))
        );
        if (!stillFor(startedFor)) return;
        await api.uploadRemixSync(startedFor, {
            sb3: artifacts.sb3,
            mergeTree: artifacts.tree,
            expectedHead: data.expectedHead,
            syncHead: data.sourceHead
        });
        if (!stillFor(startedFor)) return;
        setSession(null);
        setNotice(communityText('Brought in the latest changes from {value1}.', {value1: original}));
        await refresh();
    };

    const sync = async () => {
        if (busy || session) return;
        const startedFor = projectId;
        setBusy(true);
        setError('');
        setNotice('');
        try {
            const data = await api.syncRemix(startedFor);
            if (!stillFor(startedFor)) return;
            if (data.merge.alreadyMerged) {
                setNotice(communityText('This remix already has every change from {value1}.', {value1: original}));
                await refresh();
                return;
            }
            const prepared = await materializeMerge(data);
            if (!stillFor(startedFor)) return;
            if (prepared.conflicts.length || prepared.binaryConflicts.length) {
                setSession({...prepared, data});
            } else {
                await upload(data, prepared.files, startedFor);
            }
        } catch (syncError) {
            await fail(syncError, startedFor);
        } finally {
            if (stillFor(startedFor)) setBusy(false);
        }
    };

    const resolve = async () => {
        if (!session || busy) return;
        const startedFor = projectId;
        setBusy(true);
        setError('');
        try {
            const unresolvedText = unresolvedTextConflict(session);
            if (unresolvedText) {
                setError(communityText('Resolve the conflict in {value1}.', {value1: unresolvedText.path}));
                return;
            }
            const unresolved = unresolvedBinaryConflict(session);
            if (unresolved) {
                setError(communityText('Choose a version for {value1}.', {value1: unresolved.path}));
                return;
            }
            await upload(session.data, resolvedMergeFiles(session), startedFor);
        } catch (resolveError) {
            await fail(resolveError, startedFor);
        } finally {
            if (stillFor(startedFor)) setBusy(false);
        }
    };

    const cancel = useCallback(() => {
        setSession(null);
        setError('');
    }, []);
    const updateText = useCallback((path, content) => {
        setSession(current => (current ? withTextResolution(current, path, content) : current));
    }, []);
    const chooseBinary = useCallback((path, choice) => {
        setSession(current => (current ? withBinaryChoice(current, path, choice) : current));
    }, []);
    const dismissNotice = useCallback(() => setNotice(''), []);

    return {busy, error, notice, session, sync, resolve, cancel, updateText, chooseBinary, dismissNotice};
};

export default useRemixSync;
