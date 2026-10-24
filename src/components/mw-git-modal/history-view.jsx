import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, {Suspense, useMemo} from 'react';
import {defineMessages, injectIntl, intlShape} from 'react-intl';
import {Download, FilePen, GitCommitHorizontal, RotateCcw} from 'lucide-react';

import {LANE_WIDTH, PADDING, layoutGraph} from '../../lib/git/graph-layout.js';

import styles from './history-view.css';

const HistoryDiffPanel = React.lazy(() => import('./history-diff-panel.jsx'));

const messages = defineMessages({
    heading: {
        id: 'mw.git.historyView.heading',
        defaultMessage: 'Project history',
        description: 'Heading of the commit list in the project history window'
    },
    uncommitted: {
        id: 'mw.git.historyView.uncommitted',
        defaultMessage: 'Uncommitted changes',
        description: 'Entry at the top of the project history for edits that are not committed yet'
    },
    uncommittedMeta: {
        id: 'mw.git.historyView.uncommittedMeta',
        defaultMessage: '{count, plural, one {# file changed} other {# files changed}} since the last commit',
        description: 'Details under the uncommitted changes entry in the project history'
    },
    untitled: {
        id: 'mw.git.historyView.untitled',
        defaultMessage: 'Untitled commit',
        description: 'Shown for a commit without a message in the project history'
    },
    loadMore: {
        id: 'mw.git.historyView.loadMore',
        defaultMessage: 'Load older commits',
        description: 'Button at the bottom of the project history that loads more commits'
    },
    empty: {
        id: 'mw.git.historyView.empty',
        defaultMessage: 'No commits yet.',
        description: 'Shown when the project history has no commits'
    },
    pick: {
        id: 'mw.git.historyView.pick',
        defaultMessage: 'Choose a commit to see what changed.',
        description: 'Shown in the project history detail pane when nothing is selected'
    },
    loading: {
        id: 'mw.git.historyView.loading',
        defaultMessage: 'Loading changes…',
        description: 'Shown while the changes of a commit are loading in the project history'
    },
    failed: {
        id: 'mw.git.historyView.failed',
        defaultMessage: 'Could not load the changes for this commit.',
        description: 'Shown when the changes of a commit could not be loaded in the project history'
    },
    compareWith: {
        id: 'mw.git.historyView.compareWith',
        defaultMessage: 'Compare with',
        description: 'Label of the menu that picks which commit the selected commit is compared against'
    },
    previousCommit: {
        id: 'mw.git.historyView.previousCommit',
        defaultMessage: 'Previous commit',
        description: 'Compare menu option that compares a commit with the commit before it'
    },
    lastCommit: {
        id: 'mw.git.historyView.lastCommit',
        defaultMessage: 'Last commit',
        description: 'Shown as the comparison for uncommitted changes in the project history'
    },
    firstCommit: {
        id: 'mw.git.historyView.firstCommit',
        defaultMessage: 'This is the first commit, so everything in it is new.',
        description: 'Shown above the changes of the first commit in the project history'
    },
    restore: {
        id: 'mw.git.historyView.restore',
        defaultMessage: 'Restore this commit',
        description: 'Button that replaces the editor project with the selected commit'
    },
    download: {
        id: 'mw.git.historyView.download',
        defaultMessage: 'Download as .sb3',
        description: 'Button that downloads the selected commit as a Scratch project file'
    },
    byline: {
        id: 'mw.git.historyView.byline',
        defaultMessage: '{author}, {time}',
        description: 'Author and time of a commit in the project history, for example "mist, 3 hours ago"'
    },
    current: {
        id: 'mw.git.historyView.current',
        defaultMessage: 'Current',
        description: 'Label on the commit the project is currently at in the project history'
    }
});

const ROW_HEIGHT = 52;
const LANE_COLORS = ['#8b5cf6', '#06b6d4', '#f97316', '#22c55e', '#ec4899', '#eab308', '#3b82f6'];
const RELATIVE_UNITS = [
    ['year', 365 * 24 * 3600],
    ['month', 30 * 24 * 3600],
    ['week', 7 * 24 * 3600],
    ['day', 24 * 3600],
    ['hour', 3600],
    ['minute', 60],
    ['second', 1]
];

const firstLine = text => String(text || '').split('\n')[0].trim();

const restOfMessage = text => String(text || '').split('\n')
    .slice(1)
    .join('\n')
    .trim();

const relativeTime = (locale, timestamp) => {
    if (!timestamp) return '';
    const seconds = Math.round(timestamp - (Date.now() / 1000));
    const [unit, size] = RELATIVE_UNITS.find(([, length]) => Math.abs(seconds) >= length) || ['second', 1];
    try {
        return new Intl.RelativeTimeFormat(locale, {numeric: 'auto'}).format(Math.round(seconds / size), unit);
    } catch (e) {
        return new Date(timestamp * 1000).toLocaleString();
    }
};

const absoluteTime = (locale, timestamp) => {
    if (!timestamp) return '';
    try {
        return new Date(timestamp * 1000).toLocaleString(locale);
    } catch (e) {
        return new Date(timestamp * 1000).toISOString();
    }
};

const authorOf = commit => (commit && commit.author && commit.author.name) || '';
const timestampOf = commit => (commit && commit.author && commit.author.timestamp) || 0;

const bylineOf = (t, locale, commit) => {
    const time = relativeTime(locale, timestampOf(commit));
    const author = authorOf(commit);
    return author ? t(messages.byline, {author, time}) : time;
};

const Lanes = ({layout, headOid, top}) => {
    if (!layout.rows.length) return null;
    const point = node => ({
        x: PADDING + (node.lane * LANE_WIDTH),
        y: top + (node.row * ROW_HEIGHT) + (ROW_HEIGHT / 2)
    });
    const height = top + (layout.rows.length * ROW_HEIGHT);
    return (
        <svg
            aria-hidden="true"
            className={styles.lanes}
            height={height}
            width={layout.width}
        >
            {layout.edges.map((edge, index) => {
                const from = point(edge.from);
                const to = point(edge.to);
                const middle = (from.y + to.y) / 2;
                return (
                    <path
                        d={`M ${from.x} ${from.y} C ${from.x} ${middle}, ${to.x} ${middle}, ${to.x} ${to.y}`}
                        fill="none"
                        key={`${edge.from.sha}-${edge.to.sha}-${index}`}
                        stroke={LANE_COLORS[edge.from.lane % LANE_COLORS.length]}
                        strokeWidth="2"
                    />
                );
            })}
            {layout.rows.map(node => {
                const p = point(node);
                const head = node.sha === headOid;
                return (
                    <circle
                        className={head ? styles.headNode : null}
                        cx={p.x}
                        cy={p.y}
                        fill={LANE_COLORS[node.lane % LANE_COLORS.length]}
                        key={node.sha}
                        r={head ? 5.5 : 4}
                    />
                );
            })}
        </svg>
    );
};

Lanes.propTypes = {
    headOid: PropTypes.string,
    layout: PropTypes.object.isRequired,
    top: PropTypes.number.isRequired
};

const HistoryView = props => {
    const {
        branchColors,
        busy,
        changeCount,
        currentBranch,
        detail,
        graph,
        hasMore,
        intl,
        selection
    } = props;
    const locale = intl.locale;
    const t = (descriptor, values) => intl.formatMessage(descriptor, values);
    const nodes = useMemo(() => (graph && Array.isArray(graph.nodes) ? graph.nodes : []), [graph]);
    const layout = useMemo(() => layoutGraph({
        branches: graph && graph.branches,
        branchLogs: graph && graph.branchLogs,
        nodes: nodes.map(node => ({...node, sha: node.oid}))
    }, currentBranch), [graph, nodes, currentBranch]);
    const headOid = useMemo(() => {
        const logs = (graph && graph.branchLogs) || [];
        const current = logs.find(entry => entry.branch === currentBranch);
        return current && current.oids ? current.oids[0] : null;
    }, [graph, currentBranch]);
    const showWorktree = changeCount > 0;
    const top = showWorktree ? ROW_HEIGHT : 0;
    const selectedIndex = selection && selection.kind === 'commit' ?
        nodes.findIndex(node => node.oid === selection.oid) : -1;
    const selectedNode = selectedIndex === -1 ? null : nodes[selectedIndex];
    const olderNodes = selectedIndex === -1 ? [] : nodes.slice(selectedIndex + 1);

    const renderDetailBody = () => {
        if (!selection) return <p className={styles.placeholder}>{t(messages.pick)}</p>;
        if (!detail || detail.status === 'loading') {
            return <p className={styles.placeholder}>{t(messages.loading)}</p>;
        }
        if (detail.status === 'error') {
            return (
                <p className={classNames(styles.placeholder, styles.errorText)}>
                    {t(messages.failed)}
                    {detail.error ? <span className={styles.errorDetail}>{detail.error}</span> : null}
                </p>
            );
        }
        return (
            <React.Fragment>
                {selection.kind === 'commit' && !detail.data.base ? (
                    <p className={styles.note}>{t(messages.firstCommit)}</p>
                ) : null}
                <Suspense fallback={<p className={styles.placeholder}>{t(messages.loading)}</p>}>
                    <HistoryDiffPanel
                        assets={detail.data.assets}
                        diff={detail.data.diff}
                        fileTexts={detail.data.fileTexts}
                        locale={locale}
                    />
                </Suspense>
            </React.Fragment>
        );
    };

    const renderDetailHeader = () => {
        if (!selection) return null;
        if (selection.kind === 'worktree') {
            return (
                <header className={styles.detailHeader}>
                    <div className={styles.detailTitleRow}>
                        <FilePen
                            aria-hidden="true"
                            className={styles.detailIcon}
                            size={18}
                        />
                        <h3 className={styles.detailTitle}>{t(messages.uncommitted)}</h3>
                    </div>
                    <div className={styles.detailMeta}>
                        <span>{t(messages.compareWith)}</span>
                        <strong>{t(messages.lastCommit)}</strong>
                    </div>
                </header>
            );
        }
        if (!selectedNode) return null;
        const commit = selectedNode.commit || {};
        const body = restOfMessage(commit.message);
        return (
            <header className={styles.detailHeader}>
                <div className={styles.detailTitleRow}>
                    <GitCommitHorizontal
                        aria-hidden="true"
                        className={styles.detailIcon}
                        size={18}
                    />
                    <h3 className={styles.detailTitle}>{firstLine(commit.message) || t(messages.untitled)}</h3>
                    <div className={styles.detailActions}>
                        <button
                            className={styles.actionButton}
                            data-oid={selectedNode.oid}
                            disabled={busy}
                            type="button"
                            onClick={props.onRestoreCommit}
                        >
                            <RotateCcw
                                aria-hidden="true"
                                size={15}
                            />
                            {t(messages.restore)}
                        </button>
                        <button
                            aria-label={t(messages.download)}
                            className={styles.iconButton}
                            data-oid={selectedNode.oid}
                            disabled={busy}
                            title={t(messages.download)}
                            type="button"
                            onClick={props.onDownloadCommit}
                        >
                            <Download
                                aria-hidden="true"
                                size={15}
                            />
                        </button>
                    </div>
                </div>
                {body ? <p className={styles.detailBody}>{body}</p> : null}
                <div className={styles.detailMeta}>
                    <span title={absoluteTime(locale, timestampOf(commit))}>
                        {bylineOf(t, locale, commit)}
                    </span>
                    <code className={styles.hash}>{selectedNode.oid.slice(0, 7)}</code>
                    {olderNodes.length ? (
                        <label className={styles.compare}>
                            <span>{t(messages.compareWith)}</span>
                            <select
                                className={styles.compareSelect}
                                value={selection.base || ''}
                                onChange={props.onChangeBase}
                            >
                                <option value="">{t(messages.previousCommit)}</option>
                                {olderNodes.map(node => (
                                    <option
                                        key={node.oid}
                                        value={node.oid}
                                    >
                                        {`${node.oid.slice(0, 7)} ${firstLine(node.commit && node.commit.message) ||
                                            t(messages.untitled)}`}
                                    </option>
                                ))}
                            </select>
                        </label>
                    ) : null}
                </div>
            </header>
        );
    };

    return (
        <div className={styles.history}>
            <section
                aria-label={t(messages.heading)}
                className={styles.listPane}
            >
                {nodes.length || showWorktree ? (
                    <div className={styles.listScroll}>
                        <div
                            className={styles.rows}
                            style={{paddingInlineStart: `${layout.width}px`}}
                        >
                            <Lanes
                                headOid={headOid}
                                layout={layout}
                                top={top}
                            />
                            <ol className={styles.rowList}>
                                {showWorktree ? (
                                    <li style={{height: ROW_HEIGHT}}>
                                        <button
                                            aria-pressed={selection && selection.kind === 'worktree'}
                                            disabled={busy}
                                            className={classNames(styles.row, styles.worktreeRow, {
                                                [styles.rowSelected]: selection && selection.kind === 'worktree'
                                            })}
                                            type="button"
                                            onClick={props.onSelectWorktree}
                                        >
                                            <span className={styles.rowTitle}>{t(messages.uncommitted)}</span>
                                            <span className={styles.rowMeta}>
                                                {t(messages.uncommittedMeta, {count: changeCount})}
                                            </span>
                                        </button>
                                    </li>
                                ) : null}
                                {nodes.map(node => {
                                    const commit = node.commit || {};
                                    const selected = selection && selection.kind === 'commit' &&
                                        selection.oid === node.oid;
                                    const tips = (graph.branchLogs || [])
                                        .filter(entry => entry.oids && entry.oids[0] === node.oid)
                                        .map(entry => entry.branch);
                                    return (
                                        <li
                                            key={node.oid}
                                            style={{height: ROW_HEIGHT}}
                                        >
                                            <button
                                                aria-pressed={Boolean(selected)}
                                                className={classNames(styles.row, {[styles.rowSelected]: selected})}
                                                data-oid={node.oid}
                                                type="button"
                                                onClick={props.onSelectCommit}
                                            >
                                                <span className={styles.rowTitle}>
                                                    {tips.map(branch => (
                                                        <span
                                                            className={styles.branchChip}
                                                            key={branch}
                                                            style={{backgroundColor: branchColors[branch] || '#888'}}
                                                        >
                                                            {branch}
                                                        </span>
                                                    ))}
                                                    {node.oid === headOid ? (
                                                        <span className={styles.currentChip}>
                                                            {t(messages.current)}
                                                        </span>
                                                    ) : null}
                                                    <span className={styles.rowMessage}>
                                                        {firstLine(commit.message) || t(messages.untitled)}
                                                    </span>
                                                </span>
                                                <span
                                                    className={styles.rowMeta}
                                                    title={absoluteTime(locale, timestampOf(commit))}
                                                >
                                                    {bylineOf(t, locale, commit)}
                                                </span>
                                            </button>
                                        </li>
                                    );
                                })}
                            </ol>
                        </div>
                        {hasMore ? (
                            <button
                                className={styles.loadMore}
                                disabled={busy}
                                type="button"
                                onClick={props.onLoadMore}
                            >
                                {t(messages.loadMore)}
                            </button>
                        ) : null}
                    </div>
                ) : (
                    <p className={styles.placeholder}>{t(messages.empty)}</p>
                )}
            </section>
            <section className={styles.detailPane}>
                {renderDetailHeader()}
                <div className={styles.detailScroll}>
                    {renderDetailBody()}
                </div>
            </section>
        </div>
    );
};

HistoryView.propTypes = {
    branchColors: PropTypes.object,
    busy: PropTypes.bool,
    changeCount: PropTypes.number,
    currentBranch: PropTypes.string,
    detail: PropTypes.shape({
        data: PropTypes.object,
        error: PropTypes.string,
        status: PropTypes.oneOf(['loading', 'ready', 'error'])
    }),
    graph: PropTypes.shape({
        branchLogs: PropTypes.array,
        branches: PropTypes.array,
        nodes: PropTypes.array
    }),
    hasMore: PropTypes.bool,
    intl: intlShape.isRequired,
    onChangeBase: PropTypes.func.isRequired,
    onDownloadCommit: PropTypes.func.isRequired,
    onLoadMore: PropTypes.func.isRequired,
    onRestoreCommit: PropTypes.func.isRequired,
    onSelectCommit: PropTypes.func.isRequired,
    onSelectWorktree: PropTypes.func.isRequired,
    selection: PropTypes.shape({
        base: PropTypes.string,
        kind: PropTypes.oneOf(['worktree', 'commit']),
        oid: PropTypes.string
    })
};

HistoryView.defaultProps = {
    branchColors: {},
    changeCount: 0
};

export default injectIntl(HistoryView);
