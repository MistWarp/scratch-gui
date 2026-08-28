import React, {useMemo} from 'react';
import {safeDate} from '../format.js';
import styles from './GitGraph.module.css';

const COLORS = ['#8b5cf6', '#06b6d4', '#f97316', '#22c55e', '#ec4899', '#eab308', '#3b82f6'];
const ROW_HEIGHT = 58;
const LANE_WIDTH = 26;
const PADDING = 14;

const layoutGraph = (graph, currentBranch) => {
    const inputBranches = Array.isArray(graph?.branches) ? graph.branches : [];
    const branches = [...new Set([currentBranch, ...inputBranches].filter(Boolean))];
    const nodes = Array.isArray(graph?.nodes) ? graph.nodes : [];
    const tips = new Map();
    for (const entry of graph?.branchLogs || []) {
        if (entry.oids?.length) tips.set(entry.oids[0], entry.branch);
    }
    const laneForBranch = branch => Math.max(0, branches.indexOf(branch));
    const rows = nodes.map((node, row) => {
        const tipBranch = tips.get(node.sha);
        const preferred = tipBranch || (node.branches || []).find(name => name === currentBranch) || node.branches?.[0];
        return {...node, row, lane: laneForBranch(preferred || currentBranch)};
    });
    const bySha = new Map(rows.map(node => [node.sha, node]));
    const edges = [];
    for (const node of rows) {
        for (const parentSha of node.parents || []) {
            const parent = bySha.get(parentSha);
            if (parent) edges.push({from: node, to: parent});
        }
    }
    const width = (Math.max(1, branches.length) * LANE_WIDTH) + (PADDING * 2);
    return {branches, rows, edges, width};
};

const point = node => ({
    x: PADDING + (node.lane * LANE_WIDTH),
    y: (node.row * ROW_HEIGHT) + (ROW_HEIGHT / 2)
});

const GitGraph = ({graph, currentBranch = 'main', onRestore, restoring}) => {
    const layout = useMemo(() => layoutGraph(graph, currentBranch), [graph, currentBranch]);
    if (!layout.rows.length) return null;
    const height = layout.rows.length * ROW_HEIGHT;
    const currentHead = graph.branchLogs?.find(entry => entry.branch === currentBranch)?.oids?.[0];
    return (
        <div className={styles.graph}>
            <div className={styles.canvas} style={{width: layout.width, height}} aria-hidden="true">
                <svg width={layout.width} height={height}>
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
                    {layout.rows.map(node => {
                        const p = point(node);
                        return (
                            <circle
                                key={node.sha}
                                cx={p.x}
                                cy={p.y}
                                r="5"
                                fill={COLORS[node.lane % COLORS.length]}
                            />
                        );
                    })}
                </svg>
            </div>
            <ol className={styles.commits} style={{height}}>
                {layout.rows.map(node => {
                    const tipBranches = layout.branches.filter(branch =>
                        graph.branchLogs?.find(entry => entry.branch === branch)?.oids?.[0] === node.sha);
                    const nodeDate = safeDate(node.date);
                    return (
                        <li key={node.sha} className={styles.commit} style={{height: ROW_HEIGHT}}>
                            <div className={styles.subject}>
                                {tipBranches.map(branch => (
                                    <span key={branch} className={styles.branch}>{branch}</span>
                                ))}
                                <span>{(node.message || 'Untitled commit').split('\n')[0]}</span>
                            </div>
                            <div className={styles.meta}>
                                <code>{node.sha.slice(0, 7)}</code>
                                {node.author ? <span>{node.author}</span> : null}
                                {nodeDate ? (
                                    <time dateTime={nodeDate.toISOString()}>
                                        {nodeDate.toLocaleString()}
                                    </time>
                                ) : null}
                                {onRestore && node.sha !== currentHead ? (
                                    <button
                                        type="button"
                                        className={styles.restore}
                                        disabled={restoring === node.sha}
                                        onClick={() => onRestore(node)}
                                    >
                                        {restoring === node.sha ? 'Restoring…' : 'Restore this version'}
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
