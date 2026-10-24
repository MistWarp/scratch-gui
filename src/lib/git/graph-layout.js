const LANE_WIDTH = 24;
const PADDING = 16;

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

export {
    LANE_WIDTH,
    PADDING,
    layoutGraph
};
