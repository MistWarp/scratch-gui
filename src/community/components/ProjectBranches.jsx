/* eslint-disable max-len */
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Check, GitBranch, GitMerge, Pencil, Plus, Trash2, X} from 'lucide-react';
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

const ProjectBranches = ({id, canManage, onChange}) => {
    const [data, setData] = useState(null);
    const [source, setSource] = useState('');
    const [target, setTarget] = useState('');
    const [newBranch, setNewBranch] = useState('');
    const [newBranchFrom, setNewBranchFrom] = useState('');
    const [editingBranch, setEditingBranch] = useState('');
    const [renamedBranch, setRenamedBranch] = useState('');
    const [deletingBranch, setDeletingBranch] = useState('');
    const [busy, setBusy] = useState('');
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
        setNewBranchFrom(previous => (branches.some(branch => branch.name === previous) ? previous : (current || main || branches[0] || {}).name || ''));
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
        await Promise.all([load(), onChange ? onChange() : Promise.resolve()]);
    };

    const merge = async () => {
        if (!source || !target || source === target || busy) return;
        setBusy('merge');
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
            setBusy('');
        }
    };

    const resolve = async () => {
        if (!session || busy) return;
        setBusy('merge');
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
            setBusy('');
        }
    };

    const finishManagementAction = async message => {
        setEditingBranch('');
        setRenamedBranch('');
        setDeletingBranch('');
        setNotice(message);
        await Promise.all([load(), onChange ? onChange() : Promise.resolve()]);
    };

    const createBranch = async event => {
        event.preventDefault();
        const name = newBranch.trim();
        if (!name || !newBranchFrom || busy) return;
        setBusy('create');
        setError('');
        setNotice('');
        try {
            await api.createBranch(id, name, newBranchFrom);
            setNewBranch('');
            await finishManagementAction(`Created ${name} from ${newBranchFrom}.`);
        } catch (createError) {
            setError(createError.message || 'Could not create the branch.');
        } finally {
            setBusy('');
        }
    };

    const beginRename = branch => {
        setDeletingBranch('');
        setEditingBranch(branch);
        setRenamedBranch(branch);
        setError('');
        setNotice('');
    };

    const renameBranch = async branch => {
        const name = renamedBranch.trim();
        if (!name || name === branch || busy) return;
        setBusy(`rename:${branch}`);
        setError('');
        setNotice('');
        try {
            await api.renameBranch(id, branch, name);
            await finishManagementAction(`Renamed ${branch} to ${name}.`);
        } catch (renameError) {
            setError(renameError.message || 'Could not rename the branch.');
        } finally {
            setBusy('');
        }
    };

    const deleteBranch = async branch => {
        if (busy) return;
        setBusy(`delete:${branch}`);
        setError('');
        setNotice('');
        try {
            await api.deleteBranch(id, branch);
            await finishManagementAction(`Deleted ${branch}.`);
        } catch (deleteError) {
            setError(deleteError.message || 'Could not delete the branch.');
        } finally {
            setBusy('');
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

            {canManage && branches.length ? (
                <form className={styles.createBox} onSubmit={createBranch}>
                    <label>
                        <span>New branch name</span>
                        <input
                            type="text"
                            value={newBranch}
                            maxLength={100}
                            placeholder="feature-name"
                            disabled={Boolean(busy)}
                            onChange={event => setNewBranch(event.target.value)}
                        />
                    </label>
                    <label>
                        <span>Start from</span>
                        <select value={newBranchFrom} disabled={Boolean(busy)} onChange={event => setNewBranchFrom(event.target.value)}>
                            {branches.map(branch => <option key={branch.name}>{branch.name}</option>)}
                        </select>
                    </label>
                    <Button type="submit" variant="primary" busy={busy === 'create'} busyLabel="Creating…" disabled={!newBranch.trim() || !newBranchFrom || Boolean(busy)}>
                        <Plus size={16} /> Create branch
                    </Button>
                </form>
            ) : null}

            {canManage && branches.length > 1 ? (
                <section className={styles.mergeBox}>
                    <div className={styles.mergeFields}>
                        <label>Merge <select value={source} onChange={event => setSource(event.target.value)}>{availableSources.map(branch => <option key={branch.name}>{branch.name}</option>)}</select></label>
                        <span>into</span>
                        <label><span className={styles.srOnly}>Target branch</span><select value={target} onChange={event => setTarget(event.target.value)}>{branches.map(branch => <option key={branch.name}>{branch.name}</option>)}</select></label>
                        <Button variant="primary" onClick={merge} busy={busy === 'merge'} busyLabel="Merging…" disabled={!source || !target || Boolean(busy)}><GitMerge size={16} /> Merge branches</Button>
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
                    <Button variant="primary" busy={busy === 'merge'} busyLabel="Merging…" onClick={resolve}>Save resolutions and merge</Button>
                </section>
            ) : null}

            <div className={styles.list}>
                {branches.map(branch => (
                    <article className={styles.branch} key={branch.name}>
                        <GitBranch size={18} />
                        <div className={styles.branchDetails}>
                            {editingBranch === branch.name ? (
                                <form
                                    className={styles.renameForm}
                                    onSubmit={event => {
                                        event.preventDefault();
                                        renameBranch(branch.name);
                                    }}
                                >
                                    <input
                                        autoFocus
                                        type="text"
                                        value={renamedBranch}
                                        maxLength={100}
                                        aria-label={`New name for ${branch.name}`}
                                        disabled={Boolean(busy)}
                                        onChange={event => setRenamedBranch(event.target.value)}
                                    />
                                    <button type="submit" title="Save branch name" disabled={!renamedBranch.trim() || renamedBranch.trim() === branch.name || Boolean(busy)}><Check size={15} /></button>
                                    <button type="button" title="Cancel rename" disabled={Boolean(busy)} onClick={() => setEditingBranch('')}><X size={15} /></button>
                                </form>
                            ) : <strong>{branch.name}</strong>}
                            {branch.message ? <span>{branch.message}</span> : null}
                        </div>
                        <code>{branch.head.slice(0, 7)}</code>
                        {branch.date ? <time>{formatDate(branch.date)}</time> : null}
                        <span className={styles.status}>
                            {branch.current ? <span className={styles.current}>Current</span> : null}
                        </span>
                        {canManage ? (
                            <div className={styles.actions}>
                                <button type="button" title={`Rename ${branch.name}`} disabled={Boolean(busy)} onClick={() => beginRename(branch.name)}><Pencil size={15} /></button>
                                {!branch.current ? (
                                    deletingBranch === branch.name ? (
                                        <span className={styles.deleteConfirm}>
                                            Delete?
                                            <button type="button" disabled={Boolean(busy)} onClick={() => deleteBranch(branch.name)}>Yes</button>
                                            <button type="button" disabled={Boolean(busy)} onClick={() => setDeletingBranch('')}>No</button>
                                        </span>
                                    ) : (
                                        <button
                                            type="button"
                                            className={styles.deleteButton}
                                            title={`Delete ${branch.name}`}
                                            disabled={Boolean(busy)}
                                            onClick={() => {
                                                setEditingBranch('');
                                                setDeletingBranch(branch.name);
                                            }}
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    )
                                ) : null}
                            </div>
                        ) : null}
                    </article>
                ))}
                {!branches.length ? <p className={styles.state}>This project does not have saved branch history yet.</p> : null}
            </div>
        </div>
    );
};

export default ProjectBranches;
