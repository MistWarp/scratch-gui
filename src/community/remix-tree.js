const nodeTime = node => Number(node?.sharedAt || node?.created || node?.edited || 0);

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
