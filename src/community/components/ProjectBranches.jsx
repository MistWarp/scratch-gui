/* eslint-disable max-len */
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {GitBranch, GitMerge} from 'lucide-react';
import api from '../api.js';
import {formatDate} from '../format.js';
import {buildProjectArtifactsFromFileEntries} from '../../lib/git/mwp.js';
import Button from './ui/Button.jsx';
import styles from './ProjectBranches.module.css';

const decodeBase64 = value => {
    const binary = atob(value || '');
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);
    return bytes;
};

export const materializeBranchMerge = async data => {
    const tree = await api.commitTree(data.targetProjectId, data.targetHead);
    const loaded = await Promise.all((tree.files || []).map(async file => {
        const result = await api.commitFile(data.targetProjectId, data.targetHead, file.path);
        return [file.path, decodeBase64(result.content)];
    }));
    const files = new Map(loaded);
    const conflicts = [];
    const binaryConflicts = [];
    for (const change of data.merge.changes || []) {
        if (change.conflict && change.binary) {
            binaryConflicts.push({...change, choice: ''});
            continue;
        }
        if (change.deleted) files.delete(change.path);
        else files.set(change.path, decodeBase64(change.content));
        if (change.conflict) {
            conflicts.push({path: change.path, content: new TextDecoder().decode(decodeBase64(change.content))});
        }
    }
    return {files, conflicts, binaryConflicts};
};

const ProjectBranches = ({id, canMerge, onMerged}) => {
    const [data, setData] = useState(null);
    const [source, setSource] = useState('');
    const [target, setTarget] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [session, setSession] = useState(null);

    const load = useCallback(() => api.branches(id).then(result => {
        setData(result);
        const branches = result.branches || [];
        const main = branches.find(branch => branch.name === 'main');
        const current = branches.find(branch => branch.current);
        setTarget(previous => (branches.some(branch => branch.name === previous) ? previous : (main || current || branches[0] || {}).name || ''));
        setSource(previous => (branches.some(branch => branch.name === previous) && previous !== (main || {}).name ? previous : (branches.find(branch => branch.name !== (main || current || branches[0] || {}).name) || {}).name || ''));
    }).catch(loadError => {
        setData({branches: []});
        setError(loadError.message || 'Could not load branches.');
    }), [id]);

    useEffect(() => {
        setData(null);
        setSession(null);
        setError('');
        setNotice('');
        load();
    }, [load]);

    const branches = data?.branches || [];
    const availableSources = useMemo(() => branches.filter(branch => branch.name !== target), [branches, target]);

    useEffect(() => {
        if (source === target) setSource((availableSources[0] || {}).name || '');
    }, [availableSources, source, target]);

    const upload = async (mergeData, files) => {
        const artifacts = await buildProjectArtifactsFromFileEntries(
            [...files].map(([path, fileData]) => ({path, data: fileData}))
        );
        await api.uploadBranchMerge(id, {
            sb3: artifacts.sb3,
            mergeTree: artifacts.tree,
            sourceBranch: mergeData.sourceBranch,
            targetBranch: mergeData.targetBranch,
            sourceHead: mergeData.sourceHead,
            targetHead: mergeData.targetHead
        });
        setSession(null);
        setNotice(`Merged ${mergeData.sourceBranch} into ${mergeData.targetBranch}.`);
        await Promise.all([load(), onMerged ? onMerged() : Promise.resolve()]);
    };

    const merge = async () => {
        if (!source || !target || source === target || busy) return;
        setBusy(true);
        setError('');
        setNotice('');
        try {
            const mergeData = await api.mergeBranches(id, source, target);
            if (mergeData.merge.alreadyMerged) {
                setNotice(`${source} is already included in ${target}.`);
                return;
            }
            const prepared = await materializeBranchMerge(mergeData);
            if (prepared.conflicts.length || prepared.binaryConflicts.length) {
                setSession({...prepared, data: mergeData});
            } else {
                await upload(mergeData, prepared.files);
            }
        } catch (mergeError) {
            setError(mergeError.message || 'Could not merge the branches.');
        } finally {
            setBusy(false);
        }
    };

    const resolve = async () => {
        if (!session || busy) return;
        setBusy(true);
        setError('');
        try {
            const files = new Map(session.files);
            for (const file of session.conflicts) files.set(file.path, new TextEncoder().encode(file.content));
            for (const file of session.binaryConflicts) {
                if (!file.choice) throw new Error(`Choose a version for ${file.path}.`);
                const useSource = file.choice === 'source';
                const deleted = useSource ? file.theirsDeleted : file.oursDeleted;
                const content = useSource ? file.theirs : file.ours;
                if (deleted) files.delete(file.path);
                else files.set(file.path, decodeBase64(content));
            }
            await upload(session.data, files);
        } catch (resolveError) {
            setError(resolveError.message || 'Could not resolve the merge.');
        } finally {
            setBusy(false);
        }
    };

    const updateText = (path, content) => setSession(current => ({
        ...current,
        conflicts: current.conflicts.map(file => (file.path === path ? {...file, content} : file))
    }));
    const chooseBinary = (path, choice) => setSession(current => ({
        ...current,
        binaryConflicts: current.binaryConflicts.map(file => (file.path === path ? {...file, choice} : file))
    }));

    if (!data) return <div className={styles.state}>Loading branches…</div>;

    return (
        <div className={styles.panel}>
            <header className={styles.header}>
                <div>
                    <h2><GitBranch size={19} /> Branches</h2>
                    <p>Each branch points to its latest saved project version.</p>
                </div>
            </header>

            {canMerge && branches.length > 1 ? (
                <section className={styles.mergeBox}>
                    <div className={styles.mergeFields}>
                        <label>Merge <select value={source} onChange={event => setSource(event.target.value)}>{availableSources.map(branch => <option key={branch.name}>{branch.name}</option>)}</select></label>
                        <span>into</span>
                        <label><span className={styles.srOnly}>Target branch</span><select value={target} onChange={event => setTarget(event.target.value)}>{branches.map(branch => <option key={branch.name}>{branch.name}</option>)}</select></label>
                        <Button variant="primary" onClick={merge} busy={busy} busyLabel="Merging…" disabled={!source || !target}><GitMerge size={16} /> Merge branches</Button>
                    </div>
                    <p>The project switches to the target branch after the merge.</p>
                </section>
            ) : null}

            {error ? <p className={styles.error}>{error}</p> : null}
            {notice ? <p className={styles.notice}>{notice}</p> : null}

            {session ? (
                <section className={styles.conflicts}>
                    <h3>Resolve merge conflicts</h3>
                    <p>Edit text conflicts and choose which branch to keep for assets.</p>
                    {session.conflicts.map(file => (
                        <label key={file.path}><span>{file.path}</span><textarea value={file.content} disabled={busy} onChange={event => updateText(file.path, event.target.value)} /></label>
                    ))}
                    {session.binaryConflicts.map(file => (
                        <div className={styles.binaryConflict} key={file.path}>
                            <span>{file.path}</span>
                            <button className={file.choice === 'target' ? styles.choiceActive : ''} onClick={() => chooseBinary(file.path, 'target')}>Keep {session.data.targetBranch}</button>
                            <button className={file.choice === 'source' ? styles.choiceActive : ''} onClick={() => chooseBinary(file.path, 'source')}>Use {session.data.sourceBranch}</button>
                        </div>
                    ))}
                    <Button variant="primary" busy={busy} busyLabel="Merging…" onClick={resolve}>Save resolutions and merge</Button>
                </section>
            ) : null}

            <div className={styles.list}>
                {branches.map(branch => (
                    <article className={styles.branch} key={branch.name}>
                        <GitBranch size={18} />
                        <div><strong>{branch.name}</strong>{branch.message ? <span>{branch.message}</span> : null}</div>
                        <code>{branch.head.slice(0, 7)}</code>
                        {branch.date ? <time>{formatDate(branch.date)}</time> : null}
                        {branch.current ? <span className={styles.current}>Current</span> : null}
                    </article>
                ))}
                {!branches.length ? <p className={styles.state}>This project does not have saved branch history yet.</p> : null}
            </div>
        </div>
    );
};

export default ProjectBranches;
