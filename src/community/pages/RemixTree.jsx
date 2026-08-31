import React, {useEffect, useMemo, useState} from 'react';
import {ArrowLeft, ChevronRight, GitBranch, GitCommitHorizontal, GitFork} from 'lucide-react';
import {Link, useParams} from 'react-router-dom';
import api, {projectUrl} from '../api.js';
import Avatar from '../components/Avatar.jsx';
import GitGraph from '../components/GitGraph.jsx';
import UserLink from '../components/UserLink.jsx';
import {timeAgo} from '../format.js';
import {buildRemixTree} from '../remix-tree.js';
import setPageMeta from '../page-meta.js';
import styles from './RemixTree.module.css';

const RemixNode = ({node, model, selectedId}) => {
    const children = model.childrenOf(node.id);
    const isSelected = String(node.id) === String(selectedId);
    const age = timeAgo(node.sharedAt || node.created || node.edited);
    return (
        <li className={styles.treeItem}>
            <Link
                className={isSelected ? styles.nodeSelected : styles.node}
                to={`${projectUrl(node.id)}/remixes`}
                aria-current={isSelected ? 'page' : null}
            >
                <Avatar username={node.owner} size={30} />
                <span className={styles.nodeText}>
                    <strong>{node.title || 'Untitled project'}</strong>
                    <span>by {node.owner || 'unknown'}{age ? ` · ${age}` : ''}</span>
                </span>
                {children.length ? (
                    <span
                        className={styles.childCount}
                        title={`${children.length} direct remix${children.length === 1 ? '' : 'es'}`}
                    >
                        <GitFork size={13} /> {children.length}
                    </span>
                ) : null}
            </Link>
            {children.length ? (
                <ul className={styles.treeChildren}>
                    {children.map(child => (
                        <RemixNode key={child.id} node={child} model={model} selectedId={selectedId} />
                    ))}
                </ul>
            ) : null}
        </li>
    );
};

const CommitHistory = ({id, history, onRetry}) => {
    if (!history) {
        return <p className={styles.state}>Loading Git history…</p>;
    }
    if (history.error) {
        return (
            <p className={styles.state}>
                Could not load Git history. <button type="button" onClick={onRetry}>Try again</button>
            </p>
        );
    }
    if (history.graph?.nodes?.length) {
        return <GitGraph projectId={id} graph={history.graph} currentBranch={history.branch} />;
    }
    const commits = history.commits || [];
    if (!commits.length) {
        return <p className={styles.state}>This project has no Git history yet.</p>;
    }
    return (
        <ol className={styles.commitList}>
            {commits.map(commit => (
                <li key={commit.sha}>
                    <Link to={`${projectUrl(id)}/commits/${commit.sha}`}>
                        <GitCommitHorizontal size={15} />
                        <span>{(commit.message || 'Untitled commit').split('\n')[0]}</span>
                        <code>{commit.sha.slice(0, 7)}</code>
                    </Link>
                </li>
            ))}
        </ol>
    );
};

const RemixTree = () => {
    const {id} = useParams();
    const [tree, setTree] = useState(null);
    const [history, setHistory] = useState(null);
    const [treeError, setTreeError] = useState(false);
    const [treeAttempt, setTreeAttempt] = useState(0);
    const [historyAttempt, setHistoryAttempt] = useState(0);

    useEffect(() => {
        let active = true;
        setTree(null);
        setTreeError(false);
        api.remixTree(id)
            .then(data => {
                if (active) setTree(data);
            })
            .catch(() => {
                if (active) setTreeError(true);
            });
        return () => {
            active = false;
        };
    }, [id, treeAttempt]);

    useEffect(() => {
        let active = true;
        setHistory(null);
        api.commits(id)
            .then(data => {
                if (active) setHistory(data);
            })
            .catch(() => {
                if (active) setHistory({error: true});
            });
        return () => {
            active = false;
        };
    }, [historyAttempt, id]);

    const model = useMemo(() => buildRemixTree(tree), [tree]);
    const selected = model.byId.get(String(id));
    const path = model.pathTo(id);
    const directRemixes = selected ? model.childrenOf(selected.id).length : 0;
    const descendants = selected ? model.descendantCount(selected.id) : 0;
    const commitCount = history?.graph?.nodes?.length || history?.commits?.length || 0;

    useEffect(() => {
        if (selected) setPageMeta({title: `${selected.title || 'Project'} · Remix tree`});
        else setPageMeta({title: 'Remix tree'});
    }, [selected]);

    return (
        <main className={styles.page}>
            <Link className={styles.back} to={projectUrl(id)}><ArrowLeft size={15} /> Back to project</Link>
            <header className={styles.header}>
                <div className={styles.eyebrow}><GitFork size={15} /> Remix tree</div>
                <h1>{selected?.title || 'Project lineage'}</h1>
                <p>Pick any project in the tree to follow that branch and read its Git history.</p>
                {path.length ? (
                    <nav className={styles.path} aria-label="Selected remix path">
                        {path.map((node, index) => (
                            <React.Fragment key={node.id}>
                                {index ? <ChevronRight size={14} aria-hidden="true" /> : null}
                                <Link
                                    to={`${projectUrl(node.id)}/remixes`}
                                    aria-current={String(node.id) === String(id) ? 'page' : null}
                                >{node.title || 'Untitled project'}</Link>
                            </React.Fragment>
                        ))}
                    </nav>
                ) : null}
            </header>

            {treeError ? (
                <section className={styles.loadError}>
                    <p>Could not load this remix tree.</p>
                    <button type="button" onClick={() => setTreeAttempt(value => value + 1)}>Try again</button>
                </section>
            ) : (
                <div className={styles.layout}>
                    <aside className={styles.treePanel}>
                        <div className={styles.panelHeading}>
                            <div>
                                <span>Lineage</span>
                                <strong>
                                    {tree ? `${tree.nodes?.length || 0} project${tree.nodes?.length === 1 ? '' : 's'}` :
                                        'Loading…'}
                                </strong>
                            </div>
                        </div>
                        {model.root ? (
                            <ul className={styles.tree}>
                                <RemixNode node={model.root} model={model} selectedId={id} />
                            </ul>
                        ) : tree ? <p className={styles.state}>No projects found in this tree.</p> : null}
                    </aside>

                    <section className={styles.historyPanel}>
                        <div className={styles.projectHeading}>
                            <div className={styles.projectIdentity}>
                                {selected ? <Avatar username={selected.owner} size={42} /> : null}
                                <div>
                                    <h2>{selected?.title || 'Git history'}</h2>
                                    {selected?.owner ? (
                                        <p>by <UserLink username={selected.owner}>{selected.owner}</UserLink></p>
                                    ) : null}
                                </div>
                            </div>
                            <Link className={styles.openProject} to={projectUrl(id)}>Open project</Link>
                        </div>
                        <dl className={styles.stats}>
                            <div>
                                <dt><GitCommitHorizontal size={14} /> Commits</dt>
                                <dd>{history ? commitCount : '…'}</dd>
                            </div>
                            <div>
                                <dt><GitFork size={14} /> Direct remixes</dt>
                                <dd>{tree ? directRemixes : '…'}</dd>
                            </div>
                            <div>
                                <dt><GitBranch size={14} /> Descendants</dt>
                                <dd>{tree ? descendants : '…'}</dd>
                            </div>
                        </dl>
                        <div className={styles.historyHeading}>
                            <h2>Git history</h2>
                            {history?.branch ? <span><GitBranch size={13} /> {history.branch}</span> : null}
                        </div>
                        <CommitHistory
                            id={id}
                            history={history}
                            onRetry={() => setHistoryAttempt(value => value + 1)}
                        />
                    </section>
                </div>
            )}
        </main>
    );
};

export default RemixTree;
