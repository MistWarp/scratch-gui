import React, {useEffect, useState, useCallback, useMemo, useRef} from 'react';
import {useParams, Link} from 'react-router-dom';
import {
    Heart, HeartCrack, ArrowLeft, Play, GitFork, ExternalLink, Pencil, Plus, X, Check,
    Globe, EyeOff, MessageSquareOff, MessageSquare, ImageUp, MonitorPlay, Upload, Blocks,
    ShieldCheck, ShieldAlert
} from 'lucide-react';
import api, {projectUrl, editorUrl, embedUrl} from '../api';
import Avatar from '../components/Avatar.jsx';
import {useUser} from '../UserContext.jsx';
import {timeAgo} from '../format';
import CommentThread from '../components/CommentThread.jsx';
import DiffView from '../components/DiffView.jsx';
import styles from './Project.module.css';

const formatDate = ms => {
    if (!ms) return null;
    try {
        return new Date(ms).toLocaleDateString([], {year: 'numeric', month: 'short', day: 'numeric'});
    } catch (e) {
        return null;
    }
};

const CATEGORY_NAMES = {
    motion: 'Motion',
    looks: 'Looks',
    sound: 'Sound',
    event: 'Events',
    control: 'Control',
    sensing: 'Sensing',
    operator: 'Operators',
    data: 'Variables',
    procedures: 'My Blocks',
    argument: 'My Blocks',
    pen: 'Pen',
    music: 'Music'
};

const CATEGORY_COLORS = {
    motion: '#4C97FF',
    looks: '#9966FF',
    sound: '#CF63CF',
    event: '#FFBF00',
    control: '#FFAB19',
    sensing: '#5CB1D6',
    operator: '#59C059',
    data: '#FF8C1A',
    procedures: '#FF6680',
    argument: '#FF6680',
    pen: '#0FBD8C'
};

const catLabel = prefix => CATEGORY_NAMES[prefix] || (prefix.charAt(0).toUpperCase() + prefix.slice(1));
const catColor = prefix => CATEGORY_COLORS[prefix] || 'var(--accent-strong)';

const topFive = counts => Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);

const getCustomExtensions = data => {
    const urls = {...(data.extensionURLs || {})};
    for (const target of data.targets || []) {
        Object.assign(urls, target.extensionURLs || {});
    }
    return Object.keys(urls);
};

const analyzeBlocks = data => {
    const categories = {};
    let total = 0;
    for (const target of data.targets || []) {
        for (const block of Object.values(target.blocks || {})) {
            if (!block || typeof block !== 'object' || !block.opcode) continue;
            total += 1;
            const prefix = block.opcode.split('_')[0];
            categories[prefix] = (categories[prefix] || 0) + 1;
        }
    }
    const topCategories = topFive(categories)
        .map(([prefix, count]) => ({label: catLabel(prefix), count, color: catColor(prefix)}));
    return {total, topCategories};
};

const Project = () => {
    const {id} = useParams();
    const {user} = useUser();
    const [project, setProject] = useState(null);
    const [error, setError] = useState(null);
    const [actionError, setActionError] = useState(null);
    const [tab, setTab] = useState('Comments');
    const [title, setTitle] = useState('');
    const [savingTitle, setSavingTitle] = useState(false);
    const [thumbnailMenu, setThumbnailMenu] = useState(false);
    const [thumbnailStatus, setThumbnailStatus] = useState('idle');
    const thumbInput = useRef(null);
    const stageFrame = useRef(null);
    const [blockStats, setBlockStats] = useState(null);
    const [customExtensions, setCustomExtensions] = useState([]);
    const [unsandboxed, setUnsandboxed] = useState(false);

    const load = useCallback(() => api.getProject(id)
        .then(data => setProject(data.project))
        .catch(() => setError('Project not found.')), [id]);

    useEffect(() => {
        setProject(null);
        setError(null);
        setActionError(null);
        setTab('Comments');
        load();
        api.view(id).catch(() => {});
    }, [id, load]);

    useEffect(() => {
        if (project) setTitle(project.title || '');
    }, [project]);

    const projectJsonUrl = project && project.projectJsonUrl;
    useEffect(() => {
        setBlockStats(null);
        setCustomExtensions([]);
        setUnsandboxed(false);
        let cancelled = false;
        if (projectJsonUrl) {
            fetch(projectJsonUrl)
                .then(response => response.json())
                .then(data => {
                    if (cancelled) return;
                    setBlockStats(analyzeBlocks(data));
                    setCustomExtensions(getCustomExtensions(data));
                })
                .catch(() => !cancelled && setBlockStats(null));
        }
        return () => {
            cancelled = true;
        };
    }, [projectJsonUrl]);

    const runUnsandboxed = () => {
        // eslint-disable-next-line no-alert
        const ok = window.confirm(
            'This project uses custom extensions.\n\n' +
            'Running it without the sandbox gives it full access to your MistWarp account. ' +
            'It could read your login session, act as you, or change your data. ' +
            'Only continue if you trust the person who made this project.'
        );
        if (ok) setUnsandboxed(true);
    };

    useEffect(() => {
        let timeout;
        if (thumbnailStatus === 'saved') {
            timeout = setTimeout(() => setThumbnailStatus('idle'), 2500);
        }
        return () => clearTimeout(timeout);
    }, [thumbnailStatus]);

    const saveTitle = async () => {
        if (!project || !project.isOwner || savingTitle) return;
        const next = title.trim();
        if (!next) {
            setTitle(project.title);
            setActionError('Project titles cannot be empty.');
            return;
        }
        if (next === project.title) return;
        try {
            setSavingTitle(true);
            await api.updateProject(id, {title: next});
            setProject(current => ({...current, title: next}));
            setActionError(null);
        } catch (e) {
            setTitle(project.title);
            setActionError(e.message || 'Could not update the title.');
        } finally {
            setSavingTitle(false);
        }
    };

    const handleTitleKeyDown = event => {
        if (event.key === 'Enter') {
            event.currentTarget.blur();
        }
    };

    const react = async type => {
        if (!user) return;
        try {
            await api.reactProject(id, type);
            load();
        } catch (e) {
            setActionError(e.message || 'Could not react.');
        }
    };

    const remix = async () => {
        if (!user) return;
        try {
            const result = await api.remix(id);
            window.location.href = editorUrl({platformProject: result.id});
        } catch (e) {
            setActionError('Could not remix this project.');
        }
    };

    const toggleShared = async () => {
        try {
            await (project.shared ? api.unpublish(id) : api.publish(id));
            setActionError(null);
            load();
        } catch (e) {
            setActionError(e.message || 'Could not update sharing.');
        }
    };

    const toggleComments = async () => {
        try {
            await api.updateProject(id, {commentsOff: !project.commentsOff});
            setActionError(null);
            load();
        } catch (e) {
            setActionError(e.message || 'Could not update comments.');
        }
    };

    const pickThumbnail = event => {
        const file = event.target.files && event.target.files[0];
        event.target.value = '';
        if (!file) return;
        setThumbnailStatus('saving');
        api.setThumbnail(id, file)
            .then(() => {
                setActionError(null);
                setThumbnailStatus('saved');
                load();
            })
            .catch(e => {
                setThumbnailStatus('idle');
                setActionError(e.message || 'Could not set thumbnail.');
            });
    };

    const useStageThumbnail = () => {
        setThumbnailMenu(false);
        const frame = stageFrame.current;
        if (!frame || !frame.contentWindow) {
            setActionError('Stage is not ready yet.');
            return;
        }
        setThumbnailStatus('saving');
        let timeout = 0;
        const onMessage = event => {
            if (event.source !== frame.contentWindow || !event.data || event.data.type !== 'mw:stage-capture') {
                return;
            }
            window.removeEventListener('message', onMessage);
            clearTimeout(timeout);
            if (event.data.error || !event.data.dataURL) {
                setThumbnailStatus('idle');
                setActionError('Could not capture the current stage.');
                return;
            }
            fetch(event.data.dataURL)
                .then(response => response.blob())
                .then(blob => api.setThumbnail(id, blob))
                .then(() => {
                    setActionError(null);
                    setThumbnailStatus('saved');
                    load();
                })
                .catch(e => {
                    setThumbnailStatus('idle');
                    setActionError(e.message || 'Could not set thumbnail.');
                });
        };
        timeout = setTimeout(() => {
            window.removeEventListener('message', onMessage);
            setThumbnailStatus('idle');
            setActionError('Could not capture the current stage.');
        }, 5000);
        window.addEventListener('message', onMessage);
        frame.contentWindow.postMessage({type: 'mw:capture-stage'}, '*');
    };

    const chooseThumbnailUpload = () => {
        setThumbnailMenu(false);
        thumbInput.current.click();
    };

    const commentSource = useMemo(() => ({
        list: () => api.getComments(id),
        add: (content, parent) => api.addComment(id, content, parent),
        remove: commentId => api.deleteComment(id, commentId),
        react: (commentId, type) => api.reactComment(id, commentId, type)
    }), [id]);

    if (error) {
        return <main className={styles.page}><p className={styles.status}>{error}</p></main>;
    }
    if (!project) {
        return <main className={styles.page}><p className={styles.status}>Loading…</p></main>;
    }

    const seeInsideHref = editorUrl({platformProject: project.id});

    const commentTabs = project.repo ? ['Comments', 'History', 'Pull requests'] : ['Comments'];
    const sharedDate = formatDate(project.sharedAt || project.created);

    return (
        <main className={styles.page}>
            <div className={styles.topBar}>
                <div className={styles.titleBlock}>
                    <Link to={`/users/${project.owner}`}>
                        <Avatar
                            username={project.owner}
                            size={44}
                        />
                    </Link>
                    <div className={styles.titleText}>
                        <div className={styles.titleRow}>
                            {project.isOwner ? (
                                <input
                                    className={styles.titleInput}
                                    value={title}
                                    maxLength={100}
                                    aria-label="Project title"
                                    disabled={savingTitle}
                                    onChange={event => setTitle(event.target.value)}
                                    onBlur={saveTitle}
                                    onKeyDown={handleTitleKeyDown}
                                />
                            ) : <h1>{project.title}</h1>}
                            {project.shared ? null : (
                                <span className={styles.draftBadge}>
                                    <EyeOff size={12} />
                                    Unshared
                                </span>
                            )}
                        </div>
                        <Link
                            to={`/users/${project.owner}`}
                            className={styles.byline}
                        >by {project.owner}</Link>
                    </div>
                </div>
                <div className={styles.topActions}>
                    {project.isOwner ? (
                        <button
                            className={styles.remixButton}
                            onClick={toggleShared}
                        >
                            {project.shared ? <EyeOff size={16} /> : <Globe size={16} />}
                            {project.shared ? 'Unshare' : 'Share'}
                        </button>
                    ) : null}
                    <button
                        className={styles.remixButton}
                        onClick={remix}
                        disabled={!user}
                    >
                        <GitFork size={16} />
                        Remix
                    </button>
                    <a
                        className={styles.primary}
                        href={seeInsideHref}
                    >
                        <ExternalLink size={16} />
                        See inside
                    </a>
                </div>
            </div>

            {actionError ? <div className={styles.actionError}>{actionError}</div> : null}
            {thumbnailStatus !== 'idle' ? (
                <div className={styles.actionSuccess}>
                    {thumbnailStatus === 'saving' ? 'Saving thumbnail…' : 'Thumbnail updated.'}
                </div>
            ) : null}

            <div className={styles.stageRow}>
                <div className={styles.stageCol}>
                    <div className={styles.stageWrap}>
                        <div className={styles.stageSizer}>
                            <iframe
                                key={unsandboxed ? 'unsandboxed' : 'sandboxed'}
                                ref={stageFrame}
                                className={styles.stage}
                                src={embedUrl(project, {unsandboxed})}
                                title={project.title}
                                allow="autoplay; fullscreen"
                                sandbox={unsandboxed ?
                                    null :
                                    'allow-scripts allow-forms allow-pointer-lock allow-downloads'}
                            />
                        </div>
                    </div>
                    {customExtensions.length ? (
                        <div className={unsandboxed ? styles.sandboxNoticeOpen : styles.sandboxNotice}>
                            {unsandboxed ? <ShieldAlert size={16} /> : <ShieldCheck size={16} />}
                            <span className={styles.sandboxText}>
                                {unsandboxed ?
                                    'Running with full access to your account. Only for projects you trust.' :
                                    'Uses custom extensions, running in a sandbox. Saved data will not persist.'}
                            </span>
                            {unsandboxed ? (
                                <button
                                    className={styles.sandboxButton}
                                    onClick={() => setUnsandboxed(false)}
                                >Back to sandbox</button>
                            ) : (
                                <button
                                    className={styles.sandboxButton}
                                    onClick={runUnsandboxed}
                                >Run without sandbox</button>
                            )}
                        </div>
                    ) : null}
                    <div className={styles.statsBar}>
                        <button
                            className={project.myReaction === 'heart' ? styles.statOn : styles.statButton}
                            onClick={() => react('heart')}
                            disabled={!user}
                        >
                            <Heart
                                size={16}
                                fill={project.myReaction === 'heart' ? 'currentColor' : 'none'}
                            />
                            {project.loveCount || 0}
                        </button>
                        <button
                            className={project.myReaction === 'brokenheart' ? styles.statOn : styles.statButton}
                            onClick={() => react('brokenheart')}
                            disabled={!user}
                        >
                            <HeartCrack
                                size={16}
                                fill={project.myReaction === 'brokenheart' ? 'currentColor' : 'none'}
                            />
                            {project.brokenHeartCount || 0}
                        </button>
                        <span className={styles.statMuted}>
                            <Play size={15} />
                            {project.views || 0}
                        </span>
                        {blockStats ? (
                            <span className={styles.statMuted}>
                                <Blocks size={15} />
                                {blockStats.total.toLocaleString()} blocks
                            </span>
                        ) : null}
                        <span className={styles.statSpacer} />
                        {project.isOwner ? (
                            <div className={styles.thumbnailPicker}>
                                <button
                                    className={styles.statButton}
                                    title="Set the project thumbnail"
                                    disabled={thumbnailStatus === 'saving'}
                                    onClick={() => setThumbnailMenu(open => !open)}
                                >
                                    <ImageUp size={15} />
                                    {thumbnailStatus === 'saving' ? 'Saving…' : 'Thumbnail'}
                                </button>
                                {thumbnailMenu ? (
                                    <div className={styles.thumbnailMenu}>
                                        <button onClick={useStageThumbnail}>
                                            <MonitorPlay size={15} />
                                            Use current stage
                                        </button>
                                        <button onClick={chooseThumbnailUpload}>
                                            <Upload size={15} />
                                            Upload image
                                        </button>
                                    </div>
                                ) : null}
                            </div>
                        ) : null}
                        <input
                            ref={thumbInput}
                            className={styles.hiddenInput}
                            type="file"
                            accept="image/png,image/jpeg"
                            onChange={pickThumbnail}
                        />
                        {sharedDate ? <span className={styles.statMuted}>{sharedDate}</span> : null}
                    </div>
                </div>

                <InfoPanel
                    project={project}
                    onSaved={load}
                />
            </div>

            <div className={styles.bottomGrid}>
                <section className={styles.commentsCol}>
                    <div className={styles.commentsHead}>
                        {commentTabs.length > 1 ? (
                            <nav className={styles.tabs}>
                                {commentTabs.map(name => (
                                    <button
                                        key={name}
                                        className={name === tab ? styles.tabActive : styles.tab}
                                        onClick={() => setTab(name)}
                                    >{name}</button>
                                ))}
                            </nav>
                        ) : (
                            <h2 className={styles.colTitle}>Comments</h2>
                        )}
                        {project.isOwner && tab === 'Comments' ? (
                            <button
                                className={styles.commentsToggle}
                                title={project.commentsOff ? 'Turn comments on' : 'Turn comments off'}
                                onClick={toggleComments}
                            >
                                {project.commentsOff ? <MessageSquare size={14} /> : <MessageSquareOff size={14} />}
                                {project.commentsOff ? 'Turn on comments' : 'Turn off comments'}
                            </button>
                        ) : null}
                    </div>
                    {tab === 'Comments' && (
                        <CommentThread
                            source={commentSource}
                            canModerate={project.isOwner}
                            disabled={Boolean(project.commentsOff)}
                        />
                    )}
                    {tab === 'History' && <HistoryList id={id} />}
                    {tab === 'Pull requests' && (
                        <PullList
                            id={id}
                            canMerge={project.isOwner}
                            onChange={load}
                        />
                    )}
                </section>

                <aside className={styles.remixCol}>
                    <BlockStats stats={blockStats} />
                    <h2 className={styles.colTitle}>Remixes</h2>
                    <RemixTree id={id} />
                </aside>
            </div>
        </main>
    );
};

const INFO_TABS = ['Instructions', 'Notes', 'Credits'];

const InfoPanel = ({project, onSaved}) => {
    const [tab, setTab] = useState('Instructions');
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [instructions, setInstructions] = useState(project.instructions || '');
    const [notes, setNotes] = useState(project.notes || '');
    const [credits, setCredits] = useState(project.credits || []);

    const startEdit = () => {
        setInstructions(project.instructions || '');
        setNotes(project.notes || '');
        setCredits(project.credits || []);
        setEditing(true);
    };

    const save = async () => {
        setSaving(true);
        try {
            await api.updateProject(project.id, {
                instructions,
                notes,
                credits: credits.filter(c => c.who && c.who.trim())
            });
            setEditing(false);
            onSaved();
        } catch (e) {
            // eslint-disable-next-line no-alert
            alert('Could not save.');
        } finally {
            setSaving(false);
        }
    };

    const updateCredit = (i, field, value) => {
        setCredits(list => list.map((c, idx) => (idx === i ? {...c, [field]: value} : c)));
    };
    const addCredit = () => setCredits(list => [...list, {who: '', role: ''}]);
    const removeCredit = i => setCredits(list => list.filter((c, idx) => idx !== i));

    return (
        <aside className={styles.sidePanel}>
            <div className={styles.panelTabs}>
                {INFO_TABS.map(name => (
                    <button
                        key={name}
                        className={name === tab ? styles.panelTabActive : styles.panelTab}
                        onClick={() => setTab(name)}
                    >{name}</button>
                ))}
                {project.isOwner ? (
                    editing ? (
                        <button
                            className={styles.panelEdit}
                            onClick={save}
                            disabled={saving}
                            title="Save"
                        >
                            <Check size={15} />
                        </button>
                    ) : (
                        <button
                            className={styles.panelEdit}
                            onClick={startEdit}
                            title="Edit"
                        >
                            <Pencil size={14} />
                        </button>
                    )
                ) : null}
            </div>
            <div className={styles.panelBody}>
                {tab === 'Instructions' && (
                    editing ? (
                        <textarea
                            className={styles.panelInput}
                            value={instructions}
                            maxLength={5000}
                            placeholder="How do you play or use this project?"
                            onChange={e => setInstructions(e.target.value)}
                        />
                    ) : project.instructions ? (
                        <p className={styles.panelText}>{project.instructions}</p>
                    ) : <p className={styles.panelEmpty}>No instructions provided.</p>
                )}

                {tab === 'Notes' && (
                    editing ? (
                        <textarea
                            className={styles.panelInput}
                            value={notes}
                            maxLength={5000}
                            placeholder="Anything else you want to share"
                            onChange={e => setNotes(e.target.value)}
                        />
                    ) : project.notes ? (
                        <p className={styles.panelText}>{project.notes}</p>
                    ) : <p className={styles.panelEmpty}>No notes yet.</p>
                )}

                {tab === 'Credits' && (
                    editing ? (
                        <div className={styles.creditEditor}>
                            {credits.map((c, i) => (
                                <div
                                    key={i}
                                    className={styles.creditEditRow}
                                >
                                    <input
                                        className={styles.creditWho}
                                        value={c.who}
                                        placeholder="username"
                                        onChange={e => updateCredit(i, 'who', e.target.value)}
                                    />
                                    <input
                                        className={styles.creditRole}
                                        value={c.role}
                                        placeholder="what they did"
                                        onChange={e => updateCredit(i, 'role', e.target.value)}
                                    />
                                    <button
                                        className={styles.creditRemove}
                                        onClick={() => removeCredit(i)}
                                        title="Remove"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                            <button
                                className={styles.creditAdd}
                                onClick={addCredit}
                            >
                                <Plus size={14} />
                                Add credit
                            </button>
                        </div>
                    ) : (project.credits && project.credits.length) ? (
                        <ul className={styles.creditList}>
                            {project.credits.map((c, i) => (
                                <li key={i}>
                                    <Link
                                        to={`/users/${c.who}`}
                                        className={styles.creditName}
                                    >{c.who}</Link>
                                    {c.role ? <span className={styles.creditRoleText}> {c.role}</span> : null}
                                </li>
                            ))}
                        </ul>
                    ) : <p className={styles.panelEmpty}>No credits listed.</p>
                )}

                {!editing && project.remixParent ? (
                    <Link
                        to={projectUrl(project.remixParent)}
                        className={styles.remixOf}
                    >
                        <GitFork size={13} />
                        Based on another project
                    </Link>
                ) : null}
            </div>
        </aside>
    );
};

const BarChart = ({title, rows}) => {
    const max = rows.length ? rows[0].count : 0;
    return (
        <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>{title}</h3>
            <ul className={styles.chartRows}>
                {rows.map(row => (
                    <li
                        key={row.label}
                        className={styles.chartRow}
                    >
                        <span
                            className={styles.chartLabel}
                            title={row.label}
                        >{row.label}</span>
                        <span className={styles.chartTrack}>
                            <span
                                className={styles.chartBar}
                                style={{width: `${max ? (row.count / max) * 100 : 0}%`, background: row.color}}
                            />
                        </span>
                        <span className={styles.chartCount}>{row.count}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};

const BlockStats = ({stats}) => {
    if (!stats || stats.total < 500) return null;
    return (
        <div className={styles.chartStack}>
            <BarChart
                title="Top categories"
                rows={stats.topCategories}
            />
        </div>
    );
};

const RemixTreeNode = ({node, childrenOf, currentId}) => (
    <li>
        <Link
            className={node.id === currentId ? styles.treeNodeCurrent : styles.treeNode}
            to={projectUrl(node.id)}
        >
            <Avatar
                username={node.owner}
                size={22}
            />
            <span className={styles.treeTitle}>{node.title}</span>
            <span className={styles.treeMeta}>
                {node.owner} · {timeAgo(node.sharedAt || node.created || node.edited)}
            </span>
        </Link>
        {childrenOf(node.id).length ? (
            <ul className={styles.treeChildren}>
                {childrenOf(node.id).map(child => (
                    <RemixTreeNode
                        key={child.id}
                        node={child}
                        childrenOf={childrenOf}
                        currentId={currentId}
                    />
                ))}
            </ul>
        ) : null}
    </li>
);

const RemixTree = ({id}) => {
    const [tree, setTree] = useState(null);
    useEffect(() => {
        setTree(null);
        api.remixTree(id).then(setTree).catch(() => setTree({nodes: []}));
    }, [id]);
    if (!tree) return <p className={styles.status}>Loading…</p>;
    const nodes = tree.nodes || [];
    if (nodes.length < 2) return <p className={styles.sideEmpty}>No remixes yet.</p>;
    const childrenOf = parentId => nodes
        .filter(node => node.remixParent === parentId)
        .sort((a, b) => (a.sharedAt || a.created || 0) - (b.sharedAt || b.created || 0));
    const root = nodes.find(node => node.id === tree.root);
    if (!root) return <p className={styles.sideEmpty}>No remixes yet.</p>;
    return (
        <ul className={styles.tree}>
            <RemixTreeNode
                node={root}
                childrenOf={childrenOf}
                currentId={id}
            />
        </ul>
    );
};

const HistoryList = ({id}) => {
    const [commits, setCommits] = useState(null);
    useEffect(() => {
        api.commits(id).then(d => setCommits(d.commits || [])).catch(() => setCommits([]));
    }, [id]);
    if (!commits) return <p className={styles.status}>Loading…</p>;
    if (!commits.length) return <p className={styles.status}>No commit history available.</p>;
    return (
        <ul className={styles.commitList}>
            {commits.map(commit => (
                <li key={commit.sha}>
                    <code>{commit.sha.slice(0, 7)}</code>
                    <span className={styles.commitMsg}>{commit.message.split('\n')[0]}</span>
                    <span className={styles.muted}>{commit.author}</span>
                </li>
            ))}
        </ul>
    );
};

const PullList = ({id, canMerge, onChange}) => {
    const [pulls, setPulls] = useState(null);
    const [openPull, setOpenPull] = useState(null);
    const [diff, setDiff] = useState('');

    const reload = useCallback(() => {
        api.pulls(id).then(d => setPulls(d.pulls || [])).catch(() => setPulls([]));
    }, [id]);

    useEffect(reload, [reload]);

    const view = async pull => {
        setOpenPull(pull);
        setDiff('');
        try {
            setDiff(await api.pullDiff(id, pull.index));
        } catch (e) {
            setDiff('Could not load diff.');
        }
    };

    const merge = async pull => {
        try {
            await api.mergePull(id, pull.index);
            setOpenPull(null);
            reload();
            onChange();
        } catch (e) {
            // eslint-disable-next-line no-alert
            alert(e.code === 'conflict' ?
                'This pull request has conflicts. Open it in the editor and pull to resolve.' :
                'Merge failed.');
        }
    };

    if (!pulls) return <p className={styles.status}>Loading…</p>;
    if (openPull) {
        return (
            <div>
                <button
                    className={styles.backLink}
                    onClick={() => setOpenPull(null)}
                >
                    <ArrowLeft size={14} />
                    Back to pull requests
                </button>
                <h3>{openPull.title}</h3>
                <p className={styles.muted}>
                    #{openPull.index} by {openPull.user} into {openPull.baseBranch}
                </p>
                {canMerge && openPull.state === 'open' ? (
                    <button
                        className={styles.primary}
                        onClick={() => merge(openPull)}
                    >Merge</button>
                ) : null}
                <DiffView diff={diff} />
            </div>
        );
    }
    if (!pulls.length) return <p className={styles.status}>No pull requests.</p>;
    return (
        <ul className={styles.plainList}>
            {pulls.map(pull => (
                <li key={pull.index}>
                    <button
                        className={styles.linkButton}
                        onClick={() => view(pull)}
                    >
                        #{pull.index} {pull.title}
                    </button>
                    <span className={styles.muted}> by {pull.user} · {pull.state}</span>
                </li>
            ))}
        </ul>
    );
};

export default Project;
