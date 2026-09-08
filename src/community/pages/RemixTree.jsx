import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
import React, {useEffect, useMemo, useState} from 'react';
import {ArrowLeft, ChevronRight, GitBranch, GitCommitHorizontal, GitFork} from 'lucide-react';
import {Link, useParams} from 'react-router-dom';
import api, {projectUrl} from '../api.js';
import {useResolvedProjectId, projectBaseUrl} from '../use-resolved-project-id.js';
import Avatar from '../components/Avatar.jsx';
import GitGraph from '../components/GitGraph.jsx';
import UserLink from '../components/UserLink.jsx';
import {timeAgo} from '../format.js';
import {buildRemixTree, layoutRemixGraph} from '../remix-tree.js';
import setPageMeta from '../page-meta.js';
import {canViewProjectSource} from '../project-source-access.js';
import {useUser} from '../UserContext.jsx';
import styles from './RemixTree.module.css';

const RemixGraph = ({tree, selectedId}) => {
    const {text: communityText} = useCommunityText();
    const model = useMemo(() => buildRemixTree(tree), [tree]);
    const graph = useMemo(() => layoutRemixGraph(tree, selectedId), [selectedId, tree]);
    return (
        <div className={styles.graphScroll}>
            <div className={styles.graph} style={{width: graph.width, height: graph.height}}>
                <svg className={styles.connections} width={graph.width} height={graph.height} aria-hidden="true">
                    {graph.edges.map(edge => {
                        const fromX = edge.from.x + 210;
                        const fromY = edge.from.y + 33;
                        const toX = edge.to.x;
                        const toY = edge.to.y + 33;
                        const middle = (fromX + toX) / 2;
                        return (
                            <path
                                key={`${edge.from.node.id}-${edge.to.node.id}`}
                                d={`M ${fromX} ${fromY} C ${middle} ${fromY}, ${middle} ${toY}, ${toX} ${toY}`}
                            />
                        );
                    })}
                </svg>
                {graph.nodes.map(entry => {
                    const node = entry.node;
                    const children = model.childrenOf(node.id);
                    const isSelected = String(node.id) === String(selectedId);
                    const age = timeAgo(node.sharedAt || node.created || node.edited);
                    return (
                        <Link
                            key={node.id}
                            className={isSelected ? styles.nodeSelected : styles.node}
                            to={`${projectUrl(node)}/remixes`}
                            aria-current={isSelected ? 'page' : null}
                            style={{left: entry.x, top: entry.y}}
                        >
                            <Avatar username={node.owner} size={30} />
                            <span className={styles.nodeText}>
                                <strong>{node.title || communityText('Untitled project')}</strong>
                                <span>{communityText('by ')}{node.owner || communityText('unknown')}{age ? ` · ${age}` : ''}</span>
                            </span>
                            {children.length ? (
                                <span
                                    className={styles.childCount}
                                    title={communityText("{value1} direct remix{value2}", {value1: children.length, value2: children.length === 1 ? '' : 'es'})}
                                >
                                    <GitFork size={13} /> {children.length}
                                </span>
                            ) : null}
                        </Link>
                    );
                })}
            </div>
        </div>
    );
};

const CommitHistory = ({id, baseUrl, history, onRetry}) => {
    const {text: communityText} = useCommunityText();
    if (!history) {
        return <p className={styles.state}>{communityText('Loading Git history…')}</p>;
    }
    if (history.restricted) {
        return <p className={styles.state}>{communityText('You do not have permission to view commits for this project.')}</p>;
    }
    if (history.error) {
        return (
            <p className={styles.state}>{communityText('Could not load Git history. ')}<button type="button" onClick={onRetry}>{communityText('Try again')}</button>
            </p>
        );
    }
    if (history.graph?.nodes?.length) {
        return <GitGraph projectId={id} graph={history.graph} currentBranch={history.branch} />;
    }
    const commits = history.commits || [];
    if (!commits.length) {
        return <p className={styles.state}>{communityText('This project has no Git history yet.')}</p>;
    }
    return (
        <ol className={styles.commitList}>
            {commits.map(commit => (
                <li key={commit.sha}>
                    <Link to={`${baseUrl}/commits/${commit.sha}`}>
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
    const {text: communityText} = useCommunityText();
    const {slug} = useParams();
    const {projectId: id, resolving, resolveError} = useResolvedProjectId();
    const {user} = useUser();
    const viewer = user?.username || '';
    const [tree, setTree] = useState(null);
    const [history, setHistory] = useState(null);
    const [historyContext, setHistoryContext] = useState('');
    const [treeError, setTreeError] = useState(false);
    const [treeAttempt, setTreeAttempt] = useState(0);
    const [historyAttempt, setHistoryAttempt] = useState(0);

    useEffect(() => {
        if (!id) return () => {};
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
        if (!id) return () => {};
        let active = true;
        setHistory(null);
        api.getProject(id).then(data => {
            if (!active) return null;
            if (!canViewProjectSource(data.project || data)) return {restricted: true};
            return api.commits(id);
        })
            .then(data => {
                if (active) {
                    setHistory(data);
                    setHistoryContext(`${viewer}:${id}`);
                }
            })
            .catch(() => {
                if (active) setHistory({error: true});
            });
        return () => {
            active = false;
        };
    }, [historyAttempt, id, viewer]);

    const model = useMemo(() => buildRemixTree(tree), [tree]);
    const selected = model.byId.get(String(id));
    const path = model.pathTo(id);
    const directRemixes = selected ? model.childrenOf(selected.id).length : 0;
    const descendants = selected ? model.descendantCount(selected.id) : 0;
    const visibleHistory = historyContext === `${viewer}:${id}` ? history : null;
    const commitCount = visibleHistory?.graph?.nodes?.length || visibleHistory?.commits?.length || 0;

    const baseUrl = projectBaseUrl({project: selected, projectId: id, vanitySlug: slug});

    useEffect(() => {
        if (selected) setPageMeta({title: `${selected.title || 'Project'} · Remix tree`});
        else setPageMeta({title: 'Remix tree'});
    }, [selected]);

    if (resolving) {
        return <main className={styles.page}><p className={styles.state}>{communityText('Finding project…')}</p></main>;
    }
    if (resolveError || (!id && treeError)) {
        return (
            <main className={styles.page}>
                <p className={styles.state}>{resolveError || communityText('Could not load this remix tree.')}</p>
            </main>
        );
    }

    return (
        <main className={styles.page}>
            <Link className={styles.back} to={baseUrl}><ArrowLeft size={15} />{communityText(' Back to project')}</Link>
            <header className={styles.header}>
                <h1>{selected?.title || communityText('Project lineage')}</h1>
                <p>{communityText('Pick any project in this remix tree to follow that branch and read its Git history.')}</p>
                {path.length ? (
                    <nav className={styles.path} aria-label={communityText('Selected remix path')}>
                        {path.map((node, index) => (
                            <React.Fragment key={node.id}>
                                {index ? <ChevronRight size={14} aria-hidden="true" /> : null}
                                <Link
                                    to={`${projectUrl(node)}/remixes`}
                                    aria-current={String(node.id) === String(id) ? 'page' : null}
                                >{node.title || communityText('Untitled project')}</Link>
                            </React.Fragment>
                        ))}
                    </nav>
                ) : null}
            </header>

            {treeError ? (
                <section className={styles.loadError}>
                    <p>{communityText('Could not load this remix tree.')}</p>
                    <button type="button" onClick={() => setTreeAttempt(value => value + 1)}>{communityText('Try again')}</button>
                </section>
            ) : (
                <div className={styles.layout}>
                    <aside className={styles.treePanel}>
                        <div className={styles.panelHeading}>
                            <div>
                                <span>{communityText('Lineage')}</span>
                                <strong>
                                    {tree ? communityText("{value1} project{value2}", {value1: tree.nodes?.length || 0, value2: tree.nodes?.length === 1 ? '' : 's'}) :
                                        communityText('Loading…')}
                                </strong>
                            </div>
                        </div>
                        {model.root ? (
                            <RemixGraph tree={tree} selectedId={id} />
                        ) : tree ? <p className={styles.state}>{communityText('No projects found in this tree.')}</p> : null}
                    </aside>

                    <section className={styles.historyPanel}>
                        <div className={styles.projectHeading}>
                            <div className={styles.projectIdentity}>
                                {selected ? <Avatar username={selected.owner} size={42} /> : null}
                                <div>
                                    <h2>{selected?.title || communityText('Git history')}</h2>
                                    {selected?.owner ? (
                                        <p>{communityText('by ')}<UserLink username={selected.owner}>{selected.owner}</UserLink></p>
                                    ) : null}
                                </div>
                            </div>
                            <Link className={styles.openProject} to={baseUrl}>{communityText('Open project')}</Link>
                        </div>
                        <dl className={styles.stats}>
                            <div>
                                <dt><GitCommitHorizontal size={14} />{communityText(' Commits')}</dt>
                                <dd>{history ? commitCount : '…'}</dd>
                            </div>
                            <div>
                                <dt><GitFork size={14} />{communityText(' Direct remixes')}</dt>
                                <dd>{tree ? directRemixes : '…'}</dd>
                            </div>
                            <div>
                                <dt><GitBranch size={14} />{communityText(' Descendants')}</dt>
                                <dd>{tree ? descendants : '…'}</dd>
                            </div>
                        </dl>
                        <div className={styles.historyHeading}>
                            <h2>{communityText('Git history')}</h2>
                            {history?.branch ? <span><GitBranch size={13} /> {history.branch}</span> : null}
                        </div>
                        <CommitHistory
                            id={id}
                            baseUrl={baseUrl}
                            history={visibleHistory}
                            onRetry={() => setHistoryAttempt(value => value + 1)}
                        />
                    </section>
                </div>
            )}
        </main>
    );
};

export default RemixTree;
