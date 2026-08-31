const nodeTime = node => Number(node?.sharedAt || node?.created || node?.edited || 0);
const NODE_WIDTH = 210;
const NODE_HEIGHT = 66;
const COLUMN_GAP = 76;
const ROW_GAP = 22;
const GRAPH_PADDING = 22;

export const buildRemixTree = tree => {
    const nodes = Array.isArray(tree?.nodes) ? tree.nodes : [];
    const byId = new Map(nodes.map(node => [String(node.id), node]));
    const children = new Map();

    for (const node of nodes) {
        const parentId = String(node.remixParent || '');
        if (!children.has(parentId)) children.set(parentId, []);
        children.get(parentId).push(node);
    }
    for (const list of children.values()) list.sort((a, b) => nodeTime(a) - nodeTime(b));

    const root = byId.get(String(tree?.root || '')) || nodes[0] || null;
    const childrenOf = id => children.get(String(id)) || [];
    const pathTo = id => {
        const path = [];
        const seen = new Set();
        let node = byId.get(String(id));
        while (node && !seen.has(String(node.id))) {
            path.unshift(node);
            seen.add(String(node.id));
            node = byId.get(String(node.remixParent || ''));
        }
        return path;
    };
    const descendantCount = id => {
        const seen = new Set();
        const visit = parentId => {
            let count = 0;
            for (const child of childrenOf(parentId)) {
                const childId = String(child.id);
                if (seen.has(childId)) continue;
                seen.add(childId);
                count += 1 + visit(childId);
            }
            return count;
        };
        seen.add(String(id));
        return visit(id);
    };

    return {byId, childrenOf, descendantCount, pathTo, root};
};

export const remixBranchView = (tree, selectedId) => {
    const model = buildRemixTree(tree);
    const selected = model.byId.get(String(selectedId));
    if (!selected) return tree;
    const visible = new Set(model.pathTo(selectedId).map(node => String(node.id)));
    const visit = node => {
        const id = String(node.id);
        if (visible.has(id) && id !== String(selectedId)) return;
        visible.add(id);
        for (const child of model.childrenOf(id)) visit(child);
    };
    visit(selected);
    return {
        ...tree,
        nodes: (tree?.nodes || []).filter(node => visible.has(String(node.id)))
    };
};

export const layoutRemixGraph = (tree, selectedId = tree?.root) => {
    const visibleTree = remixBranchView(tree, selectedId);
    const model = buildRemixTree(visibleTree);
    const positioned = [];
    const visited = new Set();
    let nextRow = 0;
    let maxDepth = 0;

    const place = (node, depth) => {
        const id = String(node.id);
        if (visited.has(id)) return null;
        visited.add(id);
        maxDepth = Math.max(maxDepth, depth);
        const childPositions = model.childrenOf(id)
            .map(child => place(child, depth + 1))
            .filter(Boolean);
        const y = childPositions.length ?
            childPositions.reduce((sum, child) => sum + child.y, 0) / childPositions.length :
            GRAPH_PADDING + ((nextRow++) * (NODE_HEIGHT + ROW_GAP));
        const entry = {
            node,
            depth,
            x: GRAPH_PADDING + (depth * (NODE_WIDTH + COLUMN_GAP)),
            y
        };
        positioned.push(entry);
        return entry;
    };

    if (model.root) place(model.root, 0);
    for (const node of (visibleTree?.nodes || [])) {
        if (!visited.has(String(node.id))) {
            nextRow += positioned.length ? 1 : 0;
            place(node, 0);
        }
    }

    positioned.sort((a, b) => a.depth - b.depth || a.y - b.y);
    const byId = new Map(positioned.map(entry => [String(entry.node.id), entry]));
    const edges = positioned.reduce((result, entry) => {
        const parent = byId.get(String(entry.node.remixParent || ''));
        if (parent) result.push({from: parent, to: entry});
        return result;
    }, []);
    const bottom = positioned.reduce((largest, entry) => Math.max(largest, entry.y + NODE_HEIGHT), 0);
    return {
        edges,
        height: Math.max(150, bottom + GRAPH_PADDING),
        nodes: positioned,
        width: Math.max(280, (GRAPH_PADDING * 2) + NODE_WIDTH + (maxDepth * (NODE_WIDTH + COLUMN_GAP)))
    };
};
