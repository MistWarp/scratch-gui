import {getCommunityLocale} from '../locale.js';
import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
import React, {useMemo} from 'react';
import {Link} from 'react-router-dom';
import {CircleDashed} from 'lucide-react';
import {safeDate} from '../format.js';
import {commitHeadline, uncommittedSummaryDetail} from '../commit-summary.js';
import UserLink from './UserLink.jsx';
import {LANE_WIDTH, PADDING, layoutGraph} from '../../lib/git/graph-layout.js';
import styles from './GitGraph.module.css';

const COLORS = ['#8b5cf6', '#06b6d4', '#f97316', '#22c55e', '#ec4899', '#eab308', '#3b82f6'];
const ROW_HEIGHT = 52;

const GitGraph = ({
    graph,
    currentBranch = 'main',
    onRestore,
    restoring,
    projectId = '',
    baseUrl = '',
    summaries = null,
    uncommitted = null
}) => {
    const {text: communityText} = useCommunityText();
    const layout = useMemo(() => layoutGraph(graph, currentBranch), [graph, currentBranch]);
    if (!layout.rows.length) return null;
    const showUncommitted = Boolean(
        uncommitted && (!uncommitted.branch || uncommitted.branch === currentBranch)
    );
    const rowOffset = showUncommitted ? 1 : 0;
    const point = node => ({
        x: PADDING + (node.lane * LANE_WIDTH),
        y: ((node.row + rowOffset) * ROW_HEIGHT) + (ROW_HEIGHT / 2)
    });
    const height = (layout.rows.length + rowOffset) * ROW_HEIGHT;
    const currentHead = graph.branchLogs?.find(entry => entry.branch === currentBranch)?.oids?.[0];
    const commitBase = baseUrl || (projectId ? `/project/${projectId}` : '');
    const uncommittedTarget = showUncommitted ?
        (layout.rows.find(node => node.sha === (uncommitted.head || currentHead)) || layout.rows[0]) :
        null;
    const uncommittedPoint = uncommittedTarget ? {
        x: PADDING + (uncommittedTarget.lane * LANE_WIDTH),
        y: ROW_HEIGHT / 2
    } : null;
    const uncommittedTargetPoint = uncommittedTarget ? point(uncommittedTarget) : null;
    const uncommittedDate = showUncommitted ? safeDate(uncommitted.date) : null;
    const uncommittedDetail = showUncommitted ?
        uncommittedSummaryDetail(uncommitted, communityText, getCommunityLocale()) :
        '';
    return (
        <div className={styles.graph}>
            <div className={styles.canvas} style={{width: layout.width, height}} aria-hidden="true">
                <svg width={layout.width} height={height}>
                    {showUncommitted && uncommittedPoint && uncommittedTargetPoint ? (
                        <path
                            d={
                                `M ${uncommittedPoint.x} ${uncommittedPoint.y} ` +
                                `L ${uncommittedTargetPoint.x} ${uncommittedTargetPoint.y}`
                            }
                            fill="none"
                            stroke="var(--status-building)"
                            strokeWidth="2"
                            strokeDasharray="4 3"
                        />
                    ) : null}
                    {layout.edges.map((edge, index) => {
                        const from = point(edge.from);
                        const to = point(edge.to);
                        const middle = (from.y + to.y) / 2;
                        return (
                            <path
                                key={`${edge.from.sha}-${edge.to.sha}-${index}`}
                                d={`M ${from.x} ${from.y} C ${from.x} ${middle}, ${to.x} ${middle}, ${to.x} ${to.y}`}
                                fill="none"
                                stroke={COLORS[edge.from.lane % COLORS.length]}
                                strokeWidth="2"
                            />
                        );
                    })}
                    {showUncommitted && uncommittedPoint ? (
                        <circle
                            className={styles.uncommittedNode}
                            cx={uncommittedPoint.x}
                            cy={uncommittedPoint.y}
                            r={5}
                        />
                    ) : null}
                    {layout.rows.map(node => {
                        const p = point(node);
                        return (
                            <circle
                                key={node.sha}
                                className={node.sha === currentHead ? styles.headNode : styles.node}
                                cx={p.x}
                                cy={p.y}
                                r={node.sha === currentHead ? 5 : 4}
                                fill={COLORS[node.lane % COLORS.length]}
                            />
                        );
                    })}
                </svg>
            </div>
            <ol className={styles.commits} style={{height}}>
                {showUncommitted ? (
                    <li
                        key="worktree"
                        className={`${styles.commit} ${styles.uncommittedRow}`}
                        style={{height: ROW_HEIGHT}}
                    >
                        {commitBase ? (
                            <Link
                                className={styles.commitHitArea}
                                to={`${commitBase}/commits/worktree`}
                                aria-label={communityText('View uncommitted changes')}
                            />
                        ) : null}
                        <div className={styles.subject}>
                            <span className={styles.uncommittedBadge}>
                                <CircleDashed size={12} aria-hidden="true" />
                                {communityText('Not committed')}
                            </span>
                            <span>{communityText('Uncommitted changes')}</span>
                        </div>
                        <div className={styles.meta}>
                            <span>{communityText('Working copy')}</span>
                            {uncommitted.author ? (
                                <UserLink className={styles.author} username={uncommitted.author}>
                                    {uncommitted.author}
                                </UserLink>
                            ) : null}
                            {uncommittedDate ? (
                                <time dateTime={uncommittedDate.toISOString()}>
                                    {uncommittedDate.toLocaleString(getCommunityLocale())}
                                </time>
                            ) : null}
                            {uncommittedDetail ? (
                                <span className={styles.detail}>{uncommittedDetail}</span>
                            ) : null}
                        </div>
                    </li>
                ) : null}
                {layout.rows.map(node => {
                    const tipBranches = layout.branches.filter(branch =>
                        graph.branchLogs?.find(entry => entry.branch === branch)?.oids?.[0] === node.sha);
                    const nodeDate = safeDate(node.date);
                    const commitUrl = commitBase ? `${commitBase}/commits/${node.sha}` : '';
                    const summary = summaries?.[node.sha];
                    const headline = commitHeadline(node.message, summary, communityText, getCommunityLocale());
                    return (
                        <li key={node.sha} className={styles.commit} style={{height: ROW_HEIGHT}}>
                            {commitUrl ? (
                                <Link
                                    className={styles.commitHitArea}
                                    to={commitUrl}
                                    aria-current={node.sha === currentHead ? 'page' : null}
                                    aria-label={communityText('View commit {value1}', {
                                        value1: headline.title
                                    })}
                                />
                            ) : null}
                            <div className={styles.subject}>
                                {tipBranches.map(branch => (
                                    <span key={branch} className={styles.branch}>{branch}</span>
                                ))}
                                <span>{headline.title}</span>
                            </div>
                            <div className={styles.meta}>
                                <code>{node.sha.slice(0, 7)}</code>
                                {node.author ? (
                                    <UserLink className={styles.author} username={node.author}>
                                        {node.author}
                                    </UserLink>
                                ) : null}
                                {nodeDate ? (
                                    <time dateTime={nodeDate.toISOString()}>
                                        {nodeDate.toLocaleString(getCommunityLocale())}
                                    </time>
                                ) : null}
                                {headline.detail ? (
                                    <span className={styles.detail}>{headline.detail}</span>
                                ) : null}
                                {onRestore && node.sha !== currentHead ? (
                                    <button
                                        type="button"
                                        className={styles.restore}
                                        disabled={restoring === node.sha}
                                        onClick={() => onRestore(node)}
                                    >
                                        {restoring === node.sha ?
                                            communityText('Restoring…') :
                                            communityText('Restore this version')}
                                    </button>
                                ) : null}
                            </div>
                        </li>
                    );
                })}
            </ol>
        </div>
    );
};

export {layoutGraph};
export default GitGraph;
